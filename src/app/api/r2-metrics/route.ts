import { NextResponse } from "next/server";

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Cloudflare free tier limits
const FREE_TIER = {
  storage: 10 * 1024 * 1024 * 1024, // 10 GB
  classA: 1000000, // 1 Million
  classB: 10000000, // 10 Million
};

async function getR2Metrics() {
  if (!CLOUDFLARE_API_TOKEN || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
    throw new Error("Missing Cloudflare credentials in environment variables.");
  }

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endOfMonth = now;

  const query = `
    query GetR2Metrics($accountTag: String!, $bucketName: String!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: {accountTag: $accountTag}) {
          r2OperationsAdaptiveGroups(
            limit: 1000,
            filter: {bucketName: $bucketName, datetime_geq: $start, datetime_leq: $end}
          ) {
            dimensions {
              actionType
            }
            sum {
              requests
            }
          }
          r2StorageAdaptiveGroups(
            limit: 1,
            filter: {bucketName: $bucketName, datetime_geq: $start, datetime_leq: $end}
          ) {
            max {
              payloadSize
              metadataSize
            }
          }
        }
      }
    }
  `;

  const variables = {
    accountTag: R2_ACCOUNT_ID,
    bucketName: R2_BUCKET_NAME,
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString(),
  };

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudflare API request failed: ${response.status} ${errorBody}`);
  }

  const json: any = await response.json();

  if (json.errors) {
    throw new Error(`GraphQL query failed: ${JSON.stringify(json.errors)}`);
  }

  const accountData = json.data.viewer.accounts[0];
  if (!accountData) {
    return {
      storage: { used: 0, total: FREE_TIER.storage },
      classA: { count: 0, total: FREE_TIER.classA },
      classB: { count: 0, total: FREE_TIER.classB },
    };
  }

  // Based on https://developers.cloudflare.com/r2/pricing/
  const CLASS_A_OPERATIONS = [
    'AbortMultipartUpload',
    'CompleteMultipartUpload',
    'CopyObject',
    'CreateMultipartUpload',
    'DeleteObject',
    'DeleteObjects',
    'DeleteBucket',
    'DeleteBucketCors',
    'DeleteBucketEncryption',
    'DeleteBucketLifecycle',
    'DeleteBucketReplication',
    'ListMultipartUploads',
    'ListObjects',
    'ListParts',
    'PutBucket',
    'PutBucketCors',
    'PutBucketEncryption',
    'PutBucketLifecycle',
    'PutBucketLogging',
    'PutBucketNotification',
    'PutBucketReplication',
    'PutBucketTagging',
    'PutBucketVersioning',
    'PutObject',
    'RestoreObject',
    'UploadPart',
    'UploadPartCopy',
  ];

  const CLASS_B_OPERATIONS = ['GetObject', 'HeadObject', 'HeadBucket'];

  // Process Operations Data
  let classACount = 0;
  let classBCount = 0;
  accountData.r2OperationsAdaptiveGroups?.forEach((group: any) => {
    const action = group.dimensions.actionType;
    const requests = group.sum.requests || 0;
    if (CLASS_A_OPERATIONS.includes(action)) {
      classACount += requests;
    } else if (CLASS_B_OPERATIONS.includes(action)) {
      classBCount += requests;
    }
  });

  // Process Storage Data
  const storageData = accountData.r2StorageAdaptiveGroups[0]?.max;
  const usedStorage = (storageData?.payloadSize || 0) + (storageData?.metadataSize || 0);

  const metrics = {
    storage: {
      used: usedStorage,
      total: FREE_TIER.storage,
    },
    classA: {
      count: classACount,
      total: FREE_TIER.classA,
    },
    classB: {
      count: classBCount,
      total: FREE_TIER.classB,
    },
  };

  return metrics;
}

export async function GET() {
  try {
    const metrics = await getR2Metrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
