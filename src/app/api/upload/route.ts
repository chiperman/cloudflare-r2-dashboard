
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

    // Generate thumbnail
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize({ width: 200, height: 200, fit: 'cover' })
      .toBuffer();

    // Define keys for R2
    const originalKey = `originals/${newFileName}`;
    const thumbnailKey = `thumbnails/${newFileName}`;

    // Upload both original and thumbnail
    await Promise.all([
      uploadToR2(fileBuffer, originalKey, contentType),
      uploadToR2(thumbnailBuffer, thumbnailKey, `image/${fileExtension}`),
    ]);

    return NextResponse.json({
      success: true,
      message: 'File and thumbnail uploaded successfully',
    });
  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
