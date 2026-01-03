'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from '@/components/login-form';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess?: () => void;
  isMobile?: boolean;
}

export function LoginDialog({
  open,
  onOpenChange,
  onSwitchToSignUp,
  onSwitchToForgotPassword,
  onLoginSuccess,
  isMobile,
}: LoginDialogProps) {
  const handleLoginSuccess = () => {
    onOpenChange(false);
    onLoginSuccess?.();
  };

  const form = (
    <LoginForm
      onLoginSuccess={handleLoginSuccess}
      onSwitchToSignUp={onSwitchToSignUp}
      onSwitchToForgotPassword={onSwitchToForgotPassword}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>登录</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
