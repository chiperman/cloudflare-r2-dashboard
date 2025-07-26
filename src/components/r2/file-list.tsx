
'use client';

import { useEffect, useState } from 'react';

interface R2File {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

export function FileList({ refreshTrigger }: { refreshTrigger: number }) {
  const [files, setFiles] = useState<R2File[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error('Failed to fetch files.');
        }
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [refreshTrigger]);

  if (isLoading) return <p>Loading files...</p>;

  return (
    <div>
      <h2>File List</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {files.map((file) => (
          <div key={file.key} style={{ border: '1px solid #ccc', padding: '1rem' }}>
            <img src={file.url} alt={file.key} style={{ maxWidth: '100%', height: 'auto' }} />
            <p>{file.key}</p>
            <p>{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        ))}
      </div>
    </div>
  );
}
