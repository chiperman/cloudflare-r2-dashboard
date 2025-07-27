"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useState } from "react";

interface ForgotPasswordDialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export function ForgotPasswordDialog({
  children,
  open,
  onOpenChange,
  onSwitchToLogin,
}: ForgotPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>忘记密码</DialogTitle>
        </DialogHeader>
        <ForgotPasswordForm onSwitchToLogin={onSwitchToLogin} />
      </DialogContent>
    </Dialog>
  );
}
