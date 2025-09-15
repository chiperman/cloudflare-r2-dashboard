-- Cloudflare R2 管理的 Supabase 数据库 Schema
--
-- 此脚本设置了应用程序正常运行所需的表、索引和行级安全 (RLS) 策略。
--
-- 执行步骤：
-- 1. 登录到您的 Supabase 项目仪表盘。
-- 2. 导航到 "SQL 编辑器"。
-- 3. 点击 "+ 新建查询"。
-- 4. 粘贴此文件的全部内容，然后点击 "运行"。

-- 1. 创建文件表
CREATE TABLE public.files (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key TEXT NOT NULL UNIQUE, -- R2 中的完整路径和文件名
  name TEXT NOT NULL, -- 用于显示的文件名
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size BIGINT,
  content_type TEXT,
  -- 关联 auth.users。如果用户被删除，此字段设置为 NULL
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. 为提高性能创建索引
-- 按上传时间排序的索引
CREATE INDEX idx_files_uploaded_at ON public.files (uploaded_at DESC);
-- 用于文件夹/前缀查询的索引 (优化 LIKE 'prefix%')
CREATE INDEX idx_files_key_pattern ON public.files (key text_pattern_ops);
-- 按用户查询的索引
CREATE INDEX idx_files_user_id ON public.files (user_id);

-- 3. 在新表上启用行级安全 (RLS)
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略
-- 策略 1: 允许所有已认证用户读取所有文件记录
CREATE POLICY "Allow authenticated read access"
ON public.files
FOR SELECT
TO authenticated
USING (true);

-- 策略 2: 允许用户插入记录，但只能使用自己的 user_id
CREATE POLICY "Allow individual insert"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 策略 3: 允许用户更新自己的文件记录
CREATE POLICY "Allow individual update"
ON public.files
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 策略 4: 允许用户删除自己的文件记录
CREATE POLICY "Allow individual delete"
ON public.files
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
