'use client';

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, File as FileIcon, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_FILES = 9;

interface UploadableFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // 检查是否因为文件过多而被拒绝
      if (fileRejections.some((rej) => rej.errors.some((err) => err.code === 'too-many-files'))) {
        toast({
          title: '上传数量超出限制',
          description: `您一次最多只能选择 ${MAX_FILES} 个文件。`,
          variant: 'destructive',
        });
        return;
      }

      const newFiles: UploadableFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        progress: 0,
        status: 'pending',
      }));

      const rejectedFiles: UploadableFile[] = fileRejections.map(({ file, errors }) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        progress: 0,
        status: 'error',
        error: errors[0].message,
      }));

      setFiles((prevFiles) => {
        const combined = [...prevFiles, ...newFiles, ...rejectedFiles];
        return combined.slice(0, MAX_FILES);
      });
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE_BYTES,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
      'image/svg+xml': [],
    },
  });

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  const uploadFile = (fileToUpload: UploadableFile) => {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', fileToUpload.file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === fileToUpload.id ? { ...f, progress: percentComplete } : f
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFiles((prevFiles) =>
            prevFiles.map((f) => (f.id === fileToUpload.id ? { ...f, status: 'success' } : f))
          );
          resolve();
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            const errorMessage = errorData.error || 'Upload failed.';
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileToUpload.id ? { ...f, status: 'error', error: errorMessage } : f
              )
            );
            reject(new Error(errorMessage));
          } catch (e) {
            const errorMessage = 'Upload failed with status: ' + xhr.status;
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileToUpload.id ? { ...f, status: 'error', error: errorMessage } : f
              )
            );
            reject(new Error(errorMessage));
          }
        }
      };

      xhr.onerror = () => {
        const errorMessage = 'An error occurred during the upload.';
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileToUpload.id ? { ...f, status: 'error', error: errorMessage } : f
          )
        );
        reject(new Error(errorMessage));
      };

      xhr.open('POST', '/api/upload', true);
      xhr.send(formData);
    });
  };

  const handleUploadAll = async () => {
    const filesToUpload = files.filter((f) => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.status === 'pending' ? { ...f, status: 'uploading' } : f))
    );

    const uploadPromises = filesToUpload.map((file) => uploadFile(file));

    const results = await Promise.allSettled(uploadPromises);

    setIsUploading(false);
    onUploadSuccess();

    const hasFailures = results.some((result) => result.status === 'rejected');

    if (!hasFailures) {
      toast({ title: '上传成功', description: '所有文件都已成功上传。' });
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    } else {
      toast({
        title: '部分文件上传失败',
        description: '请检查文件列表中的错误信息。',
        variant: 'destructive',
      });
    }
  };

  const pendingFilesCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="w-full max-w-2xl mx-auto">
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
            <p>Drop files here ...</p>
          ) : (
            <p>Drag & drop images here, or click to select</p>
          )}
          <p className="text-xs">
            (Max {MAX_FILES} files, {MAX_SIZE_MB}MB each; JPEG, PNG, GIF, WEBP, SVG)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          {files.map((uploadableFile) => (
            <div
              key={uploadableFile.id}
              className="p-4 border rounded-lg flex items-center justify-between gap-4 bg-muted/50"
            >
              <FileIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-grow overflow-hidden">
                <p className="font-medium truncate">{uploadableFile.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadableFile.file.size / 1024).toFixed(2)} KB
                </p>
                {uploadableFile.status === 'uploading' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={uploadableFile.progress} className="w-full h-2" />
                    <span className="text-xs font-mono">{uploadableFile.progress}%</span>
                  </div>
                )}
                {uploadableFile.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">{uploadableFile.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {(uploadableFile.status === 'pending' || uploadableFile.status === 'error') && (
                  <button
                    onClick={() => removeFile(uploadableFile.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {uploadableFile.status === 'uploading' && (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                {uploadableFile.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleUploadAll}
        disabled={pendingFilesCount === 0 || isUploading}
        className="mt-6 w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
      >
        {isUploading ? 'Uploading...' : `Upload ${pendingFilesCount} File(s)`}
      </button>
    </div>
  );
}
