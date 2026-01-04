'use client';

import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import GithubIcon from './icons/github-icon';
import { AuthButton } from '@/features/auth/components/auth-button';
import { hasEnvVars } from '@/lib/utils';
import { EnvVarWarning } from "./env-var-warning";
import { Button } from "@/components/ui/button";
import { MobileMenu } from './mobile-menu';

export function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 z-50 bg-background">
      <div className="w-full flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={'/'}>Cloudflare R2 Dashboard</Link>
        </div>
        <div className="flex items-center gap-3">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          {/* Desktop - GitHub icon and Theme switcher */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href="https://github.com/chiperman/cloudflare-r2-dashboard"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon className="text-muted-foreground" />
              </a>
            </Button>
            <ThemeSwitcher />
          </div>
          {/* Mobile menu */}
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
