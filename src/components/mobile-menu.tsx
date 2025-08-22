'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { ThemeSwitcher } from './theme-switcher';
import GithubIcon from './icons/github-icon';
import { Button } from '@/components/ui/button';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-foreground/10 rounded-md shadow-lg z-50">
          <div className="flex flex-col py-1">
            <a
              href="https://github.com/chiperman/cloudflare-r2-dashboard"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <span>GitHub</span>
              <Button variant="ghost" size="sm">
                <GithubIcon className="text-muted-foreground" size={16} />
              </Button>
            </a>
            <div className="flex items-center justify-between px-4 py-2 hover:bg-muted">
              <span className="text-sm">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}