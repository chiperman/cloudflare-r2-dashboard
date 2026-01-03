'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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
            <TableHead className="text-center w-[50px]">
              <Skeleton className="h-4 w-4 mx-auto" />
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
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index} className="h-[60px]">
              <TableCell className="text-center">
                <Skeleton className="h-4 w-4 mx-auto" />
              </TableCell>
              <TableCell className="flex items-center justify-center">
                <Skeleton className="w-[45px] h-[45px] rounded-md" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-24 mx-auto" />
              </TableCell>
              <TableCell className="text-center hidden md:table-cell">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <Skeleton className="h-4 w-20 mx-auto" />
              </TableCell>
              <TableCell className="text-center hidden md:table-cell">
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
      <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row shadow-sm rounded-lg mt-4 border">
        <div className="flex w-full items-center justify-between sm:w-auto sm:gap-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-16 hidden sm:block" />
            <Skeleton className="h-8 w-[70px]" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex w-full items-center justify-center sm:w-auto">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    </div>
  </div>
);
