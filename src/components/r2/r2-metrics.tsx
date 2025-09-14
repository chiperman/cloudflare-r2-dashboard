
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
            <CardHeader>
                <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent className="flex flex-row items-center gap-4 p-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardContent>
        </Card>
    )
}

export function R2Metrics() {
  const { data: metrics, error, isLoading } = useSWR<Metrics>("/api/r2-metrics", fetcher);

  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
        </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 border border-red-500/50 bg-red-500/10 rounded-lg p-4">
        <p className="font-bold">无法加载用量数据</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  if (!metrics) {
    return null;
  }

  const storagePercentage = (metrics.storage.used / metrics.storage.total) * 100;
  const classAPercentage = (metrics.classA.count / metrics.classA.total) * 100;
  const classBPercentage = (metrics.classB.count / metrics.classB.total) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">存储用量</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row items-center gap-4 p-6">
          <DonutChart value={storagePercentage} size={70} strokeWidth={8} />
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
          <DonutChart value={classAPercentage} size={70} strokeWidth={8} />
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
          <DonutChart value={classBPercentage} size={70} strokeWidth={8} />
           <div>
            <p className="text-xl font-bold">{metrics.classB.count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">/ {metrics.classB.total.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
