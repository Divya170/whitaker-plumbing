import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A requestable plumbing service. Published services drive the home bento, the hero
 * "What's going on?" chips, the services page and the form's "Service type" list.
 */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  /** Form value and page anchor (leak, drain, pipe, heater) — fixed after creation. */
  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  title: string;

  /** Card summary */
  @Column({ type: 'text', default: '' })
  short: string;

  /** Services-page paragraph */
  @Column({ type: 'text', default: '' })
  long: string;

  /** "Common signs" chips */
  @Column({ type: 'simple-json' })
  signs: string[];

  /** Photo (home tile + services page) and its placeholder label */
  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  @Column({ default: '' })
  imageLabel: string;

  @Column({ default: false })
  published: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
