import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { ChangePasswordDto, LoginDto } from './admin-auth.dto';
import { AuthedRequest, clearSessionCookies, SessionGuard, setSessionCookies } from '../common/session';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  /** Sets the HttpOnly session cookie and the CSRF cookie. */
  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.login(dto.email, dto.password);
    setSessionCookies(res, r.token, r.csrf);
    return { admin: r.admin };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    clearSessionCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.admin.sub);
  }

  @Patch('password')
  @UseGuards(SessionGuard)
  changePassword(@Req() req: AuthedRequest, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.admin.sub, dto.currentPassword, dto.newPassword);
  }
}
