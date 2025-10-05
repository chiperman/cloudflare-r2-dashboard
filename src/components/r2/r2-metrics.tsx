
"use client";

import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DonutChart } from "@/components/ui/donut-chart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from 'react';

interface Metrics {
  storage: {
    used: number;
    total: number;
  };
  classA: {
    count: number;
    total: number;
  };
  classB: {
    count: number;
    total: number;
  };
}

const fetcher = async (url: string): Promise<Metrics> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch metrics");
  }
  return response.json();
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-4 p-6">
        <Skeleton className="h-[70px] w-[70px] rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function R2Metrics() {
  const { data: metrics, error, isLoading } = useSWR<Metrics>("/api/r2-metrics", fetcher);
  const [value, setValue] = useState('item-1');

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full mb-4"
      value={value}
      onValueChange={setValue}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>
          {isLoading ? <Skeleton className="h-6 w-32" /> : '用量概览'}
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 md:grid-cols-3 pt-4">
            {isLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : error ? (
              <div className="text-red-500 border border-red-500/50 bg-red-500/10 rounded-lg p-4 md:col-span-3">
                <p className="font-bold">无法加载用量数据</p>
                <p className="text-sm">{error.message}</p>
              </div>
            ) : metrics ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">存储用量</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-row items-center gap-4 p-6">
                    <DonutChart value={(metrics.storage.used / metrics.storage.total) * 100} size={70} strokeWidth={8} />
                    <div>
                      <p className="text-xl font-bold">{formatBytes(metrics.storage.used)}</p>
                      <p className="text-xs text-muted-foreground">/ {formatBytes(metrics.storage.total)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Class A 操作 (每月)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-row items-center gap-4 p-6">
                    <DonutChart value={(metrics.classA.count / metrics.classA.total) * 100} size={70} strokeWidth={8} />
                    <div>
                      <p className="text-xl font-bold">{metrics.classA.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">/ {metrics.classA.total.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Class B 操作 (每月)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-row items-center gap-4 p-6">
                    <DonutChart value={(metrics.classB.count / metrics.classB.total) * 100} size={70} strokeWidth={8} />
                    <div>
                      <p className="text-xl font-bold">{metrics.classB.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">/ {metrics.classB.total.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
