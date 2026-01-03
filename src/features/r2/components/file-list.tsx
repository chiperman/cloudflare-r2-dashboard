'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Download, ImageIcon, Copy, Trash2 } from 'lucide-react';
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

import { R2File } from '../types';
import { useFileList } from '../hooks/use-file-list';
import { useR2Actions } from '../hooks/use-r2-actions';
import { copyToClipboard } from '../utils/r2-utils';

import { FileTable } from './file-table';
import { FileToolbar } from './file-toolbar';
import { PaginationManager } from './pagination-manager';
import { ImagePreview } from './image-preview';
import { FileListSkeleton } from './file-list-skeleton';

interface FileListProps {
    user: any;
    profile: any;
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
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [searchScope, setSearchScope] = useState('current');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        files,
        directories,
        isLoading,
        currentPage,
        totalPages,
        totalCount,
        hasMore,
        mutate,
        handleNextPage,
        handlePrevPage,
        jumpToPage,
    } = useFileList({
        currentPrefix,
        pageSize,
        debouncedSearchTerm,
        searchScope,
        newlyUploadedFiles,
    });

    const {
        isDeleting,
        isDownloading,
        handleDelete,
        handleBulkDelete,
        handleBulkDownload,
        handleCopyImage,
    } = useR2Actions({ mutate, currentPrefix });

    const [previewFile, setPreviewFile] = useState<R2File | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderNameError, setFolderNameError] = useState('');
    const [actionMenuFile, setActionMenuFile] = useState<R2File | null>(null);
    const [showImagePreviewInDrawer, setShowImagePreviewInDrawer] = useState(false);

    const breadcrumbParts = useMemo(() => currentPrefix.split('/').filter((p) => p), [currentPrefix]);

    const handleOpenPreview = (file: R2File, index: number) => {
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await mutate();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setCurrentPrefix('');
            return;
        }
        const newPrefix = breadcrumbParts.slice(0, index + 1).join('/') + '/';
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
            if (!response.ok) throw new Error('创建文件夹失败');
            toast({ title: '成功', description: `文件夹 "${newFolderName}" 创建成功` });
            setNewFolderName('');
            setIsCreateFolderOpen(false);
            mutate();
        } catch (err) {
            toast({ title: '失败', description: '创建失败', variant: 'destructive' });
        }
    };

    const handleDeleteFolder = async (folderName: string) => {
        try {
            const response = await fetch('/api/folders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefix: `${currentPrefix}${folderName}/` }),
            });
            if (!response.ok) throw new Error('删除失败');
            toast({ title: '成功', description: '文件夹已删除' });
            mutate();
        } catch (err) {
            toast({ title: '失败', description: '删除失败', variant: 'destructive' });
        }
    };

    const handleCopyLink = (url: string) => {
        const absoluteUrl = `${window.location.origin}${url}`;
        copyToClipboard(absoluteUrl).then(() => {
            toast({ title: '已复制!', description: '链接已到剪贴板' });
        });
    };

    const handleSelect = (key: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedKeys.size === files.length) setSelectedKeys(new Set());
        else setSelectedKeys(new Set(files.map((f) => f.key)));
    };

    if (isLoading && files.length === 0 && directories.length === 0) {
        return <FileListSkeleton />;
    }

    return (
        <TooltipProvider>
            <FileToolbar
                breadcrumbParts={breadcrumbParts}
                onBreadcrumbClick={handleBreadcrumbClick}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onClearSearch={() => { setSearchTerm(''); setDebouncedSearchTerm(''); jumpToPage(1); }}
                onSearch={() => { setDebouncedSearchTerm(searchTerm); jumpToPage(1); }}
                searchScope={searchScope}
                setSearchScope={setSearchScope}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                isCreateFolderOpen={isCreateFolderOpen}
                setIsCreateFolderOpen={setIsCreateFolderOpen}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                folderNameError={folderNameError}
                onCreateFolder={handleCreateFolder}
                isDrawerOpen={false} // Handle separately if needed
                setIsDrawerOpen={() => { }}
            />

            <FileTable
                files={files}
                directories={directories}
                selectedKeys={selectedKeys}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                isAllSelected={files.length > 0 && selectedKeys.size === files.length}
                onDirectoryClick={(dir) => setCurrentPrefix(`${currentPrefix}${dir}/`)}
                onDeleteFolder={handleDeleteFolder}
                onOpenPreview={handleOpenPreview}
                onCopyFilename={(name) => { copyToClipboard(name); toast({ title: '已复制文件名' }); }}
                onCopyImage={handleCopyImage}
                onCopyLink={handleCopyLink}
                onDeleteFile={(key) => handleDelete(key)}
                isDeleting={isDeleting}
                user={user}
                profile={profile}
                setActionMenuFile={setActionMenuFile}
            />

            <PaginationManager
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={jumpToPage}
                onPageSizeChange={(s) => setPageSize(parseInt(s, 10))}
                onNextPage={handleNextPage}
                onPrevPage={handlePrevPage}
                hasMore={hasMore}
            />

            {/* Desktop Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                    {previewFile && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="truncate">{previewFile.key}</DialogTitle>
                            </DialogHeader>
                            <div className="relative group/preview mt-4 w-full h-[60vh]">
                                <ImagePreview file={previewFile} priority className="w-full h-full" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-sm opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                    onClick={handlePrevPreview}
                                    disabled={previewIndex === 0}
                                >
                                    &larr;
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-sm opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                    onClick={handleNextPreview}
                                    disabled={previewIndex === files.length - 1}
                                >
                                    &rarr;
                                </Button>
                            </div>
                            <div className="flex justify-center gap-2 mt-4">
                                <Button variant="outline" asChild>
                                    <a href={previewFile.url} download={previewFile.key}><Download className="w-4 h-4 mr-2" /> 下载</a>
                                </Button>
                                <Button variant="outline" onClick={() => handleCopyLink(previewFile.url)}><Copy className="w-4 h-4 mr-2" /> 复制链接</Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Mobile Drawer-like Dialog */}
            {actionMenuFile && (
                <Dialog open={!!actionMenuFile} onOpenChange={(open) => !open && setActionMenuFile(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle className="truncate">{actionMenuFile.key}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="h-60 rounded-xl overflow-hidden border">
                                <ImagePreview file={actionMenuFile} className="w-full h-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" asChild className="w-full">
                                    <a href={actionMenuFile.url} download={actionMenuFile.key}><Download className="w-4 h-4 mr-2" />下载</a>
                                </Button>
                                <Button variant="outline" onClick={() => handleCopyLink(actionMenuFile.url)} className="w-full"><Copy className="w-4 h-4 mr-2" />链接</Button>
                                <Button variant="destructive" onClick={() => handleDelete(actionMenuFile.key)} disabled={isDeleting} className="w-full col-span-2">
                                    <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? '正在删除...' : '删除文件'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {selectedKeys.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-md border px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <span className="text-sm font-medium">已选中 {selectedKeys.size} 个项</span>
                    <div className="h-4 w-px bg-border" />
                    <Button size="sm" variant="outline" onClick={() => handleBulkDownload(files.filter(f => selectedKeys.has(f.key)))} disabled={isDownloading}>
                        下载
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkDelete(files.filter(f => selectedKeys.has(f.key)))} disabled={isDeleting}>
                        删除
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedKeys(new Set())}>取消</Button>
                </div>
            )}
        </TooltipProvider>
    );
}
