import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { resolve } from 'path';
import { CommonModule } from './common/common.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { SettingsModule } from './settings/settings.module';
import { ServicesModule } from './services/services.module';
import { ContentModule } from './content/content.module';
import { LeadsModule } from './leads/leads.module';
import { UploadsModule } from './uploads/uploads.module';
import { SeedModule } from './database/seed.module';
import { AdminUser } from './admin-auth/admin-user.entity';
import { Settings } from './settings/settings.entity';
import { Service } from './services/service.entity';
import { ContentBlock } from './content/content-block.entity';
import { Lead } from './leads/lead.entity';

/** DATABASE_URL (contract) or DATABASE_PATH: a SQLite file path, optionally prefixed with "sqlite:" / "file:". */
const dbFile = () => (process.env.DATABASE_URL || process.env.DATABASE_PATH || '../database/app.sqlite').replace(/^(sqlite|file):(\/\/)?/, '');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite' as const,
        database: resolve(process.cwd(), dbFile()),
        entities: [AdminUser, Settings, Service, ContentBlock, Lead],
        synchronize: true,
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    CommonModule,
    AdminAuthModule,
    SettingsModule,
    ServicesModule,
    ContentModule,
    LeadsModule,
    UploadsModule,
    SeedModule,
  ],
})
export class AppModule {}
