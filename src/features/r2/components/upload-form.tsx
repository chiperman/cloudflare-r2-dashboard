'use client';

import { R2File } from '../types';
import { useUpload } from '../hooks/use-upload';
import { UploadDropzone } from './upload-dropzone';
import { FileUploadCard } from './file-upload-card';
import { Skeleton } from '@/components/ui/skeleton';

interface UploadFormProps {
    onUploadSuccess: (newFiles: R2File[]) => void;
    currentPrefix: string;
}

export function UploadForm({ onUploadSuccess, currentPrefix }: UploadFormProps) {
    const {
        files,
        isUploading,
        modulesLoaded,
        ffmpegLoaded,
        onDrop,
        removeFile,
        handleUploadAll,
        pendingCount,
    } = useUpload({
        currentPrefix,
        onUploadSuccess,
    });

    return (
        <div className="w-full mx-auto space-y-6 mb-8">
            {/* Loading States */}
            {!modulesLoaded && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2 border border-blue-100 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    正在初始化核心模块...
                </div>
            )}
            {modulesLoaded && !ffmpegLoaded && (
                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center gap-2 border border-amber-100">
                    <div className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                    正在加载视频引擎，处理 MOV 需要一些时间...
                </div>
            )}

            {/* Main Dropzone */}
            <UploadDropzone onDrop={onDrop} maxFiles={9} maxSizeMB={30} />

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                    {files.map((file) => (
                        <FileUploadCard key={file.id} uploadable={file} onRemove={removeFile} />
                    ))}
                </div>
            )}

            {/* Upload Action */}
            <div className="pt-4 border-t">
                <button
                    onClick={handleUploadAll}
                    disabled={pendingCount === 0 || isUploading || !modulesLoaded}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 disabled:shadow-none"
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            正在上传...
                        </span>
                    ) : (
                        `开始上传 ${pendingCount} 个文件`
                    )}
                </button>
            </div>
        </div>
    );
}

export function UploadFormSkeleton() {
    return (
        <div className="w-full mx-auto mb-8 space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
        </div>
    );
}
