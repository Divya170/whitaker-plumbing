import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomBytes } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SessionGuard } from '../common/session';
import { MAX_SITE_IMAGE_BYTES, PUBLIC_UPLOAD_DIR, SITE_IMAGE_TYPES } from './uploads.constants';
import { sniffImage } from './sniff';

mkdirSync(PUBLIC_UPLOAD_DIR, { recursive: true });

/** Admin image upload for service and page photos (session + CSRF protected). */
@Controller('uploads')
export class AdminUploadsController {
  /** POST /api/uploads/admin (multipart field "file") → { url: "/uploads/…" } */
  @Post('admin')
  @UseGuards(SessionGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_SITE_IMAGE_BYTES, files: 1 } }))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image to upload (max 8 MB).');
    const real = sniffImage(file.buffer);
    if (!real || !SITE_IMAGE_TYPES[real]) throw new BadRequestException('Upload a JPG, PNG or WebP image.');
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}${SITE_IMAGE_TYPES[real]}`;
    writeFileSync(join(PUBLIC_UPLOAD_DIR, name), file.buffer);
    return { url: `/uploads/${name}`, size: file.size, type: real };
  }
}
