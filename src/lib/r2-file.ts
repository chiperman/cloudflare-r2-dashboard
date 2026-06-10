import { z } from 'zod';

export const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
export const videoExtensions = ['mp4', 'webm', 'mov', 'ogg'] as const;

export type DbFileRecord = {
  key: string;
  name: string;
  size: number;
  uploaded_at: string;
  content_type: string;
  user_id: string | null;
  blur_data_url: string | null;
};

export type DbProfileRecord = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export type DeleteRequestFile = {
  key: string;
  thumbnailUrl?: string;
};

export const deleteRequestFileSchema = z.object({
  key: z.string().min(1),
  thumbnailUrl: z.string().optional(),
});

export const deleteFilesPayloadSchema = z.object({
  files: z.array(deleteRequestFileSchema).min(1),
});

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export function getR2PublicUrl(key: string) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${R2_PUBLIC_URL}/${encodedKey}`;
}

export function getThumbnailUrl(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension && imageExtensions.includes(extension as (typeof imageExtensions)[number])) {
    return getR2PublicUrl(`thumbnails/${fileName}`);
  }

  if (extension && videoExtensions.includes(extension as (typeof videoExtensions)[number])) {
    return '/video.svg';
  }

  return '/file.svg';
}
