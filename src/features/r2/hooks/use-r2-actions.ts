'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { R2File } from '../types';
import { downloadFile } from '../utils/r2-utils';

interface UseR2ActionsProps {
    mutate: () => void;
    currentPrefix: string;
}

export function useR2Actions({ mutate, currentPrefix }: UseR2ActionsProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDelete = async (fileKey: string, thumbnailUrl?: string) => {
        setIsDeleting(true);
        try {
            const fullKey = `${currentPrefix}${fileKey}`;
            const response = await fetch(`/api/files`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: [{ key: fullKey, thumbnailUrl }],
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除文件失败。');
            }
            toast({ title: '已删除', description: `${fileKey} 已被删除。` });
            mutate();
        } catch (err) {
            toast({
                title: '删除失败',
                description: err instanceof Error ? err.message : '未知错误',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async (selectedFiles: R2File[]) => {
        if (selectedFiles.length === 0) return;

        const filesPayload = selectedFiles.map((f) => ({
            key: `${currentPrefix}${f.key}`,
            thumbnailUrl: f.thumbnailUrl,
        }));

        setIsDeleting(true);
        try {
            const response = await fetch('/api/files', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: filesPayload }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '批量删除失败。');
            }

            toast({
                title: '删除成功',
                description: `成功删除 ${filesPayload.length} 个文件。`,
            });
            mutate();
        } catch (err) {
            toast({
                title: '删除失败',
                description: err instanceof Error ? err.message : '未知错误',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDownload = (selectedFiles: R2File[]) => {
        if (selectedFiles.length === 0) return;

        setIsDownloading(true);
        try {
            selectedFiles.forEach((file) => {
                downloadFile(file.url, file.key);
            });

            toast({
                title: '下载开始',
                description: `已开始下载 ${selectedFiles.length} 个文件。`,
            });
        } catch (error) {
            console.error('Error downloading files:', error);
            toast({
                title: '下载失败',
                description: '文件下载失败。',
                variant: 'destructive',
            });
        }

        setTimeout(() => {
            setIsDownloading(false);
        }, 3000);
    };

    const handleCopyImage = async (file: R2File) => {
        try {
            const response = await fetch(file.url);
            if (!response.ok) throw new Error('Failed to fetch image data');
            const originalBlob = await response.blob();

            if (!originalBlob.type.startsWith('image/')) {
                toast({
                    title: '复制失败',
                    description: '该文件不是有效的图片格式。',
                    variant: 'destructive',
                });
                return;
            }

            const pngBlob = await new Promise<Blob | null>((resolve) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob(resolve, 'image/png');
                    } else {
                        resolve(null);
                    }
                    URL.revokeObjectURL(img.src);
                };
                img.onerror = () => {
                    resolve(null);
                    URL.revokeObjectURL(img.src);
                };
                img.src = URL.createObjectURL(originalBlob);
            });

            if (!pngBlob) {
                throw new Error('无法将图片转换为PNG格式');
            }

            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);

            toast({
                title: '成功',
                description: '图片已复制到剪贴板',
            });
        } catch (err) {
            console.error('Failed to copy image:', err);
            toast({
                title: '复制失败',
                description: err instanceof Error ? err.message : '未知错误',
                variant: 'destructive',
            });
        }
    };

    return {
        isDeleting,
        isDownloading,
        handleDelete,
        handleBulkDelete,
        handleBulkDownload,
        handleCopyImage,
    };
}
