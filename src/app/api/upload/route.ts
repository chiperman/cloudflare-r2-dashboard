
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

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
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directory = (formData.get('directory') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;

    // Create a new filename based on YYYYMMDD-HHMMSS-xxxxxx.ext
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const randomId = nanoid(6); // Generate a 6-character random string

    const fileExtension = file.name.split('.').pop();
    const newFileName = `${year}${month}${day}-${hours}${minutes}${seconds}-${randomId}.${fileExtension}`;

    const originalKey = `${directory}${newFileName}`;
    let thumbnailUrl: string;
    let thumbnailKey: string | null = null;

    // 根据文件类型选择缩略图
    if (contentType.startsWith('image/')) {
      try {
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize({ width: 200, height: 200, fit: 'cover' })
          .toBuffer();
        
        thumbnailKey = `thumbnails/${newFileName}`;
        await uploadToR2(thumbnailBuffer, thumbnailKey, `image/jpeg`); // 缩略图统一为jpeg
        thumbnailUrl = `/api/images/${thumbnailKey}`;
      } catch (sharpError) {
        console.error('Thumbnail generation failed:', sharpError);
        // 如果缩略图生成失败，使用通用图片图标
        thumbnailUrl = '/file.svg'; // Fallback to a generic file icon
      }
    } else if (contentType.startsWith('video/')) {
      // 对于视频文件，使用视频图标
      thumbnailUrl = '/video.svg';
    } else {
      // 对于其他所有文件，使用通用文件图标
      thumbnailUrl = '/file.svg';
    }

    // 上传原始文件
    await uploadToR2(fileBuffer, originalKey, contentType);

    const newFile: R2File = {
      key: newFileName,
      size: file.size,
      uploadedAt: now.toISOString(),
      url: `/api/images/${originalKey}`,
      thumbnailUrl: thumbnailUrl,
    };

    return NextResponse.json(newFile);
  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

interface R2File {
  key: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
}
