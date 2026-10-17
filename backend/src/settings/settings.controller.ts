import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './settings.dto';
import { SessionGuard } from '../common/session';

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  getPublic() {
    return this.settings.getPublic();
  }

  @Get('admin/settings')
  @UseGuards(SessionGuard)
  getAdmin() {
    return this.settings.get();
  }

  @Patch('admin/settings')
  @UseGuards(SessionGuard)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
