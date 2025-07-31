
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextResponse } from 'next/server';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const continuationToken = searchParams.get('continuationToken') || undefined;
  const prefix = searchParams.get('prefix') || '';

  try {
    const s3Client = getS3Client();
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken,
      MaxKeys: parseInt(searchParams.get('limit') || '10', 10),
    });

    const { Contents, CommonPrefixes, NextContinuationToken, IsTruncated } = await s3Client.send(
      listCommand
    );

    const files =
      Contents?.filter(file => file.Key !== prefix && !file.Key?.endsWith('/')).map((file) => {
        const key = file.Key || '';
        const fileName = key.substring(prefix.length);
        return {
          key: fileName,
          size: file.Size,
          uploadedAt: file.LastModified,
          url: `/api/images/${key}`,
          thumbnailUrl: `/api/images/thumbnails/${fileName}`,
        };
      }) || [];

    const directories = CommonPrefixes?.map((commonPrefix) => {
      const directoryName = commonPrefix.Prefix || '';
      return directoryName.substring(prefix.length).replace(/\/$/, '');
    }).filter(dir => dir !== 'thumbnails') || [];

    files.sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      files,
      directories,
      nextContinuationToken: NextContinuationToken,
      isTruncated: IsTruncated,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { keys } = await request.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'An array of file keys is required' }, { status: 400 });
    }

    const s3Client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;

    const objectsToDelete = keys.flatMap((key) => {
      const fileName = key.split('/').pop() || '';
      const thumbnailKey = `thumbnails/${fileName}`;
      return [{ Key: key }, { Key: thumbnailKey }];
    });

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });

    const { Deleted, Errors } = await s3Client.send(deleteCommand);

    if (Errors && Errors.length > 0) {
      console.error('Failed to delete some files:', Errors);
      return NextResponse.json(
        {
          error: 'Some files failed to delete',
          details: Errors.map((e) => ({ key: e.Key, message: e.Message })),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Files deleted successfully', deletedCount: Deleted?.length || 0 });
  } catch (error) {
    console.error('Error deleting files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

