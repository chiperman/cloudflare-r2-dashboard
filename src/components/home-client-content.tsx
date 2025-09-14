'use client';

import { useState } from 'react';
import { UploadForm } from '@/components/r2/upload-form';
import { FileList } from '@/components/r2/file-list';
import { R2Metrics } from '@/components/r2/r2-metrics';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface R2File {
  key: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
}

export function HomeClientContent() {
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<R2File[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');

  const handleUploadSuccess = (newFiles: R2File[]) => {
    setNewlyUploadedFiles(newFiles);
  };

  return (
    <div className="w-full space-y-8">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <h2 className="text-2xl font-bold tracking-tight">用量概览</h2>
          </AccordionTrigger>
          <AccordionContent>
            <R2Metrics />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <UploadForm onUploadSuccess={handleUploadSuccess} currentPrefix={currentPrefix} />
      <div className="mt-8">
        <FileList newlyUploadedFiles={newlyUploadedFiles} currentPrefix={currentPrefix} setCurrentPrefix={setCurrentPrefix} />
      </div>
    </div>
  );
}
