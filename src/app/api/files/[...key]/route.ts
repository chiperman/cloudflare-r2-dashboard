import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  const fileKey = params.key.join('/');

  try {
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

    // 同时发送两个删除请求
    await Promise.all([
      s3Client.send(deleteOriginalCommand),
      s3Client.send(deleteThumbnailCommand),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting file ${fileKey}:`, error);
    return NextResponse.json({ error: `Failed to delete file: ${fileKey}` }, { status: 500 });
  }
}
