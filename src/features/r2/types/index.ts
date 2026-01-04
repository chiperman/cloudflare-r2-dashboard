export interface R2File {
  key: string;
  url: string;
  size: number;
  uploadedAt: string;
  uploader: string;
  thumbnailUrl: string;
  blurDataURL?: string;
  user_id?: string;
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
