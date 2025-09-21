'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UploadForm } from '@/components/r2/upload-form';
import { FileList } from '@/components/r2/file-list';
import { R2Metrics } from '@/components/r2/r2-metrics';
import { R2File } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"



export function HomeClientContent() {
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<R2File[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [accordionDefaultValue, setAccordionDefaultValue] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const checkScreenSize = () => {
      // 768px is the default for `md` in Tailwind
      if (window.innerWidth >= 768) {
        setAccordionDefaultValue('r2-metrics');
      } else {
        setAccordionDefaultValue('');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [supabase.auth]);

  const handleUploadSuccess = (newFiles: R2File[]) => {
    setNewlyUploadedFiles(newFiles);
  };

  return (
    <div className="w-full space-y-8">
      <Accordion type="single" collapsible className="w-full" value={accordionDefaultValue} onValueChange={setAccordionDefaultValue}>
        <AccordionItem value="r2-metrics">
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
        <FileList user={user} newlyUploadedFiles={newlyUploadedFiles} currentPrefix={currentPrefix} setCurrentPrefix={setCurrentPrefix} />
      </div>
    </div>
  );
}
