
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const s3Client = getS3Client(); // 使用 getS3Client 获取实例
    const listOriginalsCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'originals/',
    });

    const { Contents } = await s3Client.send(listOriginalsCommand);

    const files =
      Contents?.map((file) => {
        const key = file.Key || '';
        const fileName = key.replace('originals/', '');
        return {
          key: fileName,
          size: file.Size,
          uploadedAt: file.LastModified,
          url: `/api/images/originals/${fileName}`,
          thumbnailUrl: `/api/images/thumbnails/${fileName}`,
        };
      }) || [];

    // Sort files by upload date in descending order，处理 uploadedAt 可能为 undefined 的情况
    files.sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

