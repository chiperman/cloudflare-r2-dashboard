'use client';

import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface UploadDropzoneProps {
    onDrop: (acceptedFiles: File[], fileRejections: any[]) => void;
    maxFiles: number;
    maxSizeMB: number;
}

export function UploadDropzone({ onDrop, maxFiles, maxSizeMB }: UploadDropzoneProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        maxSize: maxSizeMB * 1024 * 1024,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg'],
            'image/heic': ['.heic'],
            'image/heif': ['.heif'],
            'video/mp4': ['.mp4'],
            'video/webm': ['.webm'],
            'video/ogg': ['.ogg'],
            'video/quicktime': ['.mov'],
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
        ${isDragActive
                    ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                }`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className={`p-4 rounded-full bg-muted/50 transition-colors ${isDragActive ? 'text-primary bg-primary/10' : ''}`}>
                    <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                        {isDragActive ? '松开即可上传' : '拖拽文件到此处，或点击选择'}
                    </p>
                    <p className="text-xs">
                        支持图片和视频 (最多 {maxFiles} 个文件，单文件不超过 {maxSizeMB}MB)
                    </p>
                </div>
            </div>
        </div>
    );
}
