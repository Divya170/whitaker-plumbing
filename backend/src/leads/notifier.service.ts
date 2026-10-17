import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Lead } from './lead.entity';
import { formatPhone, WINDOW_LABELS } from './request-validation';

/** HTML-encode user text for email output (store plain text, encode on output). */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/**
 * Sends the "new service request" email to the business. Enabled only when SMTP_HOST is set —
 * otherwise each lead is stored with notify_status = "disabled" (design: "Email provider not configured").
 */
@Injectable()
export class NotifierService {
  private readonly logger = new Logger('Notifier');
  private transporter: Transporter | null = null;

  get configured() {
    return !!process.env.SMTP_HOST;
  }

  private transport(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
      });
    }
    return this.transporter;
  }

  async sendNewLead(l: Lead, serviceLabel: string, fallbackTo: string | null): Promise<void> {
    const to = process.env.NOTIFY_TO || fallbackTo;
    if (!to) throw new Error('No recipient: set NOTIFY_TO or the business email in Settings.');
    const link = `${(process.env.ADMIN_URL || 'http://localhost:3000/admin/leads').replace(/\/$/, '')}/${l.id}`;
    const rows: [string, string][] = [
      ['Reference', l.publicRef || String(l.id)],
      ['Service', serviceLabel],
      ['Location', l.location],
      ['Name', l.name],
      ['Phone', formatPhone(l.phoneE164)],
      ['Email', l.email],
      ['Preferred time', [l.preferredDate, WINDOW_LABELS[l.preferredWindow] || l.preferredWindow].filter(Boolean).join(', ')],
    ];
    const extra = l.extra ? `\n\nAdditional information:\n${l.extra}` : '';
    await this.transport().sendMail({
      from: process.env.NOTIFY_FROM || 'Whitaker Plumbing Website <no-reply@localhost>',
      to,
      replyTo: l.email,
      subject: `New service request ${l.publicRef} — ${serviceLabel} (${l.location})`,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nIssue:\n${l.issue}${extra}\n\nOpen in admin: ${link}`,
      html: `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="color:#5E5850">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
        .join('')}</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;background:#F6F0E7;padding:12px">${esc(l.issue)}</p>${
        l.extra ? `<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${esc(l.extra)}</p>` : ''
      }<p><a href="${esc(link)}">Open in admin</a></p>`,
    });
    this.logger.log(JSON.stringify({ event: 'lead.notified', ref: l.publicRef }));
  }
}
