import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { LeadValidationError } from './leads.service';

/**
 * Shapes every error from POST /api/service-requests in one predictable shape the form understands:
 * 422 {ok:false, errors} · 429 {ok:false, error:"rate_limited"} · 500 {ok:false, error:"server_error"}.
 * No internals are ever exposed.
 */
@Catch()
export class ServiceRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ServiceRequests');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof LeadValidationError) {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ ok: false, errors: (exception as LeadValidationError).fieldErrors });
      return;
    }
    if (exception instanceof ThrottlerException) {
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({ ok: false, error: 'rate_limited' });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === HttpStatus.PAYLOAD_TOO_LARGE) return void res.status(status).json({ ok: false, error: 'payload_too_large' });
      if (status === HttpStatus.SERVICE_UNAVAILABLE) return void res.status(status).json({ ok: false, error: 'requests_paused' });
      if (status === HttpStatus.BAD_REQUEST) return void res.status(status).json({ ok: false, error: 'bad_request' });
    }
    this.logger.error(JSON.stringify({ event: 'lead.server_error', message: (exception as Error)?.message?.slice(0, 200) }));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ ok: false, error: 'server_error' });
  }
}
