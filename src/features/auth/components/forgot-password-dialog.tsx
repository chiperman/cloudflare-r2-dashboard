'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ForgotPasswordForm } from './forgot-password-form';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
  isMobile?: boolean;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
  isMobile,
}: ForgotPasswordDialogProps) {
  const form = <ForgotPasswordForm onSwitchToLogin={onSwitchToLogin} />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>忘记密码</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
