import { Body, Controller, Delete, Get, HttpCode, Logger, Param, ParseIntPipe, Patch, PayloadTooLargeException, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request, Response } from 'express';
import { LeadQuery, LeadsService } from './leads.service';
import { ServiceRequestExceptionFilter } from './request-exception.filter';
import { LEAD_STATUSES, todayIso } from './request-validation';
import { AuthedRequest, SessionGuard } from '../common/session';

const MAX_BODY_BYTES = 16 * 1024; // requests are small; reject anything larger than 16 KB
const rateMax = () => Math.max(1, Number(process.env.RATE_LIMIT_MAX) || 5);
const rateWindowMs = () => Math.max(1, Number(process.env.RATE_LIMIT_WINDOW_MIN) || 10) * 60_000;

/** Public endpoint used by the "Request Plumbing Service" form. */
@Controller('service-requests')
@UseFilters(ServiceRequestExceptionFilter)
export class ServiceRequestsController {
  constructor(private readonly leads: LeadsService) {}

  @Get('options')
  options() {
    return this.leads.formOptions();
  }

  /** 201 {ok:true,id} after commit · 200 {ok:true} for honeypot hits · 422 / 429 / 500 via the filter. */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: rateMax, ttl: rateWindowMs } })
  async create(@Body() body: Record<string, unknown>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (Buffer.byteLength(JSON.stringify(body ?? {}), 'utf8') > MAX_BODY_BYTES) throw new PayloadTooLargeException();
    const result = await this.leads.submit(body || {}, { ip: req.ip || '', userAgent: String(req.headers['user-agent'] || '') });
    if (!result) {
      res.status(200);
      return { ok: true };
    }
    res.status(201);
    return { ok: true, ...result };
  }
}

class UpdateLeadDto {
  @IsOptional() @IsIn(LEAD_STATUSES as unknown as string[], { message: 'Choose a valid status.' }) status?: string;
  @IsOptional() @IsString() @MaxLength(5000, { message: 'Keep notes under 5,000 characters.' }) notes?: string;
}

/** Admin endpoints (session cookie + CSRF on mutations, checked on every route). */
@Controller('admin/leads')
@UseGuards(SessionGuard)
export class AdminLeadsController {
  private readonly audit = new Logger('LeadAccess');

  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() q: LeadQuery) {
    this.audit.log(JSON.stringify({ event: 'leads.list', admin: req.admin.sub }));
    return this.leads.list(q);
  }

  @Get('counts')
  counts() {
    return this.leads.counts();
  }

  @Get('export.csv')
  async export(@Req() req: AuthedRequest, @Res() res: Response, @Query() q: LeadQuery) {
    this.audit.log(JSON.stringify({ event: 'leads.export', admin: req.admin.sub }));
    const csv = await this.leads.exportCsv(q);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="whitaker-leads-${todayIso()}.csv"`);
    res.send('﻿' + csv);
  }

  @Post('purge')
  @HttpCode(200)
  purge(@Req() req: AuthedRequest) {
    this.audit.log(JSON.stringify({ event: 'leads.purge', admin: req.admin.sub }));
    return this.leads.purgeExpired();
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'lead.view', admin: req.admin.sub, lead: id }));
    return this.leads.detail(id);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    this.audit.log(JSON.stringify({ event: 'lead.update', admin: req.admin.sub, lead: id, fields: Object.keys(dto) }));
    return this.leads.update(id, dto);
  }

  @Post(':id/notify')
  @HttpCode(200)
  resend(@Param('id', ParseIntPipe) id: number) {
    return this.leads.resendNotification(id);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'lead.delete', admin: req.admin.sub, lead: id }));
    return this.leads.remove(id);
  }
}
