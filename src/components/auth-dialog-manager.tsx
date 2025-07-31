"use client";

import { useState, useEffect } from "react";
import { LoginDialog } from "@/components/login-dialog";
import { SignUpDialog } from "@/components/sign-up-dialog";
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { useRouter } from "next/navigation";
import { ProfileDialog } from "./profile-dialog";
import { ThemeSwitcher } from "./theme-switcher";
import GithubIcon from "@/components/icons/github-icon";

export function AuthDialogManager() {
  const [user, setUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const switchToLogin = () => {
    setSignUpOpen(false);
    setForgotPasswordOpen(false);
    setLoginOpen(true);
  };

  const switchToSignUp = () => {
    setLoginOpen(false);
    setSignUpOpen(true);
  };

  const switchToForgotPassword = () => {
    setLoginOpen(false);
    setForgotPasswordOpen(true);
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        Hey, {user.user_metadata.display_name || user.email}!
        <LogoutButton />
        <ProfileDialog user={user} />
        <ThemeSwitcher />
        <a
          href="https://github.com/chiperman/cloudflare-r2-dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/80 hover:text-foreground"
        >
          <GithubIcon size={16} />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setLoginOpen(true)}>
          登录
        </Button>
        <Button size="sm" variant="default" onClick={() => setSignUpOpen(true)}>
          注册
        </Button>
      </div>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignUp={switchToSignUp}
        onSwitchToForgotPassword={switchToForgotPassword}
        onLoginSuccess={() => setLoginOpen(false)}
      />
      <SignUpDialog
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onSwitchToLogin={switchToLogin}
        onSignUpSuccess={() => setSignUpOpen(false)}
      />
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
}
