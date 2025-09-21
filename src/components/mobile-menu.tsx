'use client';

import { Menu } from 'lucide-react';
import { ThemeSwitcher } from './theme-switcher';
import GithubIcon from './icons/github-icon';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { LogoutButton } from './logout-button';

export function MobileMenu() {
  return (
    <div className="md:hidden">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Toggle menu">
            <Menu size={20} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>菜单</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 grid grid-cols-1 gap-3">
            <ThemeSwitcher isMobile={true} />
            <Button asChild variant="outline">
              <a
                href="https://github.com/chiperman/cloudflare-r2-dashboard"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2"
              >
                <GithubIcon />
                <span>查看源码</span>
              </a>
            </Button>
            <LogoutButton />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}