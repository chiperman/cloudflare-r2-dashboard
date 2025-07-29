'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';

// Utility function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface R2File {
  key: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
}

interface FileListProps {
  newlyUploadedFiles: R2File[];
}

export function FileList({ newlyUploadedFiles }: FileListProps) {
  const { toast } = useToast();
  const { data: files, error, isLoading, mutate } = useSWR<R2File[]>('/api/files', fetcher);
  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (newlyUploadedFiles.length > 0) {
      mutate((currentFiles = []) => {
        const newFilesMap = new Map(newlyUploadedFiles.map((file) => [file.key, file]));
        const updatedFiles = currentFiles.filter((file) => !newFilesMap.has(file.key));
        return [...newlyUploadedFiles, ...updatedFiles];
      }, false);
    }
  }, [newlyUploadedFiles, mutate]);

  const handleCopy = (url: string) => {
    const absoluteUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl).then(() => {
      toast({ title: 'Copied!', description: 'File link copied to clipboard.' });
    });
  };

  const handleDelete = async (fileKey: string) => {
    // Optimistically remove the file from the UI
    mutate(
      (currentFiles) => currentFiles?.filter((file) => file.key !== fileKey),
      false
    );

    try {
      const response = await fetch(`/api/files/${fileKey}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file.');
      }
      toast({ title: 'Deleted', description: `${fileKey} has been deleted.` });
      // Re-fetch to confirm deletion, or rely on optimistic update
      mutate();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      // Revert the optimistic update on failure
      mutate();
    }
  };

  const handleBulkDelete = async () => {
    const keysToDelete = Array.from(selectedKeys);
    if (keysToDelete.length === 0) return;

    const originalFiles = files;
    // Optimistically update UI
    mutate(
      (currentFiles) => currentFiles?.filter((file) => !selectedKeys.has(file.key)),
      false
    );
    setSelectedKeys(new Set());

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: keysToDelete }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk delete failed.');
      }

      toast({
        title: 'Delete successful',
        description: `Successfully deleted ${keysToDelete.length} files.`,
      });
      // Re-fetch to confirm deletion
      mutate();
    } catch (err) {
      // Revert on error
      mutate(originalFiles, false);
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedKeys.size === files?.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(files?.map((file) => file.key)));
    }
  };

  const isAllSelected = useMemo(() => files && selectedKeys.size === files.length, [files, selectedKeys]);

  if (isLoading) return <div className="text-center p-8">Loading files...</div>;
  if (error) return <div className="text-center p-8 text-destructive">Failed to load</div>;
  if (!files || files.length === 0)
    return <div className="text-center p-8 text-muted-foreground">No files</div>;


  return (
    <>
      <div className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedKeys.has(file.key)}
                    onCheckedChange={() => handleSelect(file.key)}
                  />
                </TableCell>
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
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-10 right-10 z-50">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg">
                <Trash2 className="h-5 w-5 mr-2" />
                删除选中 ({selectedKeys.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除？</AlertDialogTitle>
                <AlertDialogDescription>
                  确认删除选中的 {selectedKeys.size} 个文件？此操作不可恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

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
