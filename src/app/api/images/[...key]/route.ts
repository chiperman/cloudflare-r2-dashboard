
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const { Body, ContentType } = await s3Client.send(command);

    if (!Body) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Assert Body is a ReadableStream
    const stream = Body as unknown as ReadableStream;

    return new NextResponse(stream, {
      headers: {
        'Content-Type': ContentType || 'application/octet-stream',
      },
    });

  } catch (error) {
    console.error(`Error getting file "${key}":`, error);
    // Handle cases where the object does not exist
    if (error instanceof Error && error.name === 'NoSuchKey') {
        return new NextResponse('Not Found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
