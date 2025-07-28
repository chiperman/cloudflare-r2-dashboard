import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // 解析 key 参数
  // 路径如 /api/images/a/b/c，key = ['a','b','c']
  const pathParts = req.nextUrl.pathname.split('/');
  const apiIndex = pathParts.findIndex((p) => p === 'api');
  const keyParts = pathParts.slice(apiIndex + 2); // ['a','b','c']
  const key = keyParts.join('/');

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const { Body, ContentType } = await s3Client.send(command);

    if (!Body) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Assert Body as a ReadableStream
    const stream = Body as unknown as ReadableStream;

    return new NextResponse(stream, {
      headers: {
        'Content-Type': ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return new NextResponse('Image not found', { status: 404 });
    }
    console.error(`Error fetching image ${key} from R2:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
