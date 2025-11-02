import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Download, Copy, ImageIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { R2File } from '@/lib/types';

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
  if (!previewFile) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background">
        <DrawerHeader>
          <DrawerTitle className="truncate">{previewFile.key}</DrawerTitle>
        </DrawerHeader>
        <div className="relative w-full h-[60vh] flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevPreview}
            disabled={previewIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          {previewFile.key.toLowerCase().endsWith('.mp4') ||
          previewFile.key.toLowerCase().endsWith('.webm') ||
          previewFile.key.toLowerCase().endsWith('.mov') ? (
            <video src={previewFile.url} controls autoPlay className="w-full h-full object-contain">
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="relative w-full h-full">
              <Image
                key={previewFile.key}
                src={previewFile.url}
                alt={previewFile.key}
                fill
                className="object-contain"
                placeholder={previewFile.blurDataURL ? 'blur' : 'empty'}
                {...(previewFile.blurDataURL && { blurDataURL: previewFile.blurDataURL })}
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPreview}
            disabled={previewIndex === (files?.length ?? 0) - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <a href={previewFile.url} download={previewFile.key} className="w-full">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
            </a>
            <Button variant="outline" onClick={() => handleCopy(previewFile.url)} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              复制链接
            </Button>
            {/\.(jpe?g|png|gif|webp|bmp)$/i.test(previewFile.key) && (
              <Button variant="outline" onClick={() => handleCopyImage(previewFile)} className="w-full">
                <ImageIcon className="mr-2 h-4 w-4" />
                复制图片
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
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
                  {isDeleting ? '删除中...' : '删除'}
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
          <DrawerClose asChild className="mt-2">
            <Button variant="outline">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}