import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Download, Copy, ImageIcon, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { R2File } from '@/lib/types';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useRef } from 'react';

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
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [previewFile]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        hiddenInputRef.current?.focus({ preventScroll: true });
        hiddenInputRef.current?.blur();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open || !previewFile) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="truncate">{previewFile.key}</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-grow">
          {/* Image/Video Preview Area */}
          <div className="relative flex items-center justify-center p-4 min-h-[200px]">
            {previewFile.key.toLowerCase().endsWith('.mp4') ||
            previewFile.key.toLowerCase().endsWith('.webm') ||
            previewFile.key.toLowerCase().endsWith('.mov') ? (
              <video src={previewFile.url} controls autoPlay className="w-full h-full object-contain">
                Your browser does not support the video tag.
              </video>
            ) : (
              <div
                className="relative w-full h-full min-h-[200px] overflow-hidden"
                style={{
                  backgroundImage:
                    !isImageLoaded && previewFile.blurDataURL
                      ? `url(${previewFile.blurDataURL})`
                      : 'none',
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
          </div>

          {/* Navigation Buttons */}
          <div className="p-4 flex justify-between border-t">
            <Button
              variant="outline"
              onClick={handlePrevPreview}
              disabled={previewIndex === 0 || files.length <= 1}
              className="w-full mr-2"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              上一张
            </Button>
            <Button
              variant="outline"
              onClick={handleNextPreview}
              disabled={previewIndex === (files?.length ?? 0) - 1 || files.length <= 1}
              className="w-full ml-2"
            >
              下一张
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 grid gap-2 border-t">
            <Button variant="outline" asChild>
              <a
                href={previewFile.url}
                download={previewFile.key}
                className="flex items-center justify-center"
              >
                <Download className="mr-2 h-4 w-4" />
                <span>下载</span>
              </a>
            </Button>

            {/\.(jpe?g|png|gif|webp|bmp)$/i.test(previewFile.key) && (
              <Button variant="outline" onClick={() => handleCopyImage(previewFile)}>
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>复制图片</span>
              </Button>
            )}

            <Button variant="outline" onClick={() => handleCopy(previewFile.url)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>复制链接</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
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
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{isDeleting ? '删除中...' : '删除'}</span>
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
                  <AlertDialogAction
                    onClick={() => handleDelete(previewFile.key)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '删除中...' : '删除'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </ScrollArea>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">取消</Button>
          </DrawerClose>
        </DrawerFooter>
        <input ref={hiddenInputRef} style={{ position: 'absolute', left: '-9999px' }} readOnly />
      </DrawerContent>
    </Drawer>
  );
}
