"use client";

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeAwareImage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; 
  }

  const src = theme === 'dark' ? '/black.png' : '/white.png';

  return (
    <Image
      src={src}
      alt="R2 Management Screenshot"
      width={800}
      height={600}
      className="rounded-lg shadow-lg mt-8"
    />
  );
}
