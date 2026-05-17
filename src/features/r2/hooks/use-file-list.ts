'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { R2File } from '../types';

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

interface UseFileListProps {
    currentPrefix: string;
    pageSize: number;
    debouncedSearchTerm: string;
    searchScope: string;
    uploadVersion: number;
}

export function useFileList({
    currentPrefix,
    pageSize,
    debouncedSearchTerm,
    searchScope,
    uploadVersion,
}: UseFileListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const isSearching = debouncedSearchTerm.length > 0;

    const swrKey = (() => {
        if (isSearching) {
            const apiPrefix = searchScope === 'global' ? '' : currentPrefix;
            return `/api/files?limit=${pageSize}&prefix=${apiPrefix}&page=${currentPage}&search=${debouncedSearchTerm}&scope=${searchScope}`;
        }
        return `/api/files?limit=${pageSize}&prefix=${currentPrefix}&page=${currentPage}&search=`;
    })();

    const { data, error, isLoading, mutate } = useSWR<FileListResponse>(swrKey, fetcher);

    const files = data?.files || [];
    const directories = data?.directories || [];
    const hasMore = data?.isTruncated || false;
    const totalCount = data?.totalCount || 0;
    const totalPages = data?.totalPages || 1;

    // Jump to page 1 and refresh when new files are uploaded
    useEffect(() => {
        if (uploadVersion > 0) {
            const timer = window.setTimeout(() => {
                setCurrentPage(1);
                void mutate();
            }, 0);

            return () => window.clearTimeout(timer);
        }
    }, [uploadVersion, mutate]);

    // Reset to page 1 when folder or page size changes
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setCurrentPage(1);
        }, 0);

        return () => window.clearTimeout(timer);
    }, [currentPrefix, pageSize]);

    const handleNextPage = () => {
        if (hasMore) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const jumpToPage = (page: number) => {
        setCurrentPage(page);
    };

    return {
        files,
        directories,
        isLoading: isLoading || !data,
        error,
        currentPage,
        totalPages,
        totalCount,
        hasMore,
        mutate,
        handleNextPage,
        handlePrevPage,
        jumpToPage,
    };
}
