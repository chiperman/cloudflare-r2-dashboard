'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ClickableTooltipProps {
  children: ReactNode;
  content: ReactNode;
  delay?: number;
}

export function ClickableTooltip({ children, content, delay = 2000 }: ClickableTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for touch device only on the client side
    setIsTouchDevice(window.navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isTouchDevice) {
      // e.preventDefault(); // Prevent any other click behavior
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsOpen(true);
      timerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, delay);
    }
  };

  if (isTouchDevice) {
    return (
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild onClick={handleTriggerClick}>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default hover behavior for non-touch devices
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {typeof content === 'string' ? <p>{content}</p> : content}
      </TooltipContent>
    </Tooltip>
  );
}
