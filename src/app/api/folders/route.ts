
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { folderName, currentPrefix } = await request.json();

    const safeNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!folderName || !safeNameRegex.test(folderName)) {
      return NextResponse.json({ error: '无效的文件夹名称。名称只能包含字母、数字、连字符和下划线。' }, { status: 400 });
    }

    const s3Client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;

    // The key for the folder is the prefix ending with a slash
    const folderKey = `${currentPrefix}${folderName}/`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: folderKey,
      Body: '',
      ContentLength: 0,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: `文件夹 '${folderName}' 创建成功。` });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    const errorMessage = error instanceof Error ? error.message : '创建文件夹时发生未知错误。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { prefix } = await request.json();

    if (!prefix || typeof prefix !== 'string') {
      return NextResponse.json({ error: '无效的文件夹路径。' }, { status: 400 });
    }

    const s3Client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    let continuationToken: string | undefined = undefined;
    let deletedCount = 0;

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    while (true) {
      listCommand.input.ContinuationToken = continuationToken;
      const listResponse = await s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        break; // No more objects to delete
      }

      const objectsToDelete = listResponse.Contents.flatMap(obj => {
        if (!obj.Key) return [];
        // For files, add both the original and its thumbnail to the delete list.
        if (!obj.Key.endsWith('/')) {
          const fileName = obj.Key.split('/').pop() || '';
          if (fileName) {
            return [
              { Key: obj.Key },
              { Key: `thumbnails/${fileName}` }
            ];
          }
        }
        // For folder placeholders, just add the placeholder itself.
        return [{ Key: obj.Key }];
      });

      if (objectsToDelete.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objectsToDelete },
        });

        const deleteResponse = await s3Client.send(deleteCommand);
        deletedCount += deleteResponse.Deleted?.length || 0;

        if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
          console.error('删除部分文件时出错:', deleteResponse.Errors);
          throw new Error('删除文件夹内容时发生错误。');
        }
      }

      if (!listResponse.IsTruncated) {
        break;
      }
      continuationToken = listResponse.NextContinuationToken;
    }

    return NextResponse.json({ message: `文件夹 '${prefix}' 已成功删除，共删除 ${deletedCount} 个对象。` });

  } catch (error) {
    console.error('删除文件夹失败:', error);
    const errorMessage = error instanceof Error ? error.message : '删除文件夹时发生未知错误。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
