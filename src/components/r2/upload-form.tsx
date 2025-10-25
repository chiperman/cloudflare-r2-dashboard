'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { R2File } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/lib/utils';

const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_FILES = 9;

interface UploadableFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'converting';
  error?: string;
  preview?: string;
  isConverting?: boolean;
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
  const convertingFileIdRef = useRef<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const ffmpegRef = useRef<any | null>(null);
  const { toast } = useToast();

  const [heic2anyInstance, setHeic2anyInstance] = useState<any>(null);
  const [FFmpegInstance, setFFmpegInstance] = useState<any>(null);
  const [fetchFileInstance, setFetchFileInstance] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !modulesLoaded) {
      Promise.all([
        import('heic2any').then((mod) => setHeic2anyInstance(() => mod.default)),
        import('@ffmpeg/ffmpeg').then((mod) => setFFmpegInstance(() => mod.FFmpeg)),
        import('@ffmpeg/util').then((mod) => setFetchFileInstance(() => mod.fetchFile)),
      ])
        .then(() => {
          setModulesLoaded(true);
        })
        .catch((e) => {
          console.error('Failed to load dynamic modules:', e);
          toast({
            title: '加载必要模块失败',
            description: '部分上传功能可能不可用。',
            variant: 'destructive',
          });
        });
    }

    // Cleanup object URLs on unmount
    return () => {
      files.forEach((uploadableFile) => {
        if (uploadableFile.preview) {
          URL.revokeObjectURL(uploadableFile.preview);
        }
      });
    };
  }, [files, modulesLoaded, toast]);

  const loadFfmpeg = async () => {
    if (ffmpegRef.current || !FFmpegInstance) return;
    toast({
      title: '正在加载视频转换工具...',
      description: '首次使用可能需要一些时间，请耐心等待。',
      duration: 5000,
    });
    const ffmpeg = new FFmpegInstance({
      coreURL: '/ffmpeg-core.js',
      wasmURL: '/ffmpeg-core.wasm',
      workerURL: '/ffmpeg-core.worker.js',
    });

    ffmpeg.on('log', ({ message }: { message: string }) => {
      console.log('[ffmpeg log]', message);
    });
    ffmpeg.on('progress', ({ progress }: { progress: number; time: number }) => {
      const convertingId = convertingFileIdRef.current;
      if (convertingId && progress >= 0 && progress <= 1) {
        const progressPercent = Math.round(progress * 100);
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === convertingId ? { ...f, progress: progressPercent } : f
          )
        );
      }
    });
    try {
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      toast({
        title: '视频转换工具加载成功',
        description: '现在可以上传 MOV 视频了。',
      });
    } catch (e) {
      console.error('Failed to load FFmpeg:', e);
      toast({
        title: '视频转换工具加载失败',
        description: 'MOV 视频转换功能将不可用。',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (modulesLoaded && !ffmpegLoaded) {
      loadFfmpeg();
    }
  }, [modulesLoaded, ffmpegLoaded, FFmpegInstance]);

  const processFile = async (file: File): Promise<UploadableFile> => {
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic');
    const isMov = file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov');

    let processedFile = file;
    let error;
    let status: UploadableFile['status'] = 'pending';
    let isConverting = false;

    if (isHeic) {
      if (!heic2anyInstance) {
        error = 'HEIC 转换模块未加载。';
        status = 'error';
      } else {
        try {
          const convertedBlob = await heic2anyInstance({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
          processedFile = new File([convertedBlob as Blob], newFileName, {
            type: 'image/jpeg',
            lastModified: file.lastModified,
          });
        } catch (e) {
          error = 'HEIC/HEIF 文件转换失败';
          status = 'error';
        }
      }
    } else if (isMov) {
      if (!ffmpegLoaded || !ffmpegRef.current || !fetchFileInstance) {
        error = '视频转换工具未加载，请稍后再试或刷新页面。';
        status = 'error';
      } else {
        isConverting = true;
        status = 'converting';
        try {
          const inputFileName = 'input.mov';
          const outputFileName = file.name.replace(/\.(mov)$/i, '.mp4');

          await ffmpegRef.current.writeFile(inputFileName, await fetchFileInstance(file));
          await ffmpegRef.current?.exec([
            '-i',
            inputFileName,
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            '23',
            outputFileName,
          ]);
          const data = (await ffmpegRef.current?.readFile(outputFileName)) as Uint8Array;
          processedFile = new File([data as BlobPart], outputFileName, {
            type: 'video/mp4',
            lastModified: file.lastModified,
          });
          isConverting = false;
          status = 'pending';
        } catch (e: any) {
          console.error('MOV 视频转换失败:', e);
          error = 'MOV 视频转换失败';
          status = 'error';
          isConverting = false;
        }
      }
    }

    return {
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file: processedFile,
      progress: 0,
      status,
      error,
      preview:
        processedFile.type.startsWith('image/') || processedFile.type.startsWith('video/')
          ? URL.createObjectURL(processedFile)
          : undefined,
      isConverting,
    };
  };

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

      const newUploads: UploadableFile[] = acceptedFiles.map((file) => {
        const isHeic =
          file.type === 'image/heic' ||
          file.type === 'image/heif' ||
          file.name.toLowerCase().endsWith('.heic');
        const isMov = file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov');
        const needsConversion = isHeic || isMov;

        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file: file,
          progress: 0,
          status: needsConversion ? 'converting' : 'pending',
          preview: URL.createObjectURL(file),
          isConverting: needsConversion,
        };
      });

      const rejectedFiles: UploadableFile[] = fileRejections.map(({ file, errors }) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        progress: 0,
        status: 'error',
        error: errors[0].message,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      const existingIds = new Set(files.map((f) => f.id));
      const uniqueNewUploads = newUploads.filter((f) => !existingIds.has(f.id));

      if (uniqueNewUploads.length < newUploads.length) {
        toast({
          title: '忽略了重复文件',
          description: '部分选中的文件已存在于上传列表中。',
        });
      }

      setFiles((prevFiles) => {
        const currentExistingIds = new Set(prevFiles.map((f) => f.id));
        const trulyUniqueUploads = newUploads.filter((f) => !currentExistingIds.has(f.id));
        const combined = [...prevFiles, ...trulyUniqueUploads, ...rejectedFiles];
        return combined.slice(0, MAX_FILES);
      });

            uniqueNewUploads.forEach(async (uploadableFile) => {
              if (!uploadableFile.isConverting) return;
      
              if (uploadableFile.file.type === 'video/quicktime') {
                convertingFileIdRef.current = uploadableFile.id;
              }
      
              const processedResult = await processFile(uploadableFile.file);
              
              if (uploadableFile.file.type === 'video/quicktime') {
                convertingFileIdRef.current = null;
              }
      
              setFiles((prevFiles) =>
                prevFiles.map((f) => {
                  if (f.id === uploadableFile.id) {
                    URL.revokeObjectURL(f.preview as string); // Revoke the old preview URL
                    return processedResult; // Use the new result with the correct preview
                  }
                  return f;
                })
              );
            });    },
    [
      toast,
      files,
      modulesLoaded,
      ffmpegLoaded,
      ffmpegRef.current,
      heic2anyInstance,
      FFmpegInstance,
      fetchFileInstance,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE_BYTES,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/ogg': ['.ogg'],
      'video/quicktime': ['.mov'],
    },
  });

  const removeFile = useCallback(
    (id: string) => {
      const fileToRemove = files.find((f) => f.id === id);

      if (fileToRemove?.status === 'converting' && fileToRemove.file.type.startsWith('video/')) {
        ffmpegRef.current?.terminate();
        ffmpegRef.current = null;
        setFfmpegLoaded(false);
        toast({
          title: '视频转换已取消',
          description: 'FFmpeg 引擎正在重新加载，请稍候。',
        });
      }

      setFiles((prevFiles) => {
        const fileToRevoke = prevFiles.find((f) => f.id === id);
        if (fileToRevoke?.preview) {
          URL.revokeObjectURL(fileToRevoke.preview);
        }
        return prevFiles.filter((file) => file.id !== id);
      });
    },
    [files, ffmpegRef, setFfmpegLoaded, toast]
  );

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
    if (filesToUpload.length === 0) {
      toast({
        title: '没有准备就绪的文件',
        description: '部分文件可能仍在转换中，请稍后再试。',
      });
      return;
    }

    setIsUploading(true);
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        filesToUpload.some((fu) => fu.id === f.id) ? { ...f, status: 'uploading' } : f
      )
    );

    const results = await Promise.allSettled(filesToUpload.map(uploadFile));

    const successfulUploads: R2File[] = [];
    const successfulUploadIds = new Set<string>();

    results.forEach((result, index) => {
      const originalFile = filesToUpload[index];
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
        successfulUploadIds.add(originalFile.id);
      } else {
        // Error state is set within uploadFile, so we just need to know the ID
        // to prevent it from being removed from the list.
      }
    });

    setIsUploading(false);

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
    const failedCount = filesToUpload.length - successfulCount;

    if (successfulCount > 0 && failedCount === 0) {
      toast({ title: '上传成功', description: '所有就绪文件都已上传。' });
    } else if (successfulCount > 0 && failedCount > 0) {
      toast({
        title: '部分上传成功',
        description: `成功上传 ${successfulCount} 个文件，${failedCount} 个文件失败。`,
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
      {!modulesLoaded && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
          正在加载必要模块，请稍候...
        </div>
      )}
      {!ffmpegLoaded && modulesLoaded && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
          正在加载视频转换工具，首次加载可能需要一些时间...
        </div>
      )}
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
              className="p-4 border rounded-lg flex items-stretch justify-between gap-4 bg-muted/50"
            >
              {uploadableFile.preview ? (
                <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 relative">
                  {uploadableFile.file.type.startsWith('image/') ? (
                    <Image
                      src={uploadableFile.preview}
                      alt={uploadableFile.file.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <video
                      src={uploadableFile.preview}
                      className="object-cover w-full h-full"
                      muted
                      preload="metadata"
                    />
                  )}
                </div>
              ) : (
                <FileIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-grow overflow-hidden">
                <p className="font-medium truncate">{uploadableFile.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(uploadableFile.file.size)}
                </p>
                {uploadableFile.status === 'uploading' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={uploadableFile.progress} className="w-full h-2" />
                    <span className="text-xs font-mono">{uploadableFile.progress}%</span>
                  </div>
                )}
                {uploadableFile.status === 'converting' && (
                  <div className="flex items-center gap-2 mt-1 text-blue-600">
                    {uploadableFile.file.type.startsWith('video/') ? (
                      <>
                        <Progress value={uploadableFile.progress} className="w-full h-2" />
                        <span className="text-xs font-mono">{uploadableFile.progress}%</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span className="text-xs">正在转换...</span>
                      </>
                    )}
                  </div>
                )}
                {uploadableFile.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">{uploadableFile.error}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col items-center justify-between">
                {(uploadableFile.status === 'pending' ||
                  uploadableFile.status === 'error' ||
                  uploadableFile.status === 'converting') && (
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
                {uploadableFile.status === 'converting' && (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
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
          disabled={pendingFilesCount === 0 || isUploading || !ffmpegLoaded || !modulesLoaded}
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
