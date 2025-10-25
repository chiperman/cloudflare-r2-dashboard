'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { R2File } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_FILES = 9;

interface UploadableFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

export function UploadForm({
  onUploadSuccess,
  currentPrefix,
}: {
  onUploadSuccess: (newFiles: R2File[]) => void;
  currentPrefix: string;
}) {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => {
      files.forEach((uploadableFile) => {
        if (uploadableFile.preview) {
          URL.revokeObjectURL(uploadableFile.preview);
        }
      });
    };
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.some((rej) => rej.errors.some((err) => err.code === 'too-many-files'))) {
        toast({
          title: '超出上传限制',
          description: `一次最多只能选择 ${MAX_FILES} 个文件。`,
          variant: 'destructive',
        });
        return;
      }

      const newFiles: UploadableFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        progress: 0,
        status: 'pending',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      const rejectedFiles: UploadableFile[] = fileRejections.map(({ file, errors }) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        progress: 0,
        status: 'error',
        error: errors[0].message,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
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
      'video/mp4': [],
      'video/webm': [],
      'video/ogg': [],
    },
  });

  const removeFile = (id: string) => {
    setFiles((prevFiles) => {
      const fileToRemove = prevFiles.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prevFiles.filter((file) => file.id !== id);
    });
  };

  const uploadFile = (fileToUpload: UploadableFile): Promise<R2File> => {
    return new Promise<R2File>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', fileToUpload.file);
      formData.append('directory', currentPrefix);

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
          try {
            const newFile: R2File = JSON.parse(xhr.responseText);
            setFiles((prevFiles) =>
              prevFiles.map((f) => (f.id === fileToUpload.id ? { ...f, status: 'success' } : f))
            );
            resolve(newFile);
          } catch {
            const errorMessage = '解析服务器响应失败。';
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileToUpload.id ? { ...f, status: 'error', error: errorMessage } : f
              )
            );
            reject(new Error(errorMessage));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            const errorMessage = errorData.error || '上传失败。';
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileToUpload.id ? { ...f, status: 'error', error: errorMessage } : f
              )
            );
            reject(new Error(errorMessage));
          } catch {
            const errorMessage = '上传失败，状态码：' + xhr.status;
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
        const errorMessage = '上传过程中发生错误。';
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

    const successfulUploads: R2File[] = [];
    const successfulUploadIds = new Set<string>();
    const failedUploadIds = new Set<string>();

    results.forEach((result, index) => {
      const originalFile = filesToUpload[index];
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
        successfulUploadIds.add(originalFile.id);
      } else {
        failedUploadIds.add(originalFile.id);
      }
    });

    if (successfulUploads.length > 0) {
      onUploadSuccess(successfulUploads);
    }

    setFiles((prevFiles) =>
      prevFiles.filter((f) => {
        const shouldKeep = !successfulUploadIds.has(f.id);
        if (!shouldKeep && f.preview) {
          URL.revokeObjectURL(f.preview);
        }
        return shouldKeep;
      })
    );

    const successfulCount = successfulUploads.length;
    const failedCount = failedUploadIds.size;

    if (successfulCount > 0 && failedCount === 0) {
      toast({ title: '上传成功', description: '所有文件都已上传。' });
    } else if (successfulCount > 0 && failedCount > 0) {
      toast({
        title: '部分上传成功',
        description: `成功上传 ${successfulCount} 个文件，${failedCount} 个文件失败。`,
        variant: 'default',
      });
    } else if (successfulCount === 0 && failedCount > 0) {
      toast({
        title: '所有上传均失败',
        description: '请检查文件列表中的错误信息。',
        variant: 'destructive',
      });
    }
  };

  const pendingFilesCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="w-full mx-auto mb-4">
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
          {isDragActive ? <p>松开即可上传</p> : <p>拖拽文件到此处，或点击选择文件</p>}
          <p className="text-xs">
            (最多 {MAX_FILES} 个文件，每个不超过 {MAX_SIZE_MB}MB; 支持图片和视频文件)
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
              {uploadableFile.preview ? (
                <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={uploadableFile.preview}
                    alt={uploadableFile.file.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <FileIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
              )}
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

      <div className="pb-4 border-b">
        <button
          onClick={handleUploadAll}
          disabled={pendingFilesCount === 0 || isUploading}
          className="mt-6 w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
        >
          {isUploading ? '上传中...' : `上传 ${pendingFilesCount} 个文件`}
        </button>
      </div>
    </div>
  );
}

export function UploadFormSkeleton() {
  return (
    <div className="w-full mx-auto mb-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="pb-4 border-b">
        <Skeleton className="h-10 w-full rounded-lg mt-6" />
      </div>
    </div>
  );
}
