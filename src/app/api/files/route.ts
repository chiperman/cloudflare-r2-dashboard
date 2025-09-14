
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
        const fullKey = file.Key || '';
        const fileNameOnly = fullKey.split('/').pop() || '';
        const relativeKey = fullKey.substring(prefix.length);

        const fileExtension = fileNameOnly.split('.').pop()?.toLowerCase();

        let thumbnailUrl = '/file.svg'; // Default icon
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExtensions = ['mp4', 'webm', 'mov', 'ogg'];

        if (fileExtension && imageExtensions.includes(fileExtension)) {
          thumbnailUrl = `/api/images/thumbnails/${fileNameOnly}`;
        } else if (fileExtension && videoExtensions.includes(fileExtension)) {
          thumbnailUrl = '/video.svg';
        }

        return {
          key: relativeKey, // For display in the list
          size: file.Size,
          uploadedAt: file.LastModified,
          url: `/api/images/${fullKey}`, // For full image preview and copy link
          thumbnailUrl: thumbnailUrl, // For thumbnail preview
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
    const { files } = await request.json();
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'An array of file objects is required' }, { status: 400 });
    }

    const s3Client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;

    const objectsToDelete = files.flatMap((file) => {
      const objects = [{ Key: file.key }];
      if (file.thumbnailUrl && file.thumbnailUrl.includes('/api/images/thumbnails/')) {
        const thumbnailKey = `thumbnails/${file.key.split('/').pop()}`;
        objects.push({ Key: thumbnailKey });
      }
      return objects;
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
      // Filter out errors for keys that were not found, as this is expected for non-image files
      const realErrors = Errors.filter(e => e.Code !== 'NoSuchKey');
      if (realErrors.length > 0) {
        console.error('Failed to delete some files:', realErrors);
        return NextResponse.json(
          {
            error: 'Some files failed to delete',
            details: realErrors.map((e) => ({ key: e.Key, message: e.Message })),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: 'Files deleted successfully', deletedCount: Deleted?.length || 0 });
  } catch (error) {
    console.error('Error deleting files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete files';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

