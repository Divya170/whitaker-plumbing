import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './lead.entity';
import { LeadsService } from './leads.service';
import { AdminLeadsController, ServiceRequestsController } from './leads.controller';
import { NotifierService } from './notifier.service';
import { SettingsModule } from '../settings/settings.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), SettingsModule, ServicesModule],
  providers: [LeadsService, NotifierService],
  controllers: [ServiceRequestsController, AdminLeadsController],
})
export class LeadsModule {}
