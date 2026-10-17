import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Singleton (id = 1): business details and the design's feature flags. */
@Entity('settings')
export class Settings {
  @PrimaryColumn()
  id: number;

  @Column({ default: 'Whitaker Plumbing' })
  businessName: string;

  @Column({ default: '' })
  contactName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine1: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  /** Design: "Publish 600 E Trade St … only after the business approves it." Off = address hidden on the site. */
  @Column({ default: false })
  showAddress: boolean;

  /** Footer line under the logo. */
  @Column({ default: '' })
  tagline: string;

  /** Licensing / insurance / experience — shown in "Why Whitaker" only once supplied (empty = hidden). */
  @Column({ type: 'text', default: '' })
  credentials: string;

  /** Business hours — shown on the contact aside once supplied (empty = hidden). */
  @Column({ type: 'text', default: '' })
  hours: string;

  /** Emergency availability — shown on the contact aside once supplied (empty = hidden). */
  @Column({ type: 'text', default: '' })
  emergencyInfo: string;

  /** Follow-up process/timing shown on the success card once approved (empty = hidden). */
  @Column({ type: 'text', default: '' })
  followUpNote: string;

  @Column({ type: 'text', default: '' })
  about: string;

  @Column({ type: 'text', default: '' })
  privacyNotice: string;

  /** Text of the "PRE-LAUNCH REVIEW" banner. */
  @Column({ type: 'text', default: '' })
  reviewNote: string;

  /** Design flag showContentFlags: pre-launch banner + dashed "TO CONFIRM" tags + pending FAQs. Turn off to publish. */
  @Column({ default: true })
  showContentFlags: boolean;

  /** Fixed Call / Request Service bar on phones and tablets (design: shown below 960px, except on Contact). */
  @Column({ default: true })
  mobileCallBar: boolean;

  /** When off the request form asks visitors to call or email instead. */
  @Column({ default: true })
  requestsOpen: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
