'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Folder as FolderIcon,
    Trash2,
    Eye,
    MoreHorizontal,
    Download,
    Image as ImageIcon,
    Copy,
} from 'lucide-react';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClickableTooltip } from '@/components/ui/clickable-tooltip';
import { formatBytes } from '../utils/r2-utils';
import { R2File } from '../types';

interface FileTableProps {
    files: R2File[];
    directories: string[];
    selectedKeys: Set<string>;
    onSelect: (key: string) => void;
    onSelectAll: () => void;
    isAllSelected: boolean;
    onDirectoryClick: (dir: string) => void;
    onDeleteFolder: (dir: string) => void;
    onOpenPreview: (file: R2File, index: number) => void;
    onCopyFilename: (name: string) => void;
    onCopyImage: (file: R2File) => void;
    onCopyLink: (url: string) => void;
    onDeleteFile: (key: string) => void;
    isDeleting: boolean;
    user: any;
    profile: any;
    setActionMenuFile: (file: R2File | null) => void;
}

export function FileTable({
    files,
    directories,
    selectedKeys,
    onSelect,
    onSelectAll,
    isAllSelected,
    onDirectoryClick,
    onDeleteFolder,
    onOpenPreview,
    onCopyFilename,
    onCopyImage,
    onCopyLink,
    onDeleteFile,
    isDeleting,
    user,
    profile,
    setActionMenuFile,
}: FileTableProps) {
    return (
        <div className="w-full border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center w-[50px]">
                            <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
                        </TableHead>
                        <TableHead className="text-center w-[100px]">预览</TableHead>
                        <TableHead className="text-center">名称</TableHead>
                        <TableHead className="text-center hidden md:table-cell">用户</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">上传时间</TableHead>
                        <TableHead className="text-center hidden md:table-cell">大小</TableHead>
                        <TableHead className="text-center w-[100px]">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {directories.map((dir) => (
                        <TableRow
                            key={dir}
                            onDoubleClick={() => onDirectoryClick(dir)}
                            className="cursor-pointer h-[60px]"
                        >
                            <TableCell></TableCell>
                            <TableCell className="flex items-center justify-center h-[60px]">
                                <FolderIcon className="w-6 h-6 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="text-center font-medium">
                                {dir}
                            </TableCell>
                            <TableCell className="hidden md:table-cell"></TableCell>
                            <TableCell className="hidden sm:table-cell"></TableCell>
                            <TableCell className="hidden md:table-cell"></TableCell>
                            <TableCell className="text-center">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确认删除文件夹？</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                您确定要删除文件夹 &quot;{dir}&quot; 及其包含的所有内容吗？此操作不可恢复。
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDeleteFolder(dir)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                删除
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                    {files.map((file, index) => (
                        <TableRow key={file.key} className="h-[60px]">
                            <TableCell className="text-center">
                                <Checkbox
                                    checked={selectedKeys.has(file.key)}
                                    onCheckedChange={() => onSelect(file.key)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center">
                                    <button
                                        className="relative group transition-all hover:scale-105"
                                        onClick={() => onOpenPreview(file, index)}
                                    >
                                        <div className="w-[45px] h-[45px] rounded-md overflow-hidden bg-muted flex items-center justify-center border shadow-sm">
                                            <Image
                                                src={file.thumbnailUrl}
                                                alt={file.key}
                                                fill
                                                className="object-cover"
                                                sizes="45px"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Eye className="h-5 w-5 text-white" />
                                        </div>
                                    </button>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <ClickableTooltip content={file.key}>
                                    <span
                                        className="block truncate max-w-[150px] mx-auto cursor-pointer hover:underline underline-offset-4"
                                        onClick={() => onCopyFilename(file.key)}
                                    >
                                        {file.key}
                                    </span>
                                </ClickableTooltip>
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                                <ClickableTooltip content={file.uploader}>
                                    <span className="block truncate max-w-[100px] mx-auto text-muted-foreground text-sm">{file.uploader}</span>
                                </ClickableTooltip>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell text-sm text-muted-foreground">
                                {new Date(file.uploadedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell text-sm">
                                {formatBytes(file.size)}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <div className="hidden md:flex">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <a href={file.url} download={file.key} className="flex items-center">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        <span>下载</span>
                                                    </a>
                                                </DropdownMenuItem>
                                                {/\.(jpe?g|png|gif|webp|bmp)$/i.test(file.key) && (
                                                    <DropdownMenuItem onSelect={() => onCopyImage(file)}>
                                                        <ImageIcon className="mr-2 h-4 w-4" />
                                                        <span>复制图片</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onSelect={() => onCopyLink(file.url)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <span>复制链接</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            disabled={
                                                                Boolean(
                                                                    !profile?.role ||
                                                                    (profile.role !== 'admin' &&
                                                                        (!file.user_id || (user && user.id !== file.user_id)))
                                                                ) || isDeleting
                                                            }
                                                            onSelect={(e) => e.preventDefault()}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>{isDeleting ? '删除中...' : '删除'}</span>
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                                            <AlertDialogDescription>确认删除 {file.key}？此操作不可恢复。</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => onDeleteFile(file.key)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                删除
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="md:hidden">
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setActionMenuFile(file)}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {!directories.length && !files.length && (
                <div className="text-center py-20 bg-muted/20 text-muted-foreground italic">
                    此文件夹为空
                </div>
            )}
        </div>
    );
}
