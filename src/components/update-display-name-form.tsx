'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

// Props：initialDisplayName（用户当前的显示名称，可能为 null）
export default function UpdateDisplayNameForm({
  initialDisplayName,
}: {
  initialDisplayName: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName || ''); // 当前输入值
  const [loading, setLoading] = useState(false); // 是否加载中
  const [message, setMessage] = useState(''); // 成功或错误提示
  const supabase = createClient(); // 创建 Supabase 客户端

  // 表单提交事件
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // 调用 Supabase API 更新用户元数据
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName }, // 更新 display_name
    });

    if (error) {
      setMessage(`更新失败: ${error.message}`);
    } else {
      setMessage('显示名称更新成功！');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">修改昵称</CardTitle>
        <CardDescription>请输入新昵称</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Input
              id="displayName"
              type="text"
              placeholder="新显示名称"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          {message && <p className="text-sm text-green-500">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '更新中...' : '更新显示名称'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
