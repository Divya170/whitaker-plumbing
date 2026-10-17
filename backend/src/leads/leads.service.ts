import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, LessThan, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Lead } from './lead.entity';
import { csvSafe, formatPhone, isHoneypot, LEAD_STATUSES, LeadStatus, publicRef, RequestInput, STATUS_LABELS, todayIso, validateRequest, WINDOW_LABELS } from './request-validation';
import { NotifierService } from './notifier.service';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';
import { clampInt } from '../common/utils';

const MAX_NOTIFY_ATTEMPTS = 5;
const OUTBOX_INTERVAL_MS = 2 * 60_000;
const DAY_MS = 86_400_000;

export interface LeadQuery {
  q?: string;
  status?: string;
  service?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/** Thrown when the contract wants a 422 with field errors. */
export class LeadValidationError extends UnprocessableEntityException {
  constructor(public readonly fieldErrors: Record<string, string>) {
    super({ ok: false, errors: fieldErrors });
  }
}

@Injectable()
export class LeadsService implements OnModuleInit, OnModuleDestroy {
  // Structured logs never include names, emails, phone numbers or descriptions.
  private readonly logger = new Logger('Leads');
  private timers: ReturnType<typeof setInterval>[] = [];

  constructor(
    @InjectRepository(Lead) private readonly repo: Repository<Lead>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
    private readonly notifier: NotifierService,
  ) {}

  /** Starts the email outbox retry loop and the daily retention purge. */
  onModuleInit() {
    if (this.notifier.configured) this.timers.push(setInterval(() => void this.retryOutbox(), OUTBOX_INTERVAL_MS));
    if (this.retentionMonths() > 0) this.timers.push(setInterval(() => void this.purgeExpired(), DAY_MS));
  }

  onModuleDestroy() {
    this.timers.forEach(clearInterval);
  }

  retentionMonths() {
    return clampInt(process.env.LEAD_RETENTION_MONTHS, 0, 120, 0);
  }

  /** Option lists for the request form (nothing hard-coded in the frontend). */
  async formOptions() {
    const s = await this.settings.get();
    return {
      services: await this.services.formOptions(),
      windows: [
        { value: 'morning', label: 'Morning' },
        { value: 'afternoon', label: 'Afternoon' },
        { value: 'flexible', label: 'Flexible' },
      ],
      today: todayIso(),
      open: s.requestsOpen,
    };
  }

  private ipHash(ip: string) {
    return ip ? createHash('sha256').update(`${process.env.SESSION_SECRET || 'dev'}:${ip}`).digest('hex').slice(0, 32) : '';
  }

  /**
   * POST /api/service-requests. Returns null for a honeypot hit (caller answers 200 {ok:true} — the design shows a normal confirmation),
   * otherwise the public reference — only after the transaction has committed.
   */
  async submit(input: RequestInput, meta: { ip: string; userAgent: string }): Promise<{ id: string; service: string; location: string; preferredDate: string | null; preferredWindow: string } | null> {
    if (isHoneypot(input)) {
      this.logger.warn(JSON.stringify({ event: 'lead.discarded', reason: 'honeypot' }));
      return null;
    }
    const s = await this.settings.get();
    if (!s.requestsOpen) throw new ServiceUnavailableException({ ok: false, error: 'requests_paused' });

    const allowed = (await this.services.formOptions()).map((o) => o.value);
    const { value, errors } = validateRequest(input, { services: allowed });
    if (Object.keys(errors).length) throw new LeadValidationError(errors);

    const lead = await this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(Lead);
      const row = await repo.save(
        repo.create({
          ...value,
          status: 'new',
          notes: '',
          ipHash: this.ipHash(meta.ip),
          userAgent: (meta.userAgent || '').slice(0, 300),
          notifyStatus: this.notifier.configured ? 'pending' : 'disabled',
          notifyAttempts: 0,
          notifyError: null,
          closedAt: null,
        }),
      );
      row.publicRef = publicRef(row.id);
      return repo.save(row);
    });

