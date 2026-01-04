'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SignUpForm } from './sign-up-form';

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
  onSignUpSuccess?: () => void;
  isMobile?: boolean;
}

export function SignUpDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
  onSignUpSuccess,
  isMobile,
}: SignUpDialogProps) {
  const handleSignUpSuccess = () => {
    onOpenChange(false);
    onSignUpSuccess?.();
  };

  const form = (
    <SignUpForm
      onSignUpSuccess={handleSignUpSuccess}
      onSwitchToLogin={onSwitchToLogin}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>注册</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
