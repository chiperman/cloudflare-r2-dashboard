'use client';

import { useState } from 'react';
import { UploadForm } from '@/components/r2/upload-form';
import { FileList } from '@/components/r2/file-list';

interface R2File {
  key: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
}

export function HomeClientContent() {
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<R2File[]>([]);

  const handleUploadSuccess = (newFiles: R2File[]) => {
    setNewlyUploadedFiles(newFiles);
  };

  return (
    <div className="w-full">
      <UploadForm onUploadSuccess={handleUploadSuccess} />
      <div className="mt-8">
        <FileList newlyUploadedFiles={newlyUploadedFiles} />
      </div>
    </div>
  );
}
