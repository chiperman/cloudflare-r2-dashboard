'use client';

import { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ✅ 抽离格式化函数，避免重复定义
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ✅ SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface R2File {
  key: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
}

interface FileListProps {
  refreshTrigger: number;
  onActionComplete: () => void;
}

export function FileList({ refreshTrigger, onActionComplete }: FileListProps) {
  const { toast } = useToast();
  const { data: files, error, isLoading, mutate } = useSWR<R2File[]>(['/api/files', refreshTrigger], fetcher);
  const [previewFile, setPreviewFile] = useState<R2File | null>(null);

  const handleCopy = (url: string) => {
    const absoluteUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl).then(() => {
      toast({ title: '已复制', description: '文件链接已复制到剪贴板' });
    });
  };

  const handleDelete = async (fileKey: string) => {
    try {
      const response = await fetch(`/api/files/${fileKey}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除文件失败');
      }
      toast({ title: '删除成功', description: `${fileKey} 已被删除` });
      mutate(); // ✅ 刷新文件列表
      onActionComplete(); // 通知父组件操作完成
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div className="text-center p-8">加载文件中...</div>;
  if (error) return <div className="text-center p-8 text-destructive">加载失败</div>;
  if (!files || files.length === 0)
    return <div className="text-center p-8 text-muted-foreground">没有文件</div>;

  return (
    <>
      <div className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">预览</TableHead>
              <TableHead className="text-center">文件名</TableHead>
              <TableHead className="text-center">上传时间</TableHead>
              <TableHead className="text-center">文件大小</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file: R2File) => (
              <TableRow key={file.key}>
                <TableCell className="flex justify-center">
                  <button className="relative group transition-transform hover:scale-105" onClick={() => setPreviewFile(file)}>
                    <Image
                      src={file.thumbnailUrl}
                      alt={file.key}
                      width={50}
                      height={50}
                      className="rounded-md object-cover h-[50px] w-[50px] cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </TableCell>
                <TableCell className="font-medium text-center">{file.key}</TableCell>
                <TableCell className="text-center">
                  {new Date(file.uploadedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">{formatBytes(file.size)}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(file.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除？</AlertDialogTitle>
                          <AlertDialogDescription>
                            确认删除 {file.key}？此操作不可恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(file.key)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ 图片预览 Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl h-auto">
          {previewFile && (
            <>
              <DialogHeader>
                <DialogTitle>{previewFile.key}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 relative w-full h-[70vh]">
                <Image
                  src={previewFile.url}
                  alt={previewFile.key}
                  fill
                  className="object-contain"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
