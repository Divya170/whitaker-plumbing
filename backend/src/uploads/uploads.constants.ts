import { resolve } from 'path';

/** backend/uploads — admin-managed site images (portraits, page photos), public at /uploads/* */
export const PUBLIC_UPLOAD_DIR = resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
export const MAX_SITE_IMAGE_BYTES = 8 * 1024 * 1024;
export const SITE_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
