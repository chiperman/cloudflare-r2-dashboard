'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { R2File } from '@/lib/types';

interface ImagePreviewProps {
    file: R2File;
    priority?: boolean;
    className?: string;
}

export function ImagePreview({ file, priority = false, className }: ImagePreviewProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const isVideo = /\.(mp4|webm|mov)$/i.test(file.key);

    // 当文件改变时，重置所有状态
    useEffect(() => {
        setIsLoaded(false);
        setIsVisible(false);

        // 确保在下一帧开始动画，防止闪烁
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => clearTimeout(timer);
    }, [file.key, file.url]);

    if (isVideo) {
        return (
            <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
                <video
                    src={file.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    }

    return (
        <div className={cn("relative w-full h-full overflow-hidden flex items-center justify-center", className)}>
            {/* Blur Layer - Only show while high-res is loading or if we have it */}
            {file.blurDataURL && (
                <div
                    className={cn(
                        "absolute inset-0 z-0 transition-opacity duration-700 ease-in-out",
                        isLoaded ? "opacity-0" : "opacity-100"
                    )}
                    style={{
                        backgroundImage: `url(${file.blurDataURL})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        filter: 'blur(8px)',
                        transform: 'scale(1.1)', // Prevent white edges from blur
                    }}
                />
            )}

            {/* High-res Image */}
            <Image
                key={file.url}
                src={file.url}
                alt={file.key}
                fill
                priority={priority}
                className={cn(
                    "relative z-10 object-contain transition-all duration-700 ease-in-out",
                    (isLoaded && isVisible) ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
                )}
                onLoad={() => setIsLoaded(true)}
            />

            {/* Loading indicator (optional, but keep it minimal) */}
            {!isLoaded && !file.blurDataURL && (
                <div className="absolute inset-0 flex items-center justify-center bg-accent/5 animate-pulse" />
            )}
        </div>
    );
}
