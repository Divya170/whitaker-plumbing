import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { LeadStatus } from './request-validation';

/**
 * Table `leads` — one row per service request from the website form.
 * Fields follow the design's lead record (id, name, phone, email, service, issue, location,
 * date, window, extra, status, created, notification) plus notes, closed_at and an IP hash.
 */
@Entity('leads')
@Index(['status', 'createdAt'])
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  /** WP-1101 — set inside the same transaction as the insert. */
  @Index({ unique: true }) // SQLite allows several NULLs in a unique index
  @Column({ name: 'public_ref', type: 'varchar', nullable: true })
  publicRef: string | null;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ name: 'phone_e164' })
  phoneE164: string;

  @Column({ type: 'varchar', length: 120 })
  email: string;

  /** Service slug (leak, drain, pipe, heater, other, …) */
  @Column()
  service: string;

  /** Plain text — React escapes it; notification emails escape it too. */
  @Column({ type: 'text' })
  issue: string;

  /** City, town or ZIP code */
  @Column({ type: 'varchar', length: 80 })
  location: string;

  /** YYYY-MM-DD or null */
  @Column({ name: 'preferred_date', type: 'varchar', nullable: true })
  preferredDate: string | null;

  /** morning | afternoon | flexible */
  @Column({ name: 'preferred_window', default: 'flexible' })
  preferredWindow: string;

  /** "Anything else we should know?" (optional) */
  @Column({ type: 'text', default: '' })
  extra: string;

  @Column({ type: 'varchar', default: 'new' })
  status: LeadStatus;

  /** Internal notes — never shown to the customer. */
  @Column({ type: 'text', default: '' })
  notes: string;

  /** sha256(secret + IP) — never the raw IP */
  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 300, default: '' })
  userAgent: string;

  /** pending | sent | failed · disabled when no email provider is configured (design: "Email provider not configured") */
  @Column({ name: 'notify_status', default: 'pending' })
  notifyStatus: 'pending' | 'sent' | 'failed' | 'disabled';

  @Column({ name: 'notify_attempts', default: 0 })
  notifyAttempts: number;

  @Column({ name: 'notify_error', type: 'varchar', nullable: true })
  notifyError: string | null;

  /** When the lead was last moved to "closed" or "completed" — used by the retention purge. */
  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
