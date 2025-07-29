
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  // 解析 key 参数
  // 路径如 /api/files/a/b/c，key = ['a','b','c']
  const pathParts = request.nextUrl.pathname.split('/');
  // 找到 [...key] 的起始索引
  const apiIndex = pathParts.findIndex((p) => p === 'api');
  const keyParts = pathParts.slice(apiIndex + 2); // ['a','b','c']
  const fileKey = keyParts.join('/');

  try {
    const s3Client = getS3Client(); // 使用 getS3Client 获取实例
    const originalKey = `originals/${fileKey}`;
    const thumbnailKey = `thumbnails/${fileKey}`;

    const deleteOriginalCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: originalKey,
    });

    const deleteThumbnailCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: thumbnailKey,
    });

    await Promise.all([
      s3Client.send(deleteOriginalCommand),
      s3Client.send(deleteThumbnailCommand),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting file ${fileKey}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : `Failed to delete file: ${fileKey}`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

