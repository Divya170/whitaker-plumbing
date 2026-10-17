import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AdminUser } from './admin-user.entity';
import { AdminSession } from '../common/session';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger('AdminAuth');

  constructor(
    @InjectRepository(AdminUser) private readonly users: Repository<AdminUser>,
    private readonly jwt: JwtService,
  ) {}

  /** Seeds one admin on first boot and prints the credentials. Idempotent. */
  async ensureDefaultAdmin(): Promise<void> {
    if ((await this.users.count()) > 0) return;
    const email = (process.env.ADMIN_EMAIL || 'admin@whitakerplumbing.local').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'WhitakerAdmin#2026';
    const name = process.env.ADMIN_NAME || 'Asher Whitaker';
    await this.users.save(this.users.create({ email, name, passwordHash: await bcrypt.hash(password, 10), lastLoginAt: null }));
    this.logger.warn('──────────────────────────────────────────────');
    this.logger.warn('Default admin account created');
    this.logger.warn(`  Email:    ${email}`);
    this.logger.warn(`  Password: ${password}`);
    this.logger.warn('  Sign in at /admin/login and change the password.');
    this.logger.warn('──────────────────────────────────────────────');
  }

  /** Verifies credentials and returns a signed session token + its CSRF token. */
  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    // Same message for unknown email and wrong password
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Email or password is incorrect.');
    user.lastLoginAt = new Date();
    await this.users.save(user);
    const csrf = randomBytes(24).toString('base64url');
    const payload: AdminSession = { sub: user.id, email: user.email, name: user.name, csrf };
    return { token: await this.jwt.signAsync(payload), csrf, admin: this.toPublic(user) };
  }

  async me(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Account not found.');
    return this.toPublic(user);
  }

  async changePassword(id: number, current: string, next: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Account not found.');
    if (!(await bcrypt.compare(current, user.passwordHash))) {
      throw new BadRequestException({ message: 'Current password is incorrect.', errors: { currentPassword: 'Current password is incorrect.' } });
    }
    if (current === next) throw new BadRequestException({ message: 'Choose a different password.', errors: { newPassword: 'Choose a password different from the current one.' } });
    user.passwordHash = await bcrypt.hash(next, 10);
    await this.users.save(user);
    return { ok: true };
  }

  private toPublic(u: AdminUser) {
    return { id: u.id, email: u.email, name: u.name, lastLoginAt: u.lastLoginAt };
  }
}
