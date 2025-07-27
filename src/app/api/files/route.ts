
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/r2';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const listOriginalsCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'originals/',
    });

    const { Contents } = await s3Client.send(listOriginalsCommand);

    const files = Contents?.map(file => {
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

    // Sort files by upload date in descending order
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
