'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface ForgotPasswordFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordForm({
  className,
  onSwitchToLogin,
  ...props
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(className)} {...props}>
      {success ? (
        <div>
          <p className="text-sm text-muted-foreground">
            如果您使用邮箱和密码注册，您将会收到一封密码重置邮件。
          </p>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '发送中...' : '发送重置邮件'}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            已经有账户了?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="underline underline-offset-4"
            >
              登录
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
