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
import { Copy, Trash2, Eye, Folder as FolderIcon, FolderPlus } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/select';
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

  const swrKey = `/api/files?limit=${pageSize}&prefix=${currentPrefix}&continuationToken=${
    continuationTokens[currentPage - 1] || ''
  }`;
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
      setContinuationTokens((prev) => [...prev, data.nextContinuationToken]);
    }
  }, [data, currentPage, continuationTokens]);

  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderNameError, setFolderNameError] = useState('');

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
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
    const newPrefix =
      currentPrefix
        .split('/')
        .slice(0, index + 1)
        .join('/') + '/';
    setCurrentPrefix(newPrefix);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newFolderName, currentPrefix }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建文件夹失败。');
      }
      toast({ title: '成功', description: `文件夹 "${newFolderName}" 创建成功。` });
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      mutate();
    } catch (err) {
      toast({
        title: '创建失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    const folderPrefix = `${currentPrefix}${folderName}/`;
    try {
      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: folderPrefix }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除文件夹失败。');
      }
      toast({ title: '成功', description: `文件夹 "${folderName}" 已被删除。` });
      mutate();
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = (url: string) => {
    const absoluteUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl).then(() => {
      toast({ title: '已复制!', description: '文件链接已复制到剪贴板。' });
    });
  };

  const handleDelete = async (fileKey: string) => {
    const fileToDelete = files.find((f) => f.key === fileKey);
    if (!fileToDelete) return;

    try {
      const fullKey = `${currentPrefix}${fileKey}`;
      const response = await fetch(`/api/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [{ key: fullKey, thumbnailUrl: fileToDelete.thumbnailUrl }] }),
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
    }
  };

  const handleBulkDelete = async () => {
    const filesToDelete = files.filter((f) => selectedKeys.has(f.key));
    if (filesToDelete.length === 0) return;

    const filesPayload = filesToDelete.map((f) => ({
      key: `${currentPrefix}${f.key}`,
      thumbnailUrl: f.thumbnailUrl,
    }));

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
      setSelectedKeys(new Set());
      mutate(); // Re-fetch the current page data
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
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

  const breadcrumbParts = currentPrefix.split('/').filter((p) => p);

  if (isLoading) return <div className="text-center p-8">加载中...</div>;
  if (error) return <div className="text-center p-8 text-destructive">加载失败</div>;

  return (
    <>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={() => handleBreadcrumbClick(-1)}>
                根目录
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbParts.map((part, index) => (
              <Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbParts.length - 1 ? (
                    <BreadcrumbPage>{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#" onClick={() => handleBreadcrumbClick(index)}>
                      {part}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-4">
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FolderPlus className="mr-2 h-4 w-4" />
              新建文件夹
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建文件夹</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="请输入文件夹名称"
                value={newFolderName}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewFolderName(name);
                  const safeNameRegex = /^[a-zA-Z0-9_-]*$/;
                  if (!safeNameRegex.test(name)) {
                    setFolderNameError('名称只能包含字母、数字、- 和 _');
                  } else {
                    setFolderNameError('');
                  }
                }}
              />
              {folderNameError && (
                <p className="text-sm text-destructive mt-2">{folderNameError}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">取消</Button>
              </DialogClose>
              <Button onClick={handleCreateFolder} disabled={!!folderNameError || !newFolderName}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="text-center">预览</TableHead>
              <TableHead className="text-center">名称</TableHead>
              <TableHead className="text-center">上传时间</TableHead>
              <TableHead className="text-center">文件大小</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {directories.map((dir) => (
              <TableRow
                key={dir}
                onDoubleClick={() => handleDirectoryClick(dir)}
                className="cursor-pointer"
              >
                <TableCell></TableCell>
                <TableCell className="flex justify-center items-center h-[50px]">
                  <FolderIcon className="w-6 h-6 text-muted-foreground" />
                </TableCell>
                <TableCell className="text-center truncate max-w-[150px] md:max-w-full">
                  {dir}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除文件夹？</AlertDialogTitle>
                        <AlertDialogDescription>
                          您确定要删除文件夹 &quot;{dir}&quot;
                          及其包含的所有内容吗？此操作不可恢复。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteFolder(dir)}>
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
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
                    <div className="relative rounded-md overflow-hidden">
                      <div className="bg-muted w-[50px] h-[50px] flex items-center justify-center">
                        <Image
                          src={file.thumbnailUrl}
                          alt={file.key}
                          fill
                          className="object-cover cursor-pointer"
                          sizes="50px"
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-center truncate max-w-[100px] md:max-w-full">
                  {file.key}
                </TableCell>
                <TableCell className="text-center truncate max-w-[120px] md:max-w-full">
                  <span className="md:hidden">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="hidden md:inline">
                    {new Date(file.uploadedAt).toLocaleString()}
                  </span>
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
        {!directories.length && !files.length && (
          <div className="text-center p-8 text-muted-foreground">此文件夹为空</div>
        )}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">每页行数</p>
            <Select value={`${pageSize}`} onValueChange={(value) => handlePageSizeChange(value)}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePrevPage}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNextPage}
                    className={!hasMore ? 'pointer-events-none opacity-50' : ''}
                  />
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

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl h-auto">
          {previewFile && (
            <>
              <DialogHeader>
                <DialogTitle>{previewFile.key}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 relative w-full h-[70vh]">
                {previewFile.key.toLowerCase().endsWith('.mp4') || previewFile.key.toLowerCase().endsWith('.webm') || previewFile.key.toLowerCase().endsWith('.mov') ? (
                  <video src={previewFile.url} controls autoPlay className="w-full h-full object-contain">
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full max-w-[70vh] max-h-[70vh]">
                      {/* Loading indicator */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                      <Image
                        src={previewFile.url}
                        alt={previewFile.key}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
