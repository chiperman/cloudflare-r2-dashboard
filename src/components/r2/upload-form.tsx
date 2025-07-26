
'use client';

import { useState, FormEvent } from 'react';

export function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Get presigned URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL.');
      }

      const { url } = await response.json();

      // 2. Upload file to R2
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed.');
      }

      // Notify parent component
      onUploadSuccess();
      setFile(null); // Reset file input

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
          disabled={isUploading}
        />
        <button type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
