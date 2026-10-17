import { Module } from '@nestjs/common';
import { AdminUploadsController } from './uploads.controller';

@Module({ controllers: [AdminUploadsController] })
export class UploadsModule {}
