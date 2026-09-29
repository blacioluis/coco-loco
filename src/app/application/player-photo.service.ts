import { Injectable } from '@angular/core';

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const AVATAR_SIZE = 384;

@Injectable({ providedIn: 'root' })
export class PlayerPhotoService {
  async compress(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) throw new Error('invalid-type');
    if (file.size > MAX_SOURCE_BYTES) throw new Error('too-large');

    const bitmap = await createImageBitmap(file);
    try {
      const side = Math.min(bitmap.width, bitmap.height);
      const sourceX = (bitmap.width - side) / 2;
      const sourceY = (bitmap.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      return canvas.toDataURL('image/webp', 0.76);
    } finally {
      bitmap.close();
    }
  }
}
