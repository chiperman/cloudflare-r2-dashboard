import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { getR2PublicUrl, getThumbnailUrl } from '@/lib/r2-file';
import type { R2File } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { getPlaiceholder } from "plaiceholder";
import { z } from 'zod';

import { createServerClient } from '@supabase/ssr';

const uploadDirectorySchema = z
  .string()
  .regex(/^([A-Za-z0-9._-]+\/)*$/, 'Invalid directory path')
  .or(z.literal(''));

// Helper function to upload a buffer to R2
async function uploadToR2(buffer: Buffer, key: string, contentType: string) {
  const s3Client = getS3Client(); // 使用 getS3Client 获取实例
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directoryResult = uploadDirectorySchema.safeParse(formData.get('directory') ?? '');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!directoryResult.success) {
      return NextResponse.json({ error: '目录参数无效' }, { status: 400 });
    }
    const directory = directoryResult.data;

    // 服务端文件大小校验：30MB，与前端限制保持一致
    const MAX_FILE_SIZE = 30 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小超过 30MB 限制' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const now = new Date(); // Get current time for uploadedAt and filename generation

    const lastDotIndex = file.name.lastIndexOf('.');
    const fileNameWithoutExt =
      lastDotIndex === -1 ? file.name : file.name.substring(0, lastDotIndex);
    const fileExtension = lastDotIndex === -1 ? '' : file.name.substring(lastDotIndex + 1);

    const sanitizedFileName = fileNameWithoutExt.replace(/[^\p{L}\p{N}_.-]/gu, '_'); // Allow Unicode letters/numbers, underscore, dot, hyphen

    const randomId = nanoid(6); // Generate a 6-character random string
    const newFileName = fileExtension
      ? `${sanitizedFileName}-${randomId}.${fileExtension}`
      : `${sanitizedFileName}-${randomId}`;

    const originalKey = `${directory}${newFileName}`;
    let thumbnailUrl = getThumbnailUrl(newFileName);
    let thumbnailKey: string | null = null;
    let blurDataURL: string | undefined;

    // 根据文件类型选择缩略图
    if (contentType.startsWith('image/')) {
      try {
        const { base64 } = await getPlaiceholder(fileBuffer);
        blurDataURL = base64;

        const thumbnailBuffer = await sharp(fileBuffer)
          .resize({ width: 200, height: 200, fit: 'cover' })
          .toBuffer();

        thumbnailKey = `thumbnails/${newFileName}`;
        await uploadToR2(thumbnailBuffer, thumbnailKey, `image/jpeg`); // 缩略图统一为jpeg
        thumbnailUrl = getR2PublicUrl(thumbnailKey);
      } catch (sharpError) {
        console.error('Thumbnail generation failed:', sharpError);
      }
    }

    // 上传原始文件
    await uploadToR2(fileBuffer, originalKey, contentType);

    // 将元数据写入 Supabase 数据库
    const { error: dbError } = await supabase.from('files').insert({
      key: originalKey,
      name: newFileName,
      uploaded_at: now.toISOString(),
      size: file.size,
      content_type: contentType,
      user_id: user.id,
      blur_data_url: blurDataURL,
    });

    if (dbError) {
      console.error('Failed to save file metadata to DB:', dbError);
      // 如果数据库插入失败，可以考虑删除已上传到 R2 的文件以保持同步
      // (此部分逻辑暂未实现)
      return NextResponse.json(
        { error: 'Failed to save file metadata.', db_error: dbError.message },
        { status: 500 }
      );
    }

    const newFile: R2File = {
      key: originalKey,
      name: newFileName,
      size: file.size,
      uploadedAt: now.toISOString(),
      url: getR2PublicUrl(originalKey),
      thumbnailUrl: thumbnailUrl,
      blurDataURL: blurDataURL,
      uploader: user.email ?? '未知',
      user_id: user.id,
    };

    return NextResponse.json(newFile);
  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
