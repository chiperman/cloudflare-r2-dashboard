'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, CheckCircle } from 'lucide-react';

interface R2File {
  key: string;
  size: number;
  uploadedAt: string;
  url: string;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function FileList({
  refreshTrigger,
  onActionComplete,
}: {
  refreshTrigger: number;
  onActionComplete: () => void;
}) {
  const [files, setFiles] = useState<R2File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/files');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch files.');
        }
        const data = await response.json();
        setFiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [refreshTrigger]);

  const handleCopy = (fileKey: string) => {
    const fileUrl = `${window.location.origin}/api/images/${fileKey}`;
    navigator.clipboard.writeText(fileUrl).then(() => {
      setCopiedKey(fileKey);
      setTimeout(() => setCopiedKey(null), 2000); // Reset after 2 seconds
    });
  };

  const handleDelete = async (fileKey: string) => {
    if (!confirm(`Are you sure you want to delete ${fileKey}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileKey}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file.');
      }

      // Notify parent to refresh the list
      onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (isLoading) return <div className="text-center p-8">Loading files...</div>;
  if (error) return <div className="text-center p-8 text-destructive">Error: {error}</div>;
  if (files.length === 0)
    return <div className="text-center p-8 text-muted-foreground">No files found.</div>;

  return (
    <div className="w-full border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">预览</TableHead>
            <TableHead className="text-center">文件名</TableHead>
            <TableHead className="text-center">上传时间</TableHead>
            <TableHead className="text-center">文件大小</TableHead>
            <TableHead className="text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.key}>
              <TableCell className="flex justify-center">
                <Image
                  src={file.url}
                  alt={file.key}
                  width={50}
                  height={50}
                  className="rounded-md object-cover h-[50px] w-[50px]"
                />
              </TableCell>
              <TableCell className="font-medium text-center">{file.key}</TableCell>
              <TableCell className="text-center">
                {new Date(file.uploadedAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-center">{formatBytes(file.size)}</TableCell>
              <TableCell>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(file.key)}>
                    {copiedKey === file.key ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(file.key)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
