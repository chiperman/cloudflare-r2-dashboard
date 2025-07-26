'use client';

import { useState } from 'react';
import { UploadForm } from '@/components/r2/upload-form';
import { FileList } from '@/components/r2/file-list';

export default function ProtectedPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Increment the trigger to force a refresh in the FileList component
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        <div className="py-6 font-bold text-center">
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>

      <div className="animate-in flex-1 flex flex-col gap-20 opacity-0 max-w-4xl px-3">
        <main className="flex-1 flex flex-col gap-6">
          <h2 className="font-bold text-4xl mb-4">R2 File Management</h2>

          <div className="mb-8">
            <h3 className="font-semibold text-2xl mb-2">Upload New File</h3>
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>

          <div>
            <h3 className="font-semibold text-2xl mb-2">Stored Files</h3>
            <FileList refreshTrigger={refreshTrigger} />
          </div>
        </main>
      </div>
    </div>
  );
}
