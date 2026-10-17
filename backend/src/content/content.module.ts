import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentBlock } from './content-block.entity';
import { ContentService } from './content.service';
import { ContentController, SiteController } from './content.controller';
import { SettingsModule } from '../settings/settings.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContentBlock]), SettingsModule, ServicesModule],
  providers: [ContentService],
  controllers: [SiteController, ContentController],
  exports: [ContentService],
})
export class ContentModule {}
