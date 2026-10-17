import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ContentService } from './content.service';
import { checkArea } from './area-lookup';
import { SessionGuard } from '../common/session';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';

class CreateContentDto {
  @IsString() type: string;
  @IsObject() fields: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class UpdateContentDto {
  @IsOptional() @IsObject() fields?: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class ReorderContentDto {
  @IsString() type: string;
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

@Controller()
export class SiteController {
  constructor(
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
    private readonly content: ContentService,
  ) {}

  /** Everything the public pages render, in one call. */
  @Get('site')
  async site() {
    const settings = await this.settings.getPublic();
    const services = await this.services.listPublished();
    const c = await this.content.publicBundle(['faq', 'benefit', 'assurance', 'step', 'tip', 'service-area']);
    const images = await this.content.siteImages();
    // Pending FAQs (no answer yet) are shown only while review flags are on, as in the design.
    const faqs = c.faq
      .map((f) => ({ id: f.id as number, q: String(f.q || ''), a: String(f.a || ''), pending: !String(f.a || '').trim(), home: f.home === 'yes' }))
      .filter((f) => settings.showContentFlags || !f.pending);
    return {
      settings,
      services,
      faqs,
      benefits: c.benefit,
      assurances: c.assurance.map((x) => String(x.text || '')),
      steps: c.step,
      tips: c.tip.map((x) => String(x.text || '')),
      areas: c['service-area'].map((x) => ({ id: x.id as number, name: String(x.name || '') })),
      images,
    };
  }

  /** GET /api/service-areas/check?q=28202 — the "Check your city or ZIP code" lookup. */
  @Get('service-areas/check')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async checkArea(@Query('q') q: string) {
    const rows = (await this.content.publicBundle(['service-area']))['service-area'];
    return checkArea(q, rows.map((r) => ({ name: String(r.name || ''), zips: Array.isArray(r.zips) ? (r.zips as string[]) : [] })));
  }
}

@Controller('admin/content')
@UseGuards(SessionGuard)
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('types')
  types() {
    return this.content.types();
  }

  @Get('counts')
  counts() {
    return this.content.counts();
  }

  @Get()
  adminList(@Query('type') type: string) {
    return this.content.adminList(type);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderContentDto) {
    return this.content.reorder(dto.type, dto.ids);
  }

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.content.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentDto) {
    return this.content.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.content.remove(id);
  }
}
