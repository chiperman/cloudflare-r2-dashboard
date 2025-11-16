import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SignUpFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onSignUpSuccess?: () => void;
  onSwitchToLogin: () => void;
}

export function SignUpForm({
  className,
  onSignUpSuccess,
  onSwitchToLogin,
  ...props
}: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      onSignUpSuccess?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '发生了一个错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(className)} {...props}>
      <form onSubmit={handleSignUp}>
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
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">密码</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="repeat-password">重复密码</Label>
            </div>
            <div className="relative">
              <Input
                id="repeat-password"
                type={showRepeatPassword ? 'text' : 'password'}
                placeholder="请再次输入密码"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              >
                {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '创建账户中...' : '注册'}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          已经有账户了？{' '}
          <button type="button" onClick={onSwitchToLogin} className="underline underline-offset-4">
            登录
          </button>
        </div>
      </form>
    </div>
  );
}
