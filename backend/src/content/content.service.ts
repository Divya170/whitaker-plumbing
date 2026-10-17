import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ContentBlock } from './content-block.entity';
import { CONTENT_TYPE_MAP, CONTENT_TYPES, ContentTypeDef } from './content.schemas';
import { validateContentFields } from './content.validation';

export interface ContentWriteInput {
  type?: string;
  fields?: Record<string, unknown>;
  published?: boolean;
}

@Injectable()
export class ContentService {
  constructor(@InjectRepository(ContentBlock) private readonly repo: Repository<ContentBlock>) {}

  types() {
    return CONTENT_TYPES;
  }

  private def(type: string): ContentTypeDef {
    const def = CONTENT_TYPE_MAP.get(type);
    if (!def) throw new BadRequestException(`Unknown content type "${type}".`);
    return def;
  }

  /** Public read: published rows for the requested types, grouped by type. */
  async publicBundle(types: string[]) {
    const valid = types.filter((t) => CONTENT_TYPE_MAP.has(t) && t !== 'site-image');
    const out: Record<string, Record<string, unknown>[]> = {};
    for (const t of valid) out[t] = [];
    if (!valid.length) return out;
    const rows = await this.repo.find({ where: { type: In(valid), published: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    for (const row of rows) out[row.type].push({ id: row.id, ...row.fields });
    return out;
  }

  /** { slot: { url, alt } } for every published page photo. */
  async siteImages() {
    const rows = await this.repo.find({ where: { type: 'site-image', published: true }, order: { updatedAt: 'DESC' } });
    const map: Record<string, { url: string; alt: string }> = {};
    for (const r of rows) {
      const slot = String(r.fields.slot || '');
      if (slot && !map[slot] && r.fields.image) map[slot] = { url: String(r.fields.image), alt: String(r.fields.alt || '') };
    }
    return map;
  }

  async adminList(type: string) {
    this.def(type);
    return this.repo.find({ where: { type }, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async counts() {
    const raw = await this.repo
      .createQueryBuilder('c')
      .select('c.type', 'type')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN c.published = 1 THEN 1 ELSE 0 END)', 'published')
      .groupBy('c.type')
      .getRawMany<{ type: string; total: string; published: string }>();
    return Object.fromEntries(raw.map((r) => [r.type, { total: Number(r.total), published: Number(r.published) }]));
  }

  private validate(def: ContentTypeDef, fields: Record<string, unknown>) {
    const { value, errors } = validateContentFields(def, fields || {});
    if (Object.keys(errors).length) {
      const n = Object.keys(errors).length;
      throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
    }
    return value;
  }

  /** Page photos: publishing one hides the others in the same slot. */
  private async enforceUnique(def: ContentTypeDef, row: ContentBlock) {
    if (!def.uniqueBy || !row.published) return;
    const key = row.fields[def.uniqueBy];
    const others = await this.repo.find({ where: { type: def.type, published: true, id: Not(row.id) } });
    const clash = others.filter((o) => o.fields[def.uniqueBy as string] === key);
    if (clash.length) await this.repo.save(clash.map((o) => ({ ...o, published: false })));
  }

  async create(input: ContentWriteInput) {
    if (!input.type) throw new BadRequestException('Content type is required.');
    const def = this.def(input.type);
    const fields = this.validate(def, input.fields || {});
    const max = await this.repo
      .createQueryBuilder('c')
      .select('MAX(c.sortOrder)', 'max')
      .where('c.type = :type', { type: def.type })
      .getRawOne<{ max: number | null }>();
    const published = input.published ?? true;
    const row = await this.repo.save(this.repo.create({ type: def.type, fields, published, sortOrder: (max?.max ?? 0) + 1 }));
    await this.enforceUnique(def, row);
    return row;
  }

  async update(id: number, input: ContentWriteInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Content item not found.');
    const def = this.def(row.type);
    if (input.fields !== undefined) {
      row.fields = this.validate(def, { ...row.fields, ...input.fields });
    }
    if (input.published !== undefined) row.published = !!input.published;
    const saved = await this.repo.save(row);
    await this.enforceUnique(def, saved);
    return saved;
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Content item not found.');
    await this.repo.remove(row);
    return { ok: true };
  }

  async reorder(type: string, ids: number[]) {
    this.def(type);
    const rows = await this.repo.find({ where: { type, id: In(ids) } });
    if (rows.length !== ids.length) throw new BadRequestException('Reorder list does not match items of this type.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return this.adminList(type);
  }

  /** Used by the seeder. Idempotent per type. */
  async seedType(type: string, items: { fields: Record<string, unknown>; published?: boolean }[]) {
    if (!items.length || (await this.repo.count({ where: { type } })) > 0) return 0;
    await this.repo.save(items.map((it, i) => this.repo.create({ type, fields: it.fields, sortOrder: i + 1, published: it.published ?? true })));
    return items.length;
  }
}
