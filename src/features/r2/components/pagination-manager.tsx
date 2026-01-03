'use client';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PaginationManagerProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: string) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
    hasMore: boolean;
}

export function PaginationManager({
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
    onNextPage,
    onPrevPage,
    hasMore,
}: PaginationManagerProps) {
    return (
        <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row border shadow-sm rounded-lg mt-4 bg-background">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <p className="hidden text-sm font-medium sm:inline-block">每页行数</p>
                    <div className="hidden sm:block">
                        <Select value={`${pageSize}`} onValueChange={onPageSizeChange}>
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={`${pageSize}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="sm:hidden">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">{pageSize}</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>每页行数</DialogTitle></DialogHeader>
                                <div className="grid gap-2">
                                    {[10, 20, 50].map((size) => (
                                        <DialogClose key={size} asChild>
                                            <Button variant={size === pageSize ? "default" : "outline"} onClick={() => onPageSizeChange(`${size}`)}>{size}</Button>
                                        </DialogClose>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">共 {totalCount} 个项目</p>
            </div>

            <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2">
                    <PaginationPrevious onClick={onPrevPage} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                    <Select value={`${currentPage}`} onValueChange={(v) => onPageChange(parseInt(v, 10))}>
                        <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <SelectItem key={p} value={`${p}`}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground font-medium">/ {totalPages}</span>
                    <PaginationNext onClick={onNextPage} className={!hasMore ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                </div>

                <div className="flex sm:hidden items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={onPrevPage} disabled={currentPage === 1}>上一页</Button>
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">{currentPage} / {totalPages}</Button></DialogTrigger>
                        <DialogContent className="max-h-[80vh] flex flex-col">
                            <DialogHeader><DialogTitle>跳转页面</DialogTitle></DialogHeader>
                            <ScrollArea className="flex-1 pr-4">
                                <div className="grid gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <DialogClose key={p} asChild>
                                            <Button variant={p === currentPage ? "default" : "outline"} onClick={() => onPageChange(p)}>{p} 页</Button>
                                        </DialogClose>
                                    ))}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={onNextPage} disabled={!hasMore}>下一页</Button>
                </div>
            </div>
        </div>
    );
}
