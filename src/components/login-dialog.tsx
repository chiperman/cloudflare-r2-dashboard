"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { useState } from "react";

interface LoginDialogProps {
  children: React.ReactNode;
  onLoginSuccess?: () => void;
}

export function LoginDialog({ children, onLoginSuccess }: LoginDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsOpen(false);
    onLoginSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>登录</DialogTitle>
        </DialogHeader>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </DialogContent>
    </Dialog>
  );
}
