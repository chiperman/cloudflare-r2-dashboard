"use client";

import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import GithubIcon from "./icons/github-icon";
import { AuthButton } from "./auth-button";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "./env-var-warning";

export function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={'/'}>Cloudflare R2 Dashboard</Link>
        </div>
        <div className="flex items-center gap-3">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          <a
            href="https://github.com/chiperman/cloudflare-r2-dashboard"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-md hover:bg-muted"
          >
            <GithubIcon />
          </a>
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
