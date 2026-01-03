'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { UploadableFile } from '../types';

interface UseMediaConversionProps {
    onProgress?: (id: string, progress: number) => void;
}

export function useMediaConversion({ onProgress }: UseMediaConversionProps = {}) {
    const { toast } = useToast();
    const [modulesLoaded, setModulesLoaded] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

    const ffmpegRef = useRef<any | null>(null);
    const convertingFileIdRef = useRef<string | null>(null);

    const [_heic2any, setHeic2any] = useState<any>(null);
    const [FFmpeg, setFFmpeg] = useState<any>(null);
    const [fetchFile, setFetchFile] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !modulesLoaded) {
            Promise.all([
                import('heic2any').then((mod) => setHeic2any(() => mod.default)),
                import('@ffmpeg/ffmpeg').then((mod) => setFFmpeg(() => mod.FFmpeg)),
                import('@ffmpeg/util').then((mod) => setFetchFile(() => mod.fetchFile)),
            ])
                .then(() => {
                    setModulesLoaded(true);
                })
                .catch((e) => {
                    console.error('Failed to load dynamic modules:', e);
                    toast({
                        title: '加载必要模块失败',
                        description: '部分上传功能可能不可用。',
                        variant: 'destructive',
                    });
                });
        }
    }, [modulesLoaded, toast]);

    const loadFfmpeg = async () => {
        if (ffmpegRef.current || !FFmpeg) return;

        const ffmpeg = new FFmpeg({
            coreURL: '/ffmpeg-core.js',
            wasmURL: '/ffmpeg-core.wasm',
            workerURL: '/ffmpeg-core.worker.js',
        });

        ffmpeg.on('log', ({ message }: { message: string }) => {
            console.log('[ffmpeg log]', message);
        });

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
            const convertingId = convertingFileIdRef.current;
            if (convertingId && onProgress) {
                onProgress(convertingId, Math.round(progress * 100));
            }
        });

        try {
            await ffmpeg.load();
            ffmpegRef.current = ffmpeg;
            setFfmpegLoaded(true);
        } catch (e) {
            console.error('Failed to load FFmpeg:', e);
            toast({
                title: '视频转换工具加载失败',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        if (modulesLoaded && !ffmpegLoaded && FFmpeg) {
            loadFfmpeg();
        }
    }, [modulesLoaded, ffmpegLoaded, FFmpeg]);

    const processFile = async (file: File): Promise<Partial<UploadableFile>> => {
        const isHeic = /heic|heif$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
        const isMov = /mov$/i.test(file.name) || file.type === 'video/quicktime';

        const id = `${file.name}-${file.size}-${file.lastModified}`;
        let processedFile = file;
        let status: UploadableFile['status'] = 'pending';
        let error: string | undefined;

        if (isHeic) {
            if (!_heic2any) {
                return { id, status: 'error', error: 'HEIC 转换模块未加载' };
            }
            try {
                const convertedBlob = await _heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.8,
                });
                const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
                processedFile = new File([convertedBlob as Blob], newFileName, {
                    type: 'image/jpeg',
                    lastModified: file.lastModified,
                });
            } catch (e) {
                return { id, status: 'error', error: 'HEIC/HEIF 转换失败' };
            }
        } else if (isMov) {
            if (!ffmpegLoaded || !ffmpegRef.current || !fetchFile) {
                return { id, status: 'error', error: '视频转换工具未就绪' };
            }

            try {
                convertingFileIdRef.current = id;
                const inputName = 'input.mov';
                const outputName = file.name.replace(/\.(mov)$/i, '.mp4');

                await ffmpegRef.current.writeFile(inputName, await fetchFile(file));
                await ffmpegRef.current.exec(['-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', outputName]);

                const data = await ffmpegRef.current.readFile(outputName);
                processedFile = new File([data as BlobPart], outputName, {
                    type: 'video/mp4',
                    lastModified: file.lastModified,
                });
            } catch (e) {
                console.error('MOV 转换失败:', e);
                return { id, status: 'error', error: '视频转换失败' };
            } finally {
                convertingFileIdRef.current = null;
            }
        }

        return {
            id,
            file: processedFile,
            status: 'pending',
            preview: processedFile.type.startsWith('image/') || processedFile.type.startsWith('video/')
                ? URL.createObjectURL(processedFile)
                : undefined,
            isConverting: false,
        };
    };

    const terminateFfmpeg = () => {
        if (ffmpegRef.current) {
            ffmpegRef.current.terminate();
            ffmpegRef.current = null;
            setFfmpegLoaded(false);
        }
    };

    return {
        modulesLoaded,
        ffmpegLoaded,
        processFile,
        terminateFfmpeg,
    };
}
