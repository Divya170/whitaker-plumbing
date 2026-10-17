import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';
import { UpdateSettingsDto } from './settings.dto';
import { mapsHref, telHref } from '../common/utils';
import { SETTINGS_SEED } from '../database/seed-data';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Settings) private readonly repo: Repository<Settings>) {}

  async ensure(): Promise<Settings> {
    const existing = await this.repo.findOne({ where: { id: 1 } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ id: 1, ...SETTINGS_SEED }));
  }

  get(): Promise<Settings> {
    return this.ensure();
  }

  async getPublic() {
    const s = await this.ensure();
    const address = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
    return {
      businessName: s.businessName,
      contactName: s.contactName,
      phone: s.phone,
      telHref: telHref(s.phone),
      email: s.email,
      mailHref: s.email ? `mailto:${s.email}` : null,
      // The address is published only once approved; until then the review tags quote it.
      addressLine1: s.showAddress ? s.addressLine1 : null,
      addressLine2: s.showAddress ? s.addressLine2 : null,
      address: s.showAddress ? address : '',
      mapsHref: s.showAddress ? mapsHref(address) : null,
      // Quoted in the TO CONFIRM tags only while review flags are on.
      pendingAddress: !s.showAddress && s.showContentFlags ? address : '',
      showAddress: s.showAddress,
      tagline: s.tagline,
      credentials: s.credentials,
      hours: s.hours,
      emergencyInfo: s.emergencyInfo,
      followUpNote: s.followUpNote,
      about: s.about,
      privacyNotice: s.privacyNotice,
      reviewNote: s.reviewNote,
      showContentFlags: s.showContentFlags,
      mobileCallBar: s.mobileCallBar,
      requestsOpen: s.requestsOpen,
    };
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const s = await this.ensure();
    const nullable = (v: string | null | undefined) => (v === undefined ? undefined : v === null || v.trim() === '' ? null : v.trim());
    const email = nullable(dto.email);
    if (email !== undefined) s.email = email ? email.toLowerCase() : null;
    for (const k of ['phone', 'addressLine1', 'addressLine2'] as const) {
      const v = nullable(dto[k]);
      if (v !== undefined) s[k] = v;
    }
    for (const k of ['businessName', 'contactName', 'tagline', 'credentials', 'hours', 'emergencyInfo', 'followUpNote', 'about', 'privacyNotice', 'reviewNote'] as const) {
      const v = dto[k];
      if (v !== undefined) s[k] = v.replace(/\r\n/g, '\n').trim();
    }
    for (const k of ['showContentFlags', 'showAddress', 'mobileCallBar', 'requestsOpen'] as const) {
      const v = dto[k];
      if (v !== undefined) s[k] = v;
    }
    return this.repo.save(s);
  }
}
