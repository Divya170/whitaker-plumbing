import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { ServicesService } from './services.service';
import { SessionGuard } from '../common/session';

class ReorderDto {
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get('services')
  list() {
    return this.services.listPublished();
  }

  @Get('admin/services')
  @UseGuards(SessionGuard)
  adminList() {
    return this.services.adminList();
  }

  @Post('admin/services/reorder')
  @UseGuards(SessionGuard)
  reorder(@Body() dto: ReorderDto) {
    return this.services.reorder(dto.ids);
  }

  // Bodies are validated by validateService() (field-level messages).
  @Post('admin/services')
  @UseGuards(SessionGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.services.create(body);
  }

  @Patch('admin/services/:id')
  @UseGuards(SessionGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.services.update(id, body);
  }

  @Delete('admin/services/:id')
  @UseGuards(SessionGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.services.remove(id);
  }
}
