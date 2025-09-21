
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

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
  const search = searchParams.get('search') || '';

  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  try {
    // Base query for files
    let filesQuery = supabase
      .from('files')
      .select('*', { count: 'exact' })
      .like('key', `${prefix}%`)
      .not('key', 'like', `${prefix}%/%`);

    // Add search condition if a search term is provided
    if (search) {
      filesQuery = filesQuery.like('name', `%${search}%`);
    }

    // Add order and range
    filesQuery = filesQuery.order('uploaded_at', { ascending: false }).range(rangeFrom, rangeTo);

    // --- 优化点: 并行执行文件查询和文件夹查询 ---
    const [filesResult, directoriesResult] = await Promise.all([
      filesQuery, // 1. Execute the constructed file query
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
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ files, directories, isTruncated, totalCount, totalPages, currentPage: page });

  } catch (error) {
    console.error('Error listing files from DB:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { files } = await request.json();
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'An array of file objects is required' }, { status: 400 });
    }

    const keysToDelete = files.map(file => file.key);

    // 1. 从数据库中删除记录，并返回被删除的记录
    const { data: deletedRecords, error: dbError } = await supabase
      .from('files')
      .delete()
      .in('key', keysToDelete)
      .eq('user_id', user.id)
      .select(); // <--- 关键：返回被删除的行

    if (dbError) {
      console.error('Failed to delete file metadata from DB:', dbError);
      return NextResponse.json(
        { error: '数据库删除失败。' },
        { status: 500 }
      );
    }

    // 2. 检查是否有记录被实际删除
    if (!deletedRecords || deletedRecords.length === 0) {
      return NextResponse.json(
        { error: '权限不足或文件不存在，未删除任何文件。' },
        { status: 403 } // 403 Forbidden
      );
    }

    // 3. 从 R2 中删除对象 (包括缩略图)
    const s3Client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;

    const objectsToDelete = files.flatMap((file) => {
      // 只删除那些在数据库中确认被删除的文件的对象
      if (deletedRecords.some(record => record.key === file.key)) {
        const objects = [{ Key: file.key }];
        if (file.thumbnailUrl && file.thumbnailUrl.includes('/thumbnails/')) {
          const thumbnailKey = `thumbnails/${file.key.split('/').pop()}`;
          objects.push({ Key: thumbnailKey });
        }
        return objects;
      }
      return [];
    });

    if (objectsToDelete.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
            Objects: objectsToDelete,
            Quiet: false,
        },
        });

        const { Deleted, Errors } = await s3Client.send(deleteCommand);

        if (Errors && Errors.length > 0) {
        const realErrors = Errors.filter(e => e.Code !== 'NoSuchKey');
        if (realErrors.length > 0) {
            console.error('Failed to delete some files from R2:', realErrors);
            return NextResponse.json(
            {
                error: '数据库记录已删除，但部分文件在 R2 删除失败。请联系管理员处理。'
            },
            { status: 500 }
            );
        }
        }
    }

    return NextResponse.json({ message: '文件删除成功', deletedCount: deletedRecords.length });

  } catch (error) {
    console.error('Error deleting files:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
