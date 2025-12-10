/**
 * Cloudflare R2 Storage Utility Functions
 * S3-compatible storage with zero egress fees
 * Free tier: 10GB storage, 1M Class A ops/month, 10M Class B ops/month
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client
function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'solar-documents';
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: custom domain for public access

export interface R2FileInfo {
  url: string;
  key: string;
  filename: string;
  size: number;
}

export interface StorageStats {
  total_storage_bytes: number;
  total_storage_mb: number;
  total_files: number;
  customers_with_documents: number;
}

/**
 * Build R2 file path with workspace isolation
 * Format: {workspaceId}/{customerId}/{category}/{timestamp}_{filename}
 */
function buildKey(
  workspaceId: string,
  customerId: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${workspaceId}/${customerId}/${category}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Upload file to R2
 * @returns Object containing the file URL and key
 */
export async function uploadFile(
  file: Buffer,
  workspaceId: string,
  customerId: string,
  category: string,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const r2Client = getR2Client();
  const key = buildKey(workspaceId, customerId, category, filename);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  // Generate URL
  const url = await getFileUrl(key);

  return { url, key };
}

/**
 * Get file URL (presigned for private access)
 * @param key R2 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  // If you have a public custom domain, return that
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }

  // Otherwise, generate presigned URL (expires in 1 hour by default)
  const r2Client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Download file from R2
 */
export async function downloadFile(key: string): Promise<{
  buffer: ArrayBuffer;
  filename: string;
  contentType: string;
} | null> {
  try {
    const r2Client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    const bytes = await response.Body!.transformToByteArray();
    // Convert Uint8Array to ArrayBuffer (not SharedArrayBuffer)
    const buffer = bytes.buffer.slice(0) as ArrayBuffer;

    const filename = key.split('/').pop()?.split('_').slice(1).join('_') || 'download';
    const contentType = response.ContentType || 'application/octet-stream';

    return {
      buffer,
      filename,
      contentType,
    };
  } catch (error) {
    console.error(`Error downloading R2 file ${key}:`, error);
    return null;
  }
}

/**
 * Get file metadata (for Vercel Blob compatibility)
 */
export async function getBlobFileInfo(keyOrUrl: string): Promise<R2FileInfo | null> {
  try {
    // Extract key from URL if a URL was passed
    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http')) {
      // Extract key from presigned URL or public URL
      const url = new URL(keyOrUrl);
      key = url.pathname.split('/').slice(1).join('/'); // Remove leading slash
    }

    const r2Client = getR2Client();
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    const url = await getFileUrl(key);
    const filename = key.split('/').pop()?.split('_').slice(1).join('_') || 'file';

    return {
      url,
      key,
      filename,
      size: response.ContentLength || 0,
    };
  } catch (error) {
    console.error(`Error getting R2 file info for ${keyOrUrl}:`, error);
    return null;
  }
}

/**
 * Delete file from R2
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const r2Client = getR2Client();
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error(`Error deleting R2 file ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple files (compatible with blob-utils API)
 */
export async function deleteBlobFiles(keysOrUrls: string[]): Promise<{
  deleted_count: number;
  failed_count: number;
  total_size_freed: number;
  failed_urls: string[];
}> {
  let deletedCount = 0;
  let failedCount = 0;
  let totalSizeFreed = 0;
  const failedUrls: string[] = [];

  for (const keyOrUrl of keysOrUrls) {
    try {
      // Extract key from URL if needed
      let key = keyOrUrl;
      if (keyOrUrl.startsWith('http')) {
        const url = new URL(keyOrUrl);
        key = url.pathname.split('/').slice(1).join('/');
      }

      // Get size before deletion
      const info = await getBlobFileInfo(key);
      if (info) {
        totalSizeFreed += info.size;
      }

      const deleted = await deleteFile(key);
      if (deleted) {
        deletedCount++;
      } else {
        failedCount++;
        failedUrls.push(keyOrUrl);
      }
    } catch (error) {
      failedCount++;
      failedUrls.push(keyOrUrl);
    }
  }

  return {
    deleted_count: deletedCount,
    failed_count: failedCount,
    total_size_freed: totalSizeFreed,
    failed_urls: failedUrls,
  };
}

