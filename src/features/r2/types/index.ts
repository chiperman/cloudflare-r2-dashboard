export interface R2File {
  key: string;
  name?: string;
  url: string;
  size: number;
  uploadedAt: string;
  uploader: string;
  thumbnailUrl: string;
  blurDataURL?: string;
  user_id?: string;
}

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