    this.logger.log(JSON.stringify({ event: 'lead.created', ref: lead.publicRef, service: lead.service }));
    // The email is sent after commit; failures are retried by the outbox and the visitor still gets 201.
    if (this.notifier.configured) void this.notify(lead);
    return {
      id: lead.publicRef as string,
      service: lead.service,
      location: lead.location,
      preferredDate: lead.preferredDate,
      preferredWindow: lead.preferredWindow,
    };
  }

  private async notify(l: Lead) {
    const labels = await this.services.labels();
    try {
      await this.notifier.sendNewLead(l, labels.get(l.service) || l.service, (await this.settings.get()).email);
      await this.repo.update({ id: l.id }, { notifyStatus: 'sent', notifyError: null, notifyAttempts: l.notifyAttempts + 1 });
    } catch (err) {
      const msg = (err as Error).message?.slice(0, 240) || 'Unknown error';
      this.logger.error(JSON.stringify({ event: 'lead.notify_failed', ref: l.publicRef, attempt: l.notifyAttempts + 1 }));
      await this.repo.update({ id: l.id }, { notifyStatus: 'failed', notifyError: msg, notifyAttempts: l.notifyAttempts + 1 });
    }
  }

  /** Outbox: retries pending/failed notifications (older than a minute) up to 5 attempts. */
  async retryOutbox() {
    if (!this.notifier.configured) return 0;
    const due: Lead[] = await this.repo.find({
      where: { notifyStatus: In(['pending', 'failed']), notifyAttempts: LessThan(MAX_NOTIFY_ATTEMPTS), createdAt: LessThan(new Date(Date.now() - 60_000)) },
      take: 20,
    });
    for (const l of due) await this.notify(l);
    return due.length;
  }

  async resendNotification(id: number) {
    if (!this.notifier.configured) throw new BadRequestException('Email notifications are not configured (set SMTP_HOST in backend/.env).');
    const l = await this.get(id);
    await this.notify({ ...l, notifyAttempts: 0 } as Lead);
    return this.detail(id);
  }

  /** Retention: deletes completed/closed and spam leads older than LEAD_RETENTION_MONTHS (0 = disabled). */
  async purgeExpired() {
    const months = this.retentionMonths();
    if (!months) return { deleted: 0, months: 0 };
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const closed = await this.repo.delete({ status: In(['closed', 'completed']), closedAt: LessThan(cutoff) });
    const spam = await this.repo.delete({ status: 'spam', updatedAt: LessThan(cutoff) });
    const deleted = (closed.affected ?? 0) + (spam.affected ?? 0);
    this.logger.log(JSON.stringify({ event: 'lead.purged', count: deleted, months }));
    return { deleted, months };
  }

  // ---------- admin ----------

  private filtered(p: LeadQuery) {
    const qb = this.repo.createQueryBuilder('x');
    if (p.status && (LEAD_STATUSES as readonly string[]).includes(p.status)) qb.andWhere('x.status = :status', { status: p.status });
    else if (p.status !== 'all') qb.andWhere("x.status != 'spam'"); // spam hidden unless asked for
    if (p.service && p.service !== 'all') qb.andWhere('x.service = :service', { service: p.service });
    const q = (p.q || '').trim().toLowerCase().slice(0, 100);
    if (q) {
      const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const digits = q.replace(/\D/g, '');
      qb.andWhere(
        new Brackets((w) => {
          for (const col of ['publicRef', 'name', 'email', 'location', 'issue', 'notes']) w.orWhere(`LOWER(COALESCE(x.${col}, '')) LIKE :like ESCAPE '\\'`, { like });
          if (digits.length >= 3) w.orWhere('x.phoneE164 LIKE :dig', { dig: `%${digits}%` });
        }),
      );
    }
    qb.orderBy('x.createdAt', p.sort === 'oldest' ? 'ASC' : 'DESC').addOrderBy('x.id', p.sort === 'oldest' ? 'ASC' : 'DESC');
    return qb;
  }

  async counts() {
    const raw = await this.repo.createQueryBuilder('x').select('x.status', 'status').addSelect('COUNT(*)', 'n').groupBy('x.status').getRawMany<{ status: string; n: string }>();
    const out: Record<string, number> = { all: 0, new: 0, contacted: 0, in_progress: 0, completed: 0, closed: 0, spam: 0 };
    for (const r of raw) {
      out[r.status] = Number(r.n);
      if (r.status !== 'spam') out.all += Number(r.n);
    }
    return out;
  }

  private async shape(rows: Lead[]) {
    const labels = await this.services.labels();
    return rows.map((r) => ({
      ...r,
      ipHash: undefined,
      serviceLabel: labels.get(r.service) || r.service,
      phone: formatPhone(r.phoneE164),
      statusLabel: STATUS_LABELS[r.status] || r.status,
      windowLabel: WINDOW_LABELS[r.preferredWindow] || r.preferredWindow,
    }));
  }

  async list(p: LeadQuery) {
    const limit = clampInt(p.limit, 1, 100, 20);
    const qb = this.filtered(p);
    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(clampInt(p.page, 1, 100_000, 1), pages);
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    return {
      items: await this.shape(items),
      total,
      page,
      pages,
      limit,
      counts: await this.counts(),
      services: await this.serviceFilterOptions(),
      notificationsConfigured: this.notifier.configured,
      retentionMonths: this.retentionMonths(),
    };
  }

  private async serviceFilterOptions() {
    const labels = await this.services.labels();
    return Array.from(labels.entries()).map(([value, label]) => ({ value, label }));
  }

  async get(id: number) {
    const x = await this.repo.findOne({ where: { id } });
    if (!x) throw new NotFoundException('Lead not found.');
    return x;
  }

  async detail(id: number) {
    return (await this.shape([await this.get(id)]))[0];
  }

  async update(id: number, patch: { status?: string; notes?: string }) {
    const x = await this.get(id);
    const errors: Record<string, string> = {};
    if (patch.status !== undefined && !(LEAD_STATUSES as readonly string[]).includes(patch.status)) errors.status = 'Choose a valid status.';
    if (patch.notes !== undefined && patch.notes.length > 5000) errors.notes = 'Keep notes under 5,000 characters.';
    if (Object.keys(errors).length) throw new BadRequestException({ message: 'Please correct the highlighted field.', errors });
    if (patch.status !== undefined && patch.status !== x.status) {
      x.status = patch.status as LeadStatus;
      x.closedAt = x.status === 'closed' || x.status === 'completed' ? new Date() : null;
    }
    if (patch.notes !== undefined) x.notes = patch.notes.replace(/\r\n/g, '\n').trim();
    await this.repo.save(x);
    return this.detail(id);
  }

  async remove(id: number) {
    await this.repo.remove(await this.get(id));
    return { ok: true };
  }

  async exportCsv(p: LeadQuery) {
    const rows = await this.shape(await this.filtered(p).getMany());
    const cols: [string, (r: (typeof rows)[number]) => unknown][] = [
      ['Reference', (r) => r.publicRef],
      ['Submitted', (r) => new Date(r.createdAt).toISOString()],
      ['Status', (r) => r.statusLabel],
      ['Name', (r) => r.name],
      ['Phone (E.164)', (r) => r.phoneE164],
      ['Email', (r) => r.email],
      ['Service', (r) => r.serviceLabel],
      ['Location', (r) => r.location],
      ['Issue', (r) => r.issue],
      ['Preferred date', (r) => r.preferredDate],
      ['Preferred time of day', (r) => r.windowLabel],
      ['Additional information', (r) => r.extra],
      ['Notes', (r) => r.notes],
    ];
    return [cols.map(([c]) => csvSafe(c)).join(','), ...rows.map((r) => cols.map(([, f]) => csvSafe(f(r))).join(','))].join('\r\n');
  }
}

