import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { SettingsModule } from '../settings/settings.module';
import { ContentModule } from '../content/content.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [AdminAuthModule, SettingsModule, ContentModule, ServicesModule],
  providers: [SeedService],
})
export class SeedModule {}
