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
import {
  Copy,
  Trash2,
  Eye,
  Folder as FolderIcon,
  FolderPlus,
  Download,
  MoreHorizontal,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClickableTooltip } from '@/components/ui/clickable-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
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

import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/lib/utils';

import type { User } from '@supabase/supabase-js';
import { R2File } from '@/lib/types';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FileListResponse {
  files: R2File[];
  directories: string[];
  nextContinuationToken?: string;
  isTruncated?: boolean;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}

interface FileListProps {
  user: User | null;
  profile: { role: string } | null; // Add this line
  newlyUploadedFiles: R2File[];
  currentPrefix: string;
  setCurrentPrefix: (prefix: string) => void;
}

export function FileList({
  user,
  profile,
  newlyUploadedFiles,
  currentPrefix,
  setCurrentPrefix,
}: FileListProps) {
  const { toast } = useToast();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState('current'); // 'current' or 'global'

  // Determine the SWR key based on whether a search is active
  const isSearching = debouncedSearchTerm.length > 0;
  const swrKey = (() => {
    if (isSearching) {
      const apiPrefix = searchScope === 'global' ? '' : currentPrefix;
      return `/api/files?limit=${pageSize}&prefix=${apiPrefix}&page=${currentPage}&search=${debouncedSearchTerm}&scope=${searchScope}`;
    }
    // Default browsing mode
    return `/api/files?limit=${pageSize}&prefix=${currentPrefix}&page=${currentPage}&search=`;
  })();

  const { data, error, isLoading, mutate } = useSWR<FileListResponse>(swrKey, fetcher);

  const files = useMemo(() => data?.files || [], [data]);
  const directories = useMemo(() => data?.directories || [], [data]);
  const hasMore = data?.isTruncated || false;
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const currentApiPage = data?.currentPage || 1;

  useEffect(() => {
    if (newlyUploadedFiles.length > 0) {
      // 当有新文件上传时，跳转回第一页并刷新
      setCurrentPage(1);
      mutate();
    }
  }, [newlyUploadedFiles, mutate]);

  useEffect(() => {
    // 当文件夹或页面大小变化时，重置为第一页
    setCurrentPage(1);
  }, [currentPrefix, pageSize]);

  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderNameError, setFolderNameError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateFolderDrawerOpen, setIsCreateFolderDrawerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOpenPreview = (file: R2File) => {
    const index = files.findIndex((f) => f.key === file.key);
    setPreviewFile(file);
    setPreviewIndex(index);
  };

  const handleNextPreview = () => {
    if (previewIndex === null || previewIndex === files.length - 1) return;
    const nextIndex = previewIndex + 1;
    setPreviewFile(files[nextIndex]);
    setPreviewIndex(nextIndex);
  };

  const handlePrevPreview = () => {
    if (previewIndex === null || previewIndex === 0) return;
    const prevIndex = previewIndex - 1;
    setPreviewFile(files[prevIndex]);
    setPreviewIndex(prevIndex);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

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

  const handleRefresh = () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    mutate();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000); // 2-second throttle
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
      setIsCreateFolderDrawerOpen(false);
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

  const handleCopyFilename = (filename: string) => {
    navigator.clipboard.writeText(filename).then(() => {
      toast({ title: '已复制!', description: `文件名已复制到剪贴板。` });
    });
  };

  const handleDelete = async (fileKey: string) => {
    const fileToDelete = files.find((f) => f.key === fileKey);
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      const fullKey = `${currentPrefix}${fileKey}`;
      const response = await fetch(`/api/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [{ key: fullKey, thumbnailUrl: fileToDelete.thumbnailUrl }],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除文件失败。');
      }
      toast({ title: '已删除', description: `${fileKey} 已被删除。` });
      if (previewFile && previewFile.key === fileKey) {
        setPreviewFile(null);
      }
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

  const handleBulkDelete = async () => {
    const filesToDelete = files.filter((f) => selectedKeys.has(f.key));
    if (filesToDelete.length === 0) return;

    const filesPayload = filesToDelete.map((f) => ({
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
      setSelectedKeys(new Set());
      mutate(); // Re-fetch the current page data
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

  const handleBulkDownload = () => {
    const filesToDownload = files.filter((f) => selectedKeys.has(f.key));
    if (filesToDownload.length === 0) return;

    setIsDownloading(true);
    try {
      filesToDownload.forEach((file) => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.key;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      toast({
        title: '下载开始',
        description: `已开始下载 ${filesToDownload.length} 个文件。`,
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: '下载失败',
        description: '文件下载失败。',
        variant: 'destructive',
      });
      setIsDownloading(false);
      return;
    }

    setTimeout(() => {
      setIsDownloading(false);
    }, 3000);
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

  if (error) return <div className="text-center p-8 text-destructive">加载失败</div>;

  return (
    <TooltipProvider>
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 sm:justify-start">
        <div className="order-1 sm:order-1">
          <div className="hidden sm:block">
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="sm:w-auto sm:px-4">
                  <FolderPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">新建文件夹</span>
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
                  <Button
                    onClick={handleCreateFolder}
                    disabled={!!folderNameError || !newFolderName}
                  >
                    创建
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="sm:hidden">
            <Drawer open={isCreateFolderDrawerOpen} onOpenChange={setIsCreateFolderDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>新建文件夹</DrawerTitle>
                </DrawerHeader>
                <div className="p-4">
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
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">取消</Button>
                  </DrawerClose>
                  <Button
                    onClick={handleCreateFolder}
                    disabled={!!folderNameError || !newFolderName}
                  >
                    创建
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="order-3 sm:order-2 w-full sm:w-96 sm:ml-auto">
          <div className="relative w-full max-w-sm flex items-center border border-input rounded-md focus-within:border-primary">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={searchScope === 'current' ? '搜索当前文件夹...' : '全局搜索...'}
              className="pl-10 pr-20 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedSearchTerm(searchTerm);
                  setCurrentPage(1);
                }
              }}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => setSearchScope('current')}
                    className={searchScope === 'current' ? 'bg-accent' : ''}
                  >
                    当前文件夹
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setSearchScope('global')}
                    className={searchScope === 'global' ? 'bg-accent' : ''}
                  >
                    全局
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="sm:hidden">
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" className="rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>搜索范围</DrawerTitle>
                    <DrawerDescription>选择一个范围进行搜索</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4">
                    <Button
                      variant={searchScope === 'current' ? 'default' : 'outline'}
                      className="w-full mb-2"
                      onClick={() => {
                        setSearchScope('current');
                        setIsDrawerOpen(false);
                      }}
                    >
                      当前文件夹
                    </Button>
                    <Button
                      variant={searchScope === 'global' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => {
                        setSearchScope('global');
                        setIsDrawerOpen(false);
                      }}
                    >
                      全局
                    </Button>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">取消</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>

        <div className="order-2 sm:order-3">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="text-center">预览</TableHead>
              <TableHead className="text-center">名称</TableHead>
              <TableHead className="text-center">用户</TableHead>
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
                className="cursor-pointer h-[50px]"
              >
                <TableCell></TableCell>
                <TableCell className="flex items-center justify-center">
                  <div className="w-[50px] h-[50px] flex items-center justify-center">
                    <FolderIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell className="text-center truncate max-w-[150px] md:max-w-sm">
                  {dir}
                </TableCell>
                <TableCell></TableCell> {/* Placeholder for Uploader */}
                <TableCell></TableCell> {/* Placeholder for Uploaded At */}
                <TableCell></TableCell> {/* Placeholder for File Size */}
                <TableCell className="text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
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
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {files.map((file: R2File) => (
              <TableRow key={file.key} className="h-[50px]">
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedKeys.has(file.key)}
                    onCheckedChange={() => handleSelect(file.key)}
                  />
                </TableCell>
                <TableCell className="flex items-center justify-center">
                  <button
                    className="relative group transition-transform hover:scale-105"
                    onClick={() => handleOpenPreview(file)}
                  >
                    <div className="relative rounded-md overflow-hidden">
                      <div className="bg-muted w-[50px] h-[50px] flex items-center justify-center">
                        <Image
                          src={file.thumbnailUrl}
                          alt={file.key}
                          fill
                          className="object-cover cursor-pointer"
                          sizes="50px"
                          placeholder={file.blurDataURL ? 'blur' : 'empty'}
                          {...(file.blurDataURL && { blurDataURL: file.blurDataURL })}
                        />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-center max-w-[120px] md:max-w-sm">
                  <ClickableTooltip content={file.key}>
                    <span
                      className="block truncate cursor-pointer"
                      onClick={() => handleCopyFilename(file.key)}
                    >
                      {file.key}
                    </span>
                  </ClickableTooltip>
                </TableCell>
                <TableCell className="text-center max-w-[120px] md:max-w-sm">
                  <ClickableTooltip content={file.uploader}>
                    <span className="block truncate">{file.uploader}</span>
                  </ClickableTooltip>
                </TableCell>
                <TableCell className="text-center truncate max-w-[120px] md:max-w-full">
                  <span className="md:hidden">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="hidden md:inline">
                    {new Date(file.uploadedAt).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-center truncate max-w-[120px] md:max-w-full">
                  {formatBytes(file.size)}
                </TableCell>
                <TableCell className="text-center truncate max-w-[120px] md:max-w-full">
                  <AlertDialog>
                    {/* Desktop Dropdown Menu */}
                    <div className="hidden md:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <a href={file.url} download={file.key}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>下载</span>
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleCopy(file.url)}
                            className="cursor-pointer"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            <span>复制链接</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              disabled={
                                Boolean(
                                  !profile?.role ||
                                    (profile.role !== 'admin' &&
                                      (!file.user_id || (user && user.id !== file.user_id)))
                                ) || isDeleting
                              }
                              title={
                                !profile?.role ||
                                (profile.role !== 'admin' &&
                                  (!file.user_id || (user && user.id !== file.user_id)))
                                  ? '你没有删除此文件的权限'
                                  : '删除文件'
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{isDeleting ? '删除中...' : '删除'}</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Mobile Drawer */}
                    <div className="md:hidden">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>{file.key}</DrawerTitle>
                            <DrawerDescription>选择一个操作</DrawerDescription>
                          </DrawerHeader>
                          <div className="p-4 grid gap-2">
                            <Button variant="outline" asChild>
                              <a href={file.url} download={file.key}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>下载</span>
                              </a>
                            </Button>
                            <Button variant="outline" onClick={() => handleCopy(file.url)}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>复制链接</span>
                            </Button>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                disabled={
                                  Boolean(
                                    !profile?.role ||
                                      (profile.role !== 'admin' &&
                                        (!file.user_id || (user && user.id !== file.user_id)))
                                  ) || isDeleting
                                }
                                title={
                                  !profile?.role ||
                                  (profile.role !== 'admin' &&
                                    (!file.user_id || (user && user.id !== file.user_id)))
                                    ? '你没有删除此文件的权限'
                                    : '删除文件'
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{isDeleting ? '删除中...' : '删除'}</span>
                              </Button>
                            </AlertDialogTrigger>
                          </div>
                          <DrawerFooter>
                            <DrawerClose asChild>
                              <Button variant="outline">取消</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </div>

                    {/* Shared Alert Dialog Content */}
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除？</AlertDialogTitle>
                        <AlertDialogDescription>
                          确认删除 {file.key}？此操作不可恢复。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(file.key)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? '删除中...' : '删除'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!directories.length && !files.length && (
          <div className="text-center p-8 text-muted-foreground">此文件夹为空</div>
        )}
        <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
          <div className="flex w-full items-center justify-between sm:w-auto sm:gap-8">
            <div className="flex items-center space-x-2">
              <p className="hidden text-sm font-medium sm:inline-block">每页行数</p>
              {/* Desktop Select */}
              <div className="hidden sm:block">
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => handlePageSizeChange(value)}
                >
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
              {/* Mobile Drawer */}
              <div className="sm:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="h-8 w-[70px]">
                      {pageSize}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>选择每页行数</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 grid grid-cols-1 gap-2">
                      {[10, 20, 50].map((size) => (
                        <DrawerClose asChild key={size}>
                          <Button
                            variant={size === pageSize ? 'default' : 'outline'}
                            onClick={() => handlePageSizeChange(size.toString())}
                          >
                            {size}
                          </Button>
                        </DrawerClose>
                      ))}
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">取消</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">共 {totalCount} 个项目</div>
          </div>

          <div className="flex w-full items-center justify-center sm:w-auto">
            {/* Desktop Pagination */}
            <div className="hidden sm:flex">
              <Pagination>
                <PaginationContent className="flex items-center space-x-2">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        setSelectedKeys(new Set());
                        handlePrevPage();
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <Select
                      value={currentPage.toString()}
                      onValueChange={(value) => {
                        setSelectedKeys(new Set());
                        setCurrentPage(parseInt(value, 10));
                      }}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue placeholder={currentPage.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm text-muted-foreground">/ {totalPages} 页</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        setSelectedKeys(new Set());
                        handleNextPage();
                      }}
                      className={!hasMore ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            {/* Mobile Drawer Pagination */}
            <div className="flex w-full items-center justify-between sm:hidden">
              <PaginationPrevious
                onClick={() => {
                  setSelectedKeys(new Set());
                  handlePrevPage();
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">
                    第 {currentPage} / {totalPages} 页
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>跳转到页面</DrawerTitle>
                  </DrawerHeader>
                  <ScrollArea className="max-h-[40vh]">
                    <div className="p-4 grid grid-cols-1 gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <DrawerClose asChild key={page}>
                          <Button
                            variant={page === currentPage ? 'default' : 'outline'}
                            onClick={() => {
                              setSelectedKeys(new Set());
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </Button>
                        </DrawerClose>
                      ))}
                    </div>
                  </ScrollArea>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">取消</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              <PaginationNext
                onClick={() => {
                  setSelectedKeys(new Set());
                  handleNextPage();
                }}
                className={!hasMore ? 'pointer-events-none opacity-50' : ''}
              />
            </div>
          </div>
        </div>
      </div>
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-2">
          <Button size="lg" onClick={handleBulkDownload} disabled={isDownloading || isDeleting}>
            <Download className="h-5 w-5 mr-2" />
            {isDownloading ? '下载中...' : `下载选中 (${selectedKeys.size})`}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" disabled={isDeleting || isDownloading}>
                <Trash2 className="h-5 w-5 mr-2" />
                {isDeleting ? '删除中...' : `删除选中 (${selectedKeys.size})`}
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
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-red-500 text-white hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
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
              <div className="mt-4 relative w-full h-[70vh] flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevPreview}
                  disabled={previewIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                {previewFile.key.toLowerCase().endsWith('.mp4') ||
                previewFile.key.toLowerCase().endsWith('.webm') ||
                previewFile.key.toLowerCase().endsWith('.mov') ? (
                  <video
                    src={previewFile.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="relative w-full h-full max-w-[70vh] max-h-[70vh]">
                    <Image
                      key={previewFile.key}
                      src={previewFile.url}
                      alt={previewFile.key}
                      fill
                      className="object-contain"
                      placeholder={previewFile.blurDataURL ? 'blur' : 'empty'}
                      {...(previewFile.blurDataURL && { blurDataURL: previewFile.blurDataURL })}
                    />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPreview}
                  disabled={previewIndex === files.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              <DialogFooter className="mt-4 sm:justify-center">
                <div className="flex flex-wrap justify-end items-center gap-2">
                  <a href={previewFile.url} download={previewFile.key}>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </Button>
                  </a>
                  <Button variant="outline" onClick={() => handleCopy(previewFile.url)}>
                    <Copy className="mr-2 h-4 w-4" />
                    复制链接
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={
                          Boolean(
                            !profile?.role ||
                              (profile.role !== 'admin' &&
                                (!previewFile.user_id || (user && user.id !== previewFile.user_id)))
                          ) || isDeleting
                        }
                        title={
                          !profile?.role ||
                          (profile.role !== 'admin' &&
                            (!previewFile.user_id || (user && user.id !== previewFile.user_id)))
                            ? '你没有删除此文件的权限'
                            : '删除文件'
                        }
                      >
                        {isDeleting ? (
                          '删除中...'
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除？</AlertDialogTitle>
                        <AlertDialogDescription>
                          确认删除 {previewFile.key}？此操作不可恢复。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(previewFile.key)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? '删除中...' : '删除'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="secondary"
                    onClick={() => setPreviewFile(null)}
                    className="sm:hidden"
                  >
                    <X className="mr-2 h-4 w-4" />
                    关闭
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export const FileListSkeleton = () => (
  <div>
    {/* Breadcrumb skeleton */}
    <div className="mb-4">
      <Skeleton className="h-6 w-32" />
    </div>

    {/* Action bar skeleton */}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4 sm:justify-start">
      <div className="order-1 sm:order-1">
        <Skeleton className="h-10 w-32 hidden sm:block" />
        <Skeleton className="h-10 w-10 sm:hidden" />
      </div>
      <div className="order-3 sm:order-2 w-full sm:w-96 sm:ml-auto">
        <div className="relative w-full max-w-sm flex items-center border border-input rounded-md h-10">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
      <div className="order-2 sm:order-3">
        <Skeleton className="h-10 w-10" />
      </div>
    </div>

    {/* File list skeleton */}
    <div className="w-full border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              <Skeleton className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead className="text-center">预览</TableHead>
            <TableHead className="text-center">名称</TableHead>
            <TableHead className="text-center">用户</TableHead>
            <TableHead className="text-center">上传时间</TableHead>
            <TableHead className="text-center">文件大小</TableHead>
            <TableHead className="text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index} className="h-[50px]">
              <TableCell className="text-center">
                <Skeleton className="h-4 w-4 mx-auto" />
              </TableCell>
              <TableCell className="flex items-center justify-center">
                <Skeleton className="w-[50px] h-[50px] rounded-md" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-24 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-20 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-8 w-8 mx-auto rounded-sm" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination skeleton */}
      <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto sm:gap-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-16 hidden sm:block" />
            <Skeleton className="h-8 w-[70px]" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex w-full items-center justify-center sm:w-auto">
          <div className="hidden sm:flex">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex w-full items-center justify-between sm:hidden">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
