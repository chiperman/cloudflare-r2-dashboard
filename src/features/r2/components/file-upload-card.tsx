'use client';

import Image from 'next/image';
import { File as FileIcon, X, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '../utils/r2-utils';
import { UploadableFile } from '../types';

interface FileUploadCardProps {
    uploadable: UploadableFile;
    onRemove: (id: string) => void;
}

export function FileUploadCard({ uploadable, onRemove }: FileUploadCardProps) {
    const { file, progress, status, error, preview } = uploadable;
    const isConverting = status === 'converting';
    const isUploading = status === 'uploading';
    const isError = status === 'error';
    const isSuccess = status === 'success';

    return (
        <div className="p-4 border rounded-lg flex items-stretch justify-between gap-4 bg-muted/30 transition-all hover:bg-muted/50">
            {preview ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative border shadow-sm bg-background">
                    {file.type.startsWith('image/') ? (
                        <Image src={preview} alt={file.name} fill className="object-cover" sizes="48px" />
                    ) : (
                        <video src={preview} className="object-cover w-full h-full" muted preload="metadata" />
                    )}
                </div>
            ) : (
                <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileIcon className="w-6 h-6 text-muted-foreground" />
                </div>
            )}

            <div className="flex-grow min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatBytes(file.size)}</p>
                </div>

                {(isUploading || isConverting) && (
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            <span>{isConverting ? '正在转换...' : '正在上传...'}</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>
                )}

                {isError && (
                    <p className="text-xs text-destructive mt-1 font-medium italic truncate">{error}</p>
                )}
            </div>

            <div className="flex flex-col items-center justify-center px-1">
                {(status === 'pending' || isError || isConverting) && (
                    <button
                        onClick={() => onRemove(uploadable.id)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                {isUploading && (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                {isSuccess && (
                    <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />
                )}
            </div>
        </div>
    );
}
