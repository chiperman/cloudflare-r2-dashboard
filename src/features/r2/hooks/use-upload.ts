'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { R2File, UploadableFile } from '../types';
import { useMediaConversion } from './use-media-conversion';

interface UseUploadProps {
    currentPrefix: string;
    onUploadSuccess: (newFiles: R2File[]) => void;
    maxFiles?: number;
}

export function useUpload({
    currentPrefix,
    onUploadSuccess,
    maxFiles = 9,
}: UseUploadProps) {
    const { toast } = useToast();
    const [files, setFiles] = useState<UploadableFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleProgress = useCallback((id: string, progress: number) => {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
    }, []);

    const { modulesLoaded, ffmpegLoaded, processFile, terminateFfmpeg } = useMediaConversion({
        onProgress: handleProgress,
    });

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => {
            const fileToToRemove = prev.find((f) => f.id === id);
            if (fileToToRemove?.status === 'converting' && fileToToRemove.file.type.startsWith('video/')) {
                terminateFfmpeg();
                toast({ title: '转换已取消', description: 'FFmpeg 已重置' });
            }
            if (fileToToRemove?.preview) {
                URL.revokeObjectURL(fileToToRemove.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    }, [terminateFfmpeg, toast]);

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: { file: File; errors: { code: string; message: string }[] }[]) => {
        if (fileRejections.some(r => r.errors.some(e => e.code === 'too-many-files'))) {
            toast({ title: '超出限制', description: `一次最多上传 ${maxFiles} 个文件`, variant: 'destructive' });
            return;
        }

        const newUploads: UploadableFile[] = acceptedFiles.map(file => {
            const isHeic = /heic|heif$/i.test(file.name);
            const isMov = /mov$/i.test(file.name);
            const needsConversion = isHeic || isMov;

            return {
                id: `${file.name}-${file.size}-${file.lastModified}`,
                file,
                progress: 0,
                status: needsConversion ? 'converting' : 'pending',
                preview: URL.createObjectURL(file),
                isConverting: needsConversion,
            };
        });

        setFiles(prev => [...prev, ...newUploads].slice(0, maxFiles));

        // Process conversions
        for (const uploadable of newUploads) {
            if (!uploadable.isConverting) continue;

            const result = await processFile(uploadable.file);
            setFiles(prev => prev.map(f => {
                if (f.id === uploadable.id) {
                    if (f.preview) URL.revokeObjectURL(f.preview);
                    return { ...f, ...result };
                }
                return f;
            }));
        }
    }, [maxFiles, processFile, toast]);

    const uploadSingleFile = (uploadable: UploadableFile): Promise<R2File> => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', uploadable.file);
            formData.append('directory', currentPrefix);

            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    handleProgress(uploadable.id, Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const newFile = JSON.parse(xhr.responseText);
                        setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, status: 'success' } : f));
                        resolve(newFile);
                    } catch (e) {
                        reject(new Error('解析响应失败'));
                    }
                } else {
                    const errorMsg = JSON.parse(xhr.responseText || '{}').error || '上传失败';
                    setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, status: 'error', error: errorMsg } : f));
                    reject(new Error(errorMsg));
                }
            };

            xhr.onerror = () => reject(new Error('网络错误'));
            xhr.open('POST', '/api/upload', true);
            xhr.send(formData);
        });
    };

    const handleUploadAll = async () => {
        const pending = files.filter(f => f.status === 'pending');
        if (pending.length === 0) return;

        setIsUploading(true);
        setFiles(prev => prev.map(f => pending.some(p => p.id === f.id) ? { ...f, status: 'uploading' } : f));

        const results = await Promise.allSettled(pending.map(uploadSingleFile));
        const successful = results
            .filter((r): r is PromiseFulfilledResult<R2File> => r.status === 'fulfilled')
            .map(r => r.value);

        setIsUploading(false);
        if (successful.length > 0) {
            onUploadSuccess(successful);
            const successIds = new Set(pending.filter((_, i) => results[i].status === 'fulfilled').map(f => f.id));
            setFiles(prev => prev.filter(f => {
                if (successIds.has(f.id)) {
                    if (f.preview) URL.revokeObjectURL(f.preview);
                    return false;
                }
                return true;
            }));
        }

        toast({
            title: successful.length === pending.length ? '上传成功' : '部分上传失败',
            description: `成功: ${successful.length}, 失败: ${pending.length - successful.length}`,
            variant: successful.length === pending.length ? 'default' : 'destructive',
        });
    };

    return {
        files,
        isUploading,
        modulesLoaded,
        ffmpegLoaded,
        onDrop,
        removeFile,
        handleUploadAll,
        pendingCount: files.filter(f => f.status === 'pending').length,
    };
}
