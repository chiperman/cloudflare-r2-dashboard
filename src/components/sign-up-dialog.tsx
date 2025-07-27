"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignUpForm } from "@/components/sign-up-form";

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
  onSignUpSuccess?: () => void;
}

export function SignUpDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
  onSignUpSuccess,
}: SignUpDialogProps) {
  const handleSignUpSuccess = () => {
    onOpenChange(false);
    onSignUpSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>注册</DialogTitle>
        </DialogHeader>
        <SignUpForm
          onSignUpSuccess={handleSignUpSuccess}
          onSwitchToLogin={onSwitchToLogin}
        />
      </DialogContent>
    </Dialog>
  );
}
