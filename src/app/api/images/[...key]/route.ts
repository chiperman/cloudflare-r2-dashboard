import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // 解析 key 参数
  // 路径如 /api/images/a/b/c，key = ['a','b','c']
  const pathParts = req.nextUrl.pathname.split('/');
  const apiIndex = pathParts.findIndex((p) => p === 'api');
  const keyParts = pathParts.slice(apiIndex + 2); // ['a','b','c']
  const key = decodeURIComponent(keyParts.join('/'));

  try {
    const s3Client = getS3Client(); // 使用 getS3Client 获取实例
    const range = req.headers.get('range');

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ...(range && { Range: range }),
    });

    const { Body, ContentType, ContentLength, ContentRange, ETag } =
      await s3Client.send(command);

    if (!Body) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Assert Body as a ReadableStream
    const stream = Body as unknown as ReadableStream;

    if (range) {
      // Handle range request
      const headers = {
        'Content-Type': ContentType || 'application/octet-stream',
        'Content-Range': ContentRange || '',
        'Content-Length': (ContentLength || 0).toString(),
        'Accept-Ranges': 'bytes',
        ETag: ETag || '',
      };
      return new NextResponse(stream, { status: 206, headers });
    } else {
      // Handle full request
      const headers = {
        'Content-Type': ContentType || 'application/octet-stream',
        'Content-Length': (ContentLength || 0).toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: ETag || '',
      };
      return new NextResponse(stream, { status: 200, headers });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return new NextResponse('File not found', { status: 404 });
    }
    console.error(`Error fetching file ${key} from R2:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(errorMessage, { status: 500 });
  }
}