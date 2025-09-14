
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </CardContent>
        </Card>
    )
}

export function R2Metrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/r2-metrics");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch metrics");
        }
        const data = await response.json();
        setMetrics(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
  }, []);

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
        <p className="text-sm">{error}</p>
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
        <CardHeader>
          <CardTitle>存储用量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={storagePercentage} />
            <p className="text-sm text-muted-foreground">
              {formatBytes(metrics.storage.used)} / {formatBytes(metrics.storage.total)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Class A 操作 (每月)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={classAPercentage} />
            <p className="text-sm text-muted-foreground">
              {metrics.classA.count.toLocaleString()} / {metrics.classA.total.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Class B 操作 (每月)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={classBPercentage} />
            <p className="text-sm text-muted-foreground">
              {metrics.classB.count.toLocaleString()} / {metrics.classB.total.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
