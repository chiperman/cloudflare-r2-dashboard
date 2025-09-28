"use client";

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ThemeAwareImage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Respect the aspect ratio 4:3 and apply same classes as the image
    return <Skeleton className="w-[800px] h-[600px] max-w-full rounded-lg shadow-lg mt-8" />;
  }

  const src = theme === 'dark' ? '/black.png' : '/white.png';

  return (
    <Image
      src={src}
      alt="R2 Management Screenshot"
      width={800}
      height={600}
      className="rounded-lg shadow-lg mt-8"
      priority
    />
  );
}
