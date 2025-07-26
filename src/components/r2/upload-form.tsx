'use client';

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, File as FileIcon, X } from 'lucide-react';
import { nanoid } from 'nanoid';

const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors.some((e) => e.code === 'file-too-large')) {
        setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP, SVG).');
      } else {
        setError(rejection.errors[0].message);
      }
      setFile(null);
    } else if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_SIZE_BYTES,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
      'image/svg+xml': [],
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create a new filename based on YYYYMMDD-HHMMSS-xxxxxx.ext
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const randomId = nanoid(6); // Generate a 6-character random string

      const fileExtension = file.name.split('.').pop();
      const newFileName = `${year}${month}${day}-${hours}${minutes}${seconds}-${randomId}.${fileExtension}`;
      
      const renamedFile = new File([file], newFileName, { type: file.type });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: renamedFile.name, contentType: renamedFile.type }),
      });

      if (!response.ok) throw new Error('Failed to get presigned URL.');

      const { url } = await response.json();

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onUploadSuccess();
          setFile(null);
        } else {
          setError(`Upload failed: ${xhr.statusText}`);
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setError('Upload failed due to a network error.');
        setIsUploading(false);
      };

      xhr.send(renamedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/50 hover:border-primary'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Upload className="w-8 h-8" />
          {isDragActive ? (
            <p>Drop the file here ...</p>
          ) : (
            <p>Drag & drop an image here, or click to select one</p>
          )}
          <p className="text-xs">(Max {MAX_SIZE_MB}MB; JPEG, PNG, GIF, WEBP, SVG)</p>
        </div>
      </div>

      {file && (
        <div className="mt-4 p-4 border rounded-lg flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-3">
            <FileIcon className="w-6 h-6 text-muted-foreground" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={() => setFile(null)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-center mt-2 text-muted-foreground">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="mt-6 w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
}
