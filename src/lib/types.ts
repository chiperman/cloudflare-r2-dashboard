export interface R2File {
  key: string;
  name?: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
  user_id?: string;
  uploader: string;
  blurDataURL?: string;
}

export interface UserProfileSummary {
  id: string;
  role: string;
}
