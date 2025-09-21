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

-- 5. 性能优化：数据库函数与索引 (2025-09-21 添加)
--
-- 以下部分包含了用于优化文件和文件夹列表查询的数据库对象。
--

-- 5.1 创建数据库函数 `get_directories_in_prefix`
-- 目的：将文件夹的计算逻辑从 Node.js 下推到数据库，利用 PostgreSQL 的原生能力高效完成。

-- 如果函数已存在，则删除以确保全新创建
DROP FUNCTION IF EXISTS get_directories_in_prefix(TEXT);

-- 创建函数
CREATE OR REPLACE FUNCTION get_directories_in_prefix(p_prefix TEXT)
-- 此函数返回一个名为 "directory_name" 的单列表
RETURNS TABLE(directory_name TEXT) AS $
BEGIN
    -- 这是函数的核心逻辑
    RETURN QUERY
    SELECT DISTINCT
        -- 1. 获取前缀之后的部分
        --    示例: 如果 key 是 'a/b/c.txt' 且 p_prefix 是 'a/'，则子字符串是 'b/c.txt'
        -- 2. 按 '/' 分割子字符串并获取第一部分
        --    示例: split_part('b/c.txt', '/', 1) 返回 'b'
        split_part(substring(files.key from (length(p_prefix) + 1)), '/', 1)
    FROM
        files
    WHERE
        -- 查找所有嵌套在给定前缀下的路径
        files.key LIKE p_prefix || '%/%';

END;
$ LANGUAGE plpgsql;


-- 5.2 (推荐) 添加额外的数据库索引
-- 目的：为 `files` 表中经常用于查询和排序的字段添加索引，大幅提升查询性能。

-- 为 `key` 字段创建一个 B-tree 索引，以加速 LIKE 查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_key ON files USING btree (key);

-- 如果经常需要按上传时间排序，可以创建一个复合索引
-- 注意: Supabase 默认可能已经在主键或外键上创建了一些索引，请先检查。
-- 这个复合索引可以同时优化 `key` 的筛选和 `uploaded_at` 的排序
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_key_uploaded_at ON files (key, uploaded_at);