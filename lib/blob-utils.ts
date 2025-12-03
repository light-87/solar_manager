/**
 * Blob Storage Utility Functions
 * Handles Vercel Blob operations for document management
 */

import { list, head, del } from '@vercel/blob';

export interface BlobFileInfo {
  url: string;
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
 * Get total blob storage statistics
 */
export async function getBlobStorageStats(): Promise<StorageStats> {
  try {
    const { blobs } = await list();

    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0);
    const totalFiles = blobs.length;

    // Extract unique customer IDs from blob filenames
    // Format: customerId_documentType_timestamp_filename
    const customerIds = new Set<string>();
    blobs.forEach((blob) => {
      const parts = blob.pathname.split('_');
      if (parts.length > 0) {
        customerIds.add(parts[0]);
      }
    });

    return {
      total_storage_bytes: totalSize,
      total_storage_mb: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
      total_files: totalFiles,
      customers_with_documents: customerIds.size,
    };
  } catch (error) {
    console.error('Error getting blob storage stats:', error);
    throw new Error('Failed to get storage statistics');
  }
}

/**
 * Get file information from blob URL
 */
export async function getBlobFileInfo(url: string): Promise<BlobFileInfo | null> {
  try {
    const blobInfo = await head(url);

    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];

    return {
      url,
      filename: decodeURIComponent(filename),
      size: blobInfo.size,
    };
  } catch (error) {
    console.error(`Error getting blob info for ${url}:`, error);
    return null;
  }
}

/**
 * Get total storage size for a list of document URLs
 */
export async function calculateDocumentStorage(documentUrls: string[]): Promise<{
  total_bytes: number;
  total_mb: number;
  file_count: number;
}> {
  let totalBytes = 0;
  let fileCount = 0;

  for (const url of documentUrls) {
    try {
      const info = await getBlobFileInfo(url);
      if (info) {
        totalBytes += info.size;
        fileCount++;
      }
    } catch (error) {
      console.error(`Error calculating storage for ${url}:`, error);
      // Continue with other files
    }
  }

  return {
    total_bytes: totalBytes,
    total_mb: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    file_count: fileCount,
  };
}

/**
 * Delete blob files from storage
 */
export async function deleteBlobFiles(urls: string[]): Promise<{
  deleted_count: number;
  failed_count: number;
  total_size_freed: number;
  failed_urls: string[];
}> {
  let deletedCount = 0;
  let failedCount = 0;
  let totalSizeFreed = 0;
  const failedUrls: string[] = [];

  for (const url of urls) {
    try {
      // Get file size before deletion
      const info = await getBlobFileInfo(url);
      if (info) {
        totalSizeFreed += info.size;
      }

      // Delete the blob
      await del(url);
      deletedCount++;
    } catch (error) {
      console.error(`Error deleting blob ${url}:`, error);
      failedCount++;
      failedUrls.push(url);
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
 * Download blob file as buffer
 */
export async function downloadBlobFile(url: string): Promise<{
  buffer: ArrayBuffer;
  filename: string;
  contentType: string;
} | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = decodeURIComponent(urlParts[urlParts.length - 1]);

    return {
      buffer,
      filename,
      contentType,
    };
  } catch (error) {
    console.error(`Error downloading blob ${url}:`, error);
    return null;
  }
}

/**
 * Extract all document URLs from step data
 */
export function extractDocumentUrls(stepDataArray: any[]): string[] {
  const urls: string[] = [];

  stepDataArray.forEach((stepData) => {
    const data = stepData.data || {};

    // Recursively extract URLs from data object
    const extractFromObject = (obj: any) => {
      for (const key in obj) {
        const value = obj[key];

        if (typeof value === 'string' && value.startsWith('http')) {
          // Check if it's a blob URL
          if (value.includes('blob.vercel-storage.com')) {
            urls.push(value);
          }
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string' && item.startsWith('http') && item.includes('blob.vercel-storage.com')) {
              urls.push(item);
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
  return [...new Set(urls)];
}
