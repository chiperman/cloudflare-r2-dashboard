'use client';

import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    X,
    ChevronDown,
    RefreshCw,
    FolderPlus,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

interface FileToolbarProps {
    breadcrumbParts: string[];
    onBreadcrumbClick: (index: number) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onClearSearch: () => void;
    onSearch: () => void;
    searchScope: string;
    setSearchScope: (scope: string) => void;
    isRefreshing: boolean;
    onRefresh: () => void;
    isCreateFolderOpen: boolean;
    setIsCreateFolderOpen: (open: boolean) => void;
    newFolderName: string;
    setNewFolderName: (name: string) => void;
    folderNameError: string;
    onCreateFolder: () => void;
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
}

export function FileToolbar({
    breadcrumbParts,
    onBreadcrumbClick,
    searchTerm,
    setSearchTerm,
    onClearSearch,
    onSearch,
    searchScope,
    setSearchScope,
    isRefreshing,
    onRefresh,
    isCreateFolderOpen,
    setIsCreateFolderOpen,
    newFolderName,
    setNewFolderName,
    folderNameError,
    onCreateFolder,
    isDrawerOpen,
    setIsDrawerOpen,
}: FileToolbarProps) {
    return (
        <div className="space-y-4 mb-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onBreadcrumbClick(-1); }}>
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
                                    <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onBreadcrumbClick(index); }}>
                                        {part}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
                <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 shrink-0">
                            <FolderPlus className="h-4 w-4" />
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
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            {folderNameError && (
                                <p className="text-sm text-destructive mt-2">{folderNameError}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">取消</Button>
                            </DialogClose>
                            <Button onClick={onCreateFolder} disabled={!!folderNameError || !newFolderName}>
                                创建
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex-1 max-w-sm flex items-center border rounded-md px-3 bg-background focus-within:ring-2 focus-within:ring-primary/20">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input
                        placeholder={searchScope === 'current' ? '搜索当前...' : '全局搜索...'}
                        className="border-0 focus-visible:ring-0 px-0 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    />
                    {searchTerm && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClearSearch}>
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setSearchScope('current')}>当前文件夹</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSearchScope('global')}>全局搜索</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
                    <RefreshCw className={isRefreshing ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
                </Button>
            </div>
        </div>
    );
}