/**
 * List all files in workspace or for specific customer
 */
export async function listFiles(workspaceId: string, customerId?: string): Promise<R2FileInfo[]> {
  const r2Client = getR2Client();
  const prefix = customerId ? `${workspaceId}/${customerId}/` : `${workspaceId}/`;

  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await r2Client.send(command);
  const files: R2FileInfo[] = [];

  if (response.Contents) {
    for (const object of response.Contents) {
      if (object.Key) {
        const filename = object.Key.split('/').pop()?.split('_').slice(1).join('_') || 'file';
        files.push({
          url: await getFileUrl(object.Key),
          key: object.Key,
          filename,
          size: object.Size || 0,
        });
      }
    }
  }

  return files;
}

/**
 * Get storage statistics (compatible with blob-utils API)
 * @param workspaceId Optional workspace to filter by
 */
export async function getBlobStorageStats(workspaceId?: string): Promise<StorageStats> {
  try {
    const r2Client = getR2Client();
    const prefix = workspaceId ? `${workspaceId}/` : '';

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);

    let totalSize = 0;
    let totalFiles = 0;
    const customerIds = new Set<string>();

    if (response.Contents) {
      response.Contents.forEach((object) => {
        totalSize += object.Size || 0;
        totalFiles++;

        // Extract customer ID from path: workspaceId/customerId/category/file
        if (object.Key) {
          const parts = object.Key.split('/');
          if (parts.length >= 2) {
            customerIds.add(parts[1]); // customerId is second part
          }
        }
      });
    }

    return {
      total_storage_bytes: totalSize,
      total_storage_mb: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
      total_files: totalFiles,
      customers_with_documents: customerIds.size,
    };
  } catch (error) {
    console.error('Error getting R2 storage stats:', error);
    throw new Error('Failed to get storage statistics');
  }
}

/**
 * Calculate storage for list of document keys/URLs (compatible with blob-utils API)
 */
export async function calculateDocumentStorage(keysOrUrls: string[]): Promise<{
  total_bytes: number;
  total_mb: number;
  file_count: number;
}> {
  let totalBytes = 0;
  let fileCount = 0;

  for (const keyOrUrl of keysOrUrls) {
    try {
      const info = await getBlobFileInfo(keyOrUrl);
      if (info) {
        totalBytes += info.size;
        fileCount++;
      }
    } catch (error) {
      console.error(`Error calculating storage for ${keyOrUrl}:`, error);
    }
  }

  return {
    total_bytes: totalBytes,
    total_mb: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    file_count: fileCount,
  };
}

/**
 * Download blob file as buffer (compatible with blob-utils API)
 */
export async function downloadBlobFile(keyOrUrl: string): Promise<{
  buffer: ArrayBuffer;
  filename: string;
  contentType: string;
} | null> {
  // Extract key from URL if needed
  let key = keyOrUrl;
  if (keyOrUrl.startsWith('http')) {
    const url = new URL(keyOrUrl);
    key = url.pathname.split('/').slice(1).join('/');
  }

  return downloadFile(key);
}

/**
 * Extract all document keys from step data
 * Handles both R2 keys and old Vercel Blob URLs
 */
export function extractDocumentUrls(stepDataArray: any[]): string[] {
  const keys: string[] = [];

  stepDataArray.forEach((stepData) => {
    const data = stepData.data || {};

    const extractFromObject = (obj: any) => {
      for (const key in obj) {
        const value = obj[key];

        if (typeof value === 'string') {
          // R2 key format: workspaceId/customerId/category/file
          if (value.includes('/') && !value.startsWith('http')) {
            keys.push(value);
          }
          // Old Vercel Blob URLs
          else if (value.includes('blob.vercel-storage.com')) {
            keys.push(value);
          }
          // R2 presigned URLs
          else if (value.includes('r2.cloudflarestorage.com')) {
            keys.push(value);
          }
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string' && (item.includes('/') || item.includes('blob.vercel-storage.com') || item.includes('r2.cloudflarestorage.com'))) {
              keys.push(item);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          extractFromObject(value);
        }
      }
    };

    extractFromObject(data);
  });

  // Remove duplicates
  return [...new Set(keys)];
}
