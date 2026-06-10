export type { R2File } from '@/lib/types';

export interface UploadedByUser {
  id: string;
  email?: string | null;
  display_name?: string | null;
}

export interface UploadableFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'converting';
  error?: string;
  preview?: string;
  isConverting?: boolean;
}
