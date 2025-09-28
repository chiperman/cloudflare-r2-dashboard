import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let folderKey: string | null = null;

  try {
    const { folderName, currentPrefix } = await request.json();

    const safeNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!folderName || !safeNameRegex.test(folderName)) {
      return NextResponse.json(
        { error: '无效的文件夹名称。名称只能包含字母、数字、连字符和下划线。' },
        { status: 400 }
      );
    }

    folderKey = `${currentPrefix}${folderName}/`;

    // Step 1: Insert record into the database first.
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('files')
      .insert({
        key: folderKey,
        name: folderName,
        user_id: user.id,
        size: 0,
        content_type: 'application/x-directory',
      })
      .select('id') // Select the ID for potential rollback
      .single();

    if (dbError) {
      throw new Error(`数据库错误: ${dbError.message}`);
    }

    // Step 2: Create the placeholder object in R2.
    try {
      const s3Client = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: folderKey,
        Body: '',
        ContentLength: 0,
      });
      await s3Client.send(putCommand);
    } catch (r2Error) {
      // If R2 object creation fails, roll back the database insert.
      console.error('R2 object creation failed, rolling back database record:', r2Error);
      if (dbData) {
        await supabaseAdmin.from('files').delete().eq('id', dbData.id);
      }
      throw r2Error; // Re-throw the R2 error to be caught by the outer catch block
    }

    return NextResponse.json({ message: `文件夹 '${folderName}' 创建成功。` });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    const errorMessage = error instanceof Error ? error.message : '创建文件夹时发生未知错误。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabaseUserClient = await createClient();
  const {
    data: { user },
  } = await supabaseUserClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // Role-Based Access Control Check
  const { data: profile } = await supabaseUserClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '禁止操作：需要管理员权限。' }, { status: 403 });
  }

  // Admin-only logic continues...
  try {
    const { prefix } = await request.json();

    if (!prefix || typeof prefix !== 'string') {
      return NextResponse.json({ error: '无效的文件夹路径。' }, { status: 400 });
    }

    const s3Client = getS3Client();
    const supabase = createSupabaseAdminClient();
    const bucketName = process.env.R2_BUCKET_NAME;
    let continuationToken: string | undefined = undefined;

    while (true) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const listResponse = await s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        break;
      }

      // All keys in the current batch from R2
      const keysInBatch = listResponse.Contents.map((obj) => obj.Key!);

      const promises = [];

      // R2 Deletion Promise (delete all objects in the batch)
      if (keysInBatch.length > 0) {
        promises.push(
          s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: { Objects: keysInBatch.map((k) => ({ Key: k })) },
            })
          )
        );
      }

      // Supabase Deletion Promise (delete all corresponding records in the batch)
      if (keysInBatch.length > 0) {
        promises.push(supabase.from('files').delete().in('key', keysInBatch));
      }

      if (promises.length > 0) {
        const results = await Promise.allSettled(promises);
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('A delete operation failed:', result.reason);
          }
        });
      }

      if (!listResponse.IsTruncated) {
        break;
      }
      continuationToken = listResponse.NextContinuationToken;
    }

    return NextResponse.json({ message: `文件夹 '${prefix}' 已成功删除。` });
  } catch (error) {
    console.error('删除文件夹失败:', error);
    const errorMessage = error instanceof Error ? error.message : '删除文件夹时发生未知错误。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
