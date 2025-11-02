import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Download, Copy, ImageIcon, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { R2File } from '@/lib/types';

import { useState, useEffect } from 'react';
import { RemoveScroll } from 'react-remove-scroll';

interface MobilePreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewFile: R2File | null;
  handlePrevPreview: () => void;
  handleNextPreview: () => void;
  previewIndex: number | null;
  files: R2File[];
  isDeleting: boolean;
  handleDelete: (fileKey: string) => void;
  handleCopy: (url: string) => void;
  handleCopyImage: (file: R2File) => void;
  profile: { role: string } | null;
  user: { id: string } | null;
}

export function MobilePreviewDrawer({
  open,
  onOpenChange,
  previewFile,
  handlePrevPreview,
  handleNextPreview,
  previewIndex,
  files,
  isDeleting,
  handleDelete,
  handleCopy,
  handleCopyImage,
  profile,
  user,
}: MobilePreviewDrawerProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [previewFile]);

  if (!open || !previewFile) return null;

  return (
    <RemoveScroll>
      <div
        className="fixed inset-0 z-50 bg-background flex flex-col h-screen"
        style={{ touchAction: 'none' }}
      >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-6 w-6" />
          </Button>
          <h2 className="font-semibold text-base overflow-hidden text-ellipsis whitespace-nowrap">{previewFile.key}</h2>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow relative flex items-center justify-center">
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handlePrevPreview}
                    disabled={previewIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 shadow-lg"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>        {previewFile.key.toLowerCase().endsWith('.mp4') ||
        previewFile.key.toLowerCase().endsWith('.webm') ||
        previewFile.key.toLowerCase().endsWith('.mov') ? (
          <video src={previewFile.url} controls autoPlay className="w-full h-full object-contain">
            Your browser does not support the video tag.
          </video>
        ) : (
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              backgroundImage: !isImageLoaded && previewFile.blurDataURL ? `url(${previewFile.blurDataURL})` : 'none',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <Image
              key={previewFile.key}
              src={previewFile.url}
              alt={previewFile.key}
              fill
              className="object-contain"
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>
        )}
        <Button
          variant="default"
          size="icon"
          onClick={handleNextPreview}
          disabled={previewIndex === (files?.length ?? 0) - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 shadow-lg"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t p-2">
        <div className="flex justify-around items-center">
          <a href={previewFile.url} download={previewFile.key}>
            <Button variant="ghost" className="flex flex-col items-center h-auto">
              <Download className="h-6 w-6" />
              <span className="text-xs mt-1">下载</span>
            </Button>
          </a>
          <Button variant="ghost" onClick={() => handleCopy(previewFile.url)} className="flex flex-col items-center h-auto">
            <Copy className="h-6 w-6" />
            <span className="text-xs mt-1">复制链接</span>
          </Button>
          {/\.(jpe?g|png|gif|webp|bmp)$/i.test(previewFile.key) && (
            <Button variant="ghost" onClick={() => handleCopyImage(previewFile)} className="flex flex-col items-center h-auto">
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs mt-1">复制图片</span>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center h-auto text-destructive"
                disabled={
                  Boolean(
                    !profile?.role ||
                      (profile.role !== 'admin' &&
                        (!previewFile.user_id || (user && user.id !== previewFile.user_id)))
                  ) || isDeleting
                }
                title={
                  !profile?.role ||
                  (profile.role !== 'admin' &&
                    (!previewFile.user_id || (user && user.id !== previewFile.user_id)))
                    ? '你没有删除此文件的权限'
                    : '删除文件'
                }
              >
                <Trash2 className="h-6 w-6" />
                <span className="text-xs mt-1">{isDeleting ? '删除中...' : '删除'}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除？</AlertDialogTitle>
                <AlertDialogDescription>
                  确认删除 {previewFile.key}？此操作不可恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(previewFile.key)} disabled={isDeleting}>
                  {isDeleting ? '删除中...' : '删除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </footer>
            </div>
        </RemoveScroll>
      );}