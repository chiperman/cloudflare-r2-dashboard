'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
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
import { Copy, Trash2, Eye, Folder as FolderIcon } from 'lucide-react';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

interface FileListResponse {
  files: R2File[];
  directories: string[];
  nextContinuationToken?: string;
  isTruncated?: boolean;
}

interface FileListProps {
  newlyUploadedFiles: R2File[];
  currentPrefix: string;
  setCurrentPrefix: (prefix: string) => void;
}

export function FileList({ newlyUploadedFiles, currentPrefix, setCurrentPrefix }: FileListProps) {
  const { toast } = useToast();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [continuationTokens, setContinuationTokens] = useState<(string | undefined)[]>([undefined]);

  const swrKey = `/api/files?limit=${pageSize}&prefix=${currentPrefix}&continuationToken=${continuationTokens[currentPage - 1] || ''}`;
  const { data, error, isLoading, mutate } = useSWR<FileListResponse>(swrKey, fetcher);

  const files = useMemo(() => data?.files || [], [data]);
  const directories = useMemo(() => data?.directories || [], [data]);
  const hasMore = data?.isTruncated || false;

  useEffect(() => {
    if (newlyUploadedFiles.length > 0) {
      mutate();
    }
  }, [newlyUploadedFiles, mutate]);

  useEffect(() => {
    setCurrentPage(1);
    setContinuationTokens([undefined]);
  }, [currentPrefix, pageSize]);

  useEffect(() => {
    if (data?.nextContinuationToken && continuationTokens.length === currentPage) {
      setContinuationTokens(prev => [...prev, data.nextContinuationToken]);
    }
  }, [data, currentPage, continuationTokens]);

  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value, 10));
  };

  const handleDirectoryClick = (dir: string) => {
    setCurrentPrefix(`${currentPrefix}${dir}/`);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPrefix('');
      return;
    }
    const newPrefix = currentPrefix.split('/').slice(0, index + 1).join('/') + '/';
    setCurrentPrefix(newPrefix);
  };

  const handleCopy = (url: string) => {
    const absoluteUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl).then(() => {
      toast({ title: 'Copied!', description: 'File link copied to clipboard.' });
    });
  };

  const handleDelete = async (fileKey: string) => {
    try {
      const fullKey = `${currentPrefix}${fileKey}`;
      const response = await fetch(`/api/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [fullKey] }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file.');
      }
      toast({ title: 'Deleted', description: `${fileKey} has been deleted.` });
      mutate();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    const keysToDelete = Array.from(selectedKeys).map(key => `${currentPrefix}${key}`);
    if (keysToDelete.length === 0) return;

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
      setSelectedKeys(new Set());
      mutate(); // Re-fetch the current page data
    } catch (err) {
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

  const isAllSelected = useMemo(
    () => files && files.length > 0 && selectedKeys.size === files.length,
    [files, selectedKeys]
  );

  const breadcrumbParts = currentPrefix.split('/').filter(p => p);

  if (isLoading) return <div className="text-center p-8">Loading files...</div>;
  if (error) return <div className="text-center p-8 text-destructive">Failed to load</div>;

  return (
    <>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={() => handleBreadcrumbClick(-1)}>Root</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbParts.map((part, index) => (
              <Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbParts.length - 1 ? (
                    <BreadcrumbPage>{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#" onClick={() => handleBreadcrumbClick(index)}>{part}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="text-center">预览</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="text-center">上传时间</TableHead>
              <TableHead className="text-center">文件大小</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {directories.map((dir) => (
              <TableRow key={dir} onDoubleClick={() => handleDirectoryClick(dir)} className="cursor-pointer">
                <TableCell></TableCell>
                <TableCell className="flex justify-center items-center h-[50px]">
                  <FolderIcon className="w-6 h-6 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">{dir}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}
            {files.map((file: R2File) => (
              <TableRow key={file.key}>
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedKeys.has(file.key)}
                    onCheckedChange={() => handleSelect(file.key)}
                  />
                </TableCell>
                <TableCell className="flex justify-center">
                  <button
                    className="relative group transition-transform hover:scale-105"
                    onClick={() => setPreviewFile(file)}
                  >
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
                <TableCell className="font-medium">{file.key}</TableCell>
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
        {(!directories.length && !files.length) && (
            <div className="text-center p-8 text-muted-foreground">This folder is empty.</div>
        )}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => handlePageSizeChange(value)}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map(size => (
                  <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={handlePrevPage} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext onClick={handleNextPage} className={!hasMore ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
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