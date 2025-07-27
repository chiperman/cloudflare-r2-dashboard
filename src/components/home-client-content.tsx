'use client';

import { useState } from 'react';
import { UploadForm } from '@/components/r2/upload-form';
import { FileList } from '@/components/r2/file-list';

interface HomeClientContentProps {
  initialRefreshKey?: number;
}

export function HomeClientContent({ initialRefreshKey = 0 }: HomeClientContentProps) {
  const [refreshKey, setRefreshKey] = useState(initialRefreshKey);

  const handleActionComplete = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="w-full">
      <UploadForm onUploadSuccess={handleActionComplete} />
      <div className="mt-8">
        <FileList key={refreshKey} refreshTrigger={refreshKey} onActionComplete={handleActionComplete} />
      </div>
    </div>
  );
}
