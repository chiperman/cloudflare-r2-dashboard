'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { getApiErrorMessage } from '@/lib/api';
import { R2File } from '../types';
import { downloadFile } from '../utils/r2-utils';

interface UseR2ActionsProps {
    mutate: () => void;
}

export function useR2Actions({ mutate }: UseR2ActionsProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDelete = async (file: R2File) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/files`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: [{ key: file.key, thumbnailUrl: file.thumbnailUrl }],
                }),
            });
            if (!response.ok) {
                throw new Error(await getApiErrorMessage(response, '删除文件失败。'));
            }
            toast({ title: '已删除', description: `${file.name ?? file.key.split('/').pop() ?? file.key} 已被删除。` });
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
            key: f.key,
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
                throw new Error(await getApiErrorMessage(response, '批量删除失败。'));
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

    return {
        isDeleting,
        isDownloading,
        handleDelete,
        handleBulkDelete,
        handleBulkDownload,
    };
}
