# API (`/api/files`) 性能优化方案

## 1. 问题诊断

通过对 `/api/files/route.ts` 的代码分析，我们发现文件列表加载缓慢的根本原因在于**数据库查询效率低下**，而非原先猜测的 R2 实时列表。

性能瓶颈具体表现为：**获取文件夹列表的方式极其低效**。

当前后端为了获取 `prefix/` 路径下的文件夹，会执行一个 `LIKE 'prefix%/%'` 查询，这个查询会匹配所有深层路径下的文件（例如 `prefix/folder1/file.txt`, `prefix/folder2/sub/another.txt` 等），将它们全部返回给 API 服务器，然后由服务器在内存中进行字符串切割、去重，最后才得到 `folder1` 和 `folder2` 这两个目录。

当子孙文件数量庞大时，这个过程会给数据库和服务器带来巨大压力，导致 API 响应缓慢。

## 2. 优化目标

用最高效的方式重构 API，将文件夹和文件的查询逻辑下推到数据库层面，使 API 响应时间与文件总量脱钩，即使在百万级文件规模下，也能实现毫秒级响应。

## 3. 详细实施步骤

我们将分三步完成优化：创建数据库函数、重构 API 路由、添加数据库索引。

---

### **步骤 1: 创建数据库函数 `get_directories_in_prefix`**

**目的**：将文件夹的计算逻辑从 Node.js 下推到数据库，利用 PostgreSQL 的原生能力高效完成。

**操作**：在 Supabase 项目的 SQL Editor 中执行以下 SQL 代码，创建一个新的数据库函数。

```sql
-- Drop the function if it already exists to ensure a clean slate
DROP FUNCTION IF EXISTS get_directories_in_prefix(TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION get_directories_in_prefix(p_prefix TEXT)
-- This function returns a table with a single column named "directory_name"
RETURNS TABLE(directory_name TEXT) AS $$
BEGIN
    -- This is the core logic of the function
    RETURN QUERY
    SELECT DISTINCT
        -- 1. Get the part of the key *after* the prefix
        --    Example: if key is 'a/b/c.txt' and p_prefix is 'a/', substring is 'b/c.txt'
        -- 2. Split the substring by '/' and get the first part
        --    Example: split_part('b/c.txt', '/', 1) returns 'b'
        split_part(substring(files.key from (length(p_prefix) + 1)), '/', 1)
    FROM
        files
    WHERE
        -- Find all paths that are nested under the given prefix
        files.key LIKE p_prefix || '%/%';

END;
$$ LANGUAGE plpgsql;
```

**验证**：创建成功后，你可以执行 `SELECT * FROM get_directories_in_prefix('your-prefix/');` 来测试它是否能正确返回文件夹列表。

---

### **步骤 2: 重构 API 路由 (`/api/files/route.ts`)**

**目的**：废弃旧的低效查询，改用新的数据库函数，并使用 `Promise.all` 并行执行文件和文件夹的查询。

**操作**：用以下代码替换 `/src/app/api/files/route.ts` 文件中的 `GET` 函数。

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
      },
    }
  );

  const searchParams = request.nextUrl.searchParams;
  const prefix = searchParams.get('prefix') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);

  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  try {
    // --- 优化点: 并行执行文件查询和文件夹查询 ---
    const [filesResult, directoriesResult] = await Promise.all([
      // 1. 高效获取文件列表 (带分页)
      supabase
        .from('files')
        .select('*', { count: 'exact' })
        .like('key', `${prefix}%`)
        .not('key', 'like', `${prefix}%/%`)
        .order('uploaded_at', { ascending: false })
        .range(rangeFrom, rangeTo),
      
      // 2. 调用数据库函数高效获取文件夹列表
      supabase.rpc('get_directories_in_prefix', { p_prefix: prefix })
    ]);

    const { data: filesData, error: filesError, count } = filesResult;
    if (filesError) throw filesError;

    const { data: directoriesData, error: directoriesError } = directoriesResult;
    if (directoriesError) throw directoriesError;
    
    // 从 rpc 调用结果中提取文件夹名称数组
    const directories = directoriesData ? directoriesData.map((d: { directory_name: string }) => d.directory_name) : [];

    // --- 后续逻辑保持不变 (获取用户 Profile 等) ---
    const uniqueUserIds = [...new Set(filesData.map(file => file.user_id).filter(Boolean))];
    let profilesMap = new Map();
    if (uniqueUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        profilesData.forEach(profile => profilesMap.set(profile.id, profile));
      }
    }

    const files = filesData.map((file) => {
      const fileNameOnly = file.name;
      const fileExtension = fileNameOnly.split('.').pop()?.toLowerCase();
      let thumbnailUrl = '/file.svg';
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const videoExtensions = ['mp4', 'webm', 'mov', 'ogg'];

      if (fileExtension && imageExtensions.includes(fileExtension)) {
        thumbnailUrl = `/api/images/thumbnails/${fileNameOnly}`;
      } else if (fileExtension && videoExtensions.includes(fileExtension)) {
        thumbnailUrl = '/video.svg';
      }

      const profile = profilesMap.get(file.user_id);
      const uploader = profile?.display_name || profile?.email || '未知';

      return {
        key: file.name,
        size: file.size,
        uploadedAt: file.uploaded_at,
        url: `/api/images/${file.key}`,
        thumbnailUrl: thumbnailUrl,
        user_id: file.user_id,
        uploader: uploader,
      };
    });

    const totalCount = count || 0;
    const isTruncated = rangeTo < totalCount - 1;

    return NextResponse.json({ files, directories, isTruncated });

  } catch (error) {
    console.error('Error listing files from DB:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```

---

### **步骤 3: (推荐) 添加数据库索引**

**目的**：为 `files` 表中经常用于查询和排序的字段添加索引，大幅提升查询性能。

**操作**：在 Supabase SQL Editor 中执行以下命令。

```sql
-- 为 `key` 字段创建一个 B-tree 索引，以加速 LIKE 查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_key ON files USING btree (key);

-- 如果经常需要按上传时间排序，可以创建一个复合索引
-- 注意: Supabase 默认可能已经在主键或外键上创建了一些索引，请先检查。
-- 这个复合索引可以同时优化 `key` 的筛选和 `uploaded_at` 的排序
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_key_uploaded_at ON files (key, uploaded_at);
```
**注意**：`CONCURRENTLY` 关键字可以避免在创建索引时锁住表，建议在生产环境中使用。

## 4. 预期效果

- **数量级提升**：API 响应时间将从数秒甚至更长，降低到毫秒级别。
- **降低数据库负载**：将计算下推到数据库，并使用高效查询，显著减少数据库的 CPU 和内存消耗。
- **提升应用扩展性**：即时未来文件数量增长到数百万，应用性能也能保持稳定。
- **代码更清晰**：API 路由的职责更单一，代码可读性和可维护性增强。
