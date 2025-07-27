import React from 'react';
import Image from 'next/image';

interface ImagePreviewDialogProps {
  url: string;
  open: boolean;
  onClose: () => void;
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({ url, open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
        <Image
          src={url}
          alt="预览大图"
          width={1920}
          height={1080}
          className="h-auto w-auto max-h-[80vh] max-w-[90vw] rounded shadow-lg"
        />
        <button
          className="absolute top-2 right-2 bg-white/80 rounded-full px-3 py-1 text-black hover:bg-white"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </div>
  );
};