
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextResponse } from 'next/server';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const continuationToken = searchParams.get('continuationToken') || undefined;

  try {
    const s3Client = getS3Client();
    const listOriginalsCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'originals/',
      ContinuationToken: continuationToken,
      MaxKeys: parseInt(searchParams.get('limit') || '10', 10),
    });

    const { Contents, NextContinuationToken, IsTruncated } = await s3Client.send(
      listOriginalsCommand
    );

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

    files.sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      files,
      nextContinuationToken: NextContinuationToken,
      isTruncated: IsTruncated,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { keys } = await request.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: '无效的请求，缺少文件 key' }, { status: 400 });
    }

    const s3Client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;

    // For each key, add both the original and the thumbnail to the delete list
    const objectsToDelete = keys.flatMap((key) => [
      { Key: `originals/${key}` },
      { Key: `thumbnails/${key}` },
    ]);

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false, // 设置为 false 以便在响应中获取有关已删除对象的信息
      },
    });

    const { Deleted, Errors } = await s3Client.send(deleteCommand);

    if (Errors && Errors.length > 0) {
      // 如果有部分文件删除失败，记录错误并返回详细信息
      console.error('部分文件删除失败:', Errors);
      return NextResponse.json(
        {
          error: '部分文件删除失败',
          details: Errors.map((e) => ({ key: e.Key, message: e.Message })),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '文件批量删除成功', deletedCount: Deleted?.length || 0 });
  } catch (error) {
    console.error('批量删除文件时出错:', error);
    const errorMessage = error instanceof Error ? error.message : '批量删除文件失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

