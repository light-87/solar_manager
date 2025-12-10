/**
 * Migration Script: Vercel Blob → Cloudflare R2
 *
 * This script migrates all existing files from Vercel Blob to R2 storage
 * Run with: npx tsx scripts/migrate-vercel-to-r2.ts
 *
 * Prerequisites:
 * 1. npm install tsx (if not installed)
 * 2. Set R2 credentials in .env.local
 * 3. Have BLOB_READ_WRITE_TOKEN set for Vercel Blob access
 */

import { list, head } from '@vercel/blob';
import { uploadFile } from '../lib/r2-storage';
import { supabase } from '../lib/supabase';

interface MigrationStats {
  total_files: number;
  migrated: number;
  failed: number;
  total_bytes: number;
  failed_files: Array<{ url: string; error: string }>;
}

/**
 * Parse Vercel Blob filename to extract metadata
 * Format: customerId_documentType_timestamp_filename
 */
function parseVercelFilename(pathname: string): {
  customerId: string;
  documentType: string;
  filename: string;
} | null {
  const parts = pathname.split('_');

  if (parts.length < 4) {
    // Fallback for non-standard names
    return {
      customerId: 'unknown',
      documentType: 'documents',
      filename: pathname,
    };
  }

  return {
    customerId: parts[0],
    documentType: parts[1],
    filename: parts.slice(3).join('_'), // rejoin the actual filename
  };
}

/**
 * Get workspace ID for a customer
 */
async function getCustomerWorkspace(customerId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('workspace_id')
      .eq('id', customerId)
      .single();

    if (error || !data) {
      console.warn(`Could not find workspace for customer ${customerId}, using 'default'`);
      return 'default';
    }

    return data.workspace_id || 'default';
  } catch (error) {
    console.warn(`Error getting workspace for customer ${customerId}:`, error);
    return 'default';
  }
}

/**
 * Migrate a single file from Vercel Blob to R2
 */
async function migrateFile(
  blobUrl: string,
  pathname: string,
  size: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`\n📄 Migrating: ${pathname} (${(size / 1024 / 1024).toFixed(2)} MB)`);

    // Parse filename
    const parsed = parseVercelFilename(pathname);
    if (!parsed) {
      throw new Error('Could not parse filename');
    }

    // Get workspace for this customer
    const workspaceId = await getCustomerWorkspace(parsed.customerId);
    console.log(`   Workspace: ${workspaceId}`);

    // Download from Vercel Blob
    console.log(`   ⬇️  Downloading from Vercel...`);
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Upload to R2
    console.log(`   ⬆️  Uploading to R2...`);
    const { url, key } = await uploadFile(
      buffer,
      workspaceId,
      parsed.customerId,
      parsed.documentType,
      parsed.filename,
      contentType
    );

    console.log(`   ✅ Success! R2 key: ${key}`);

    // TODO: Update database references from Vercel URL to R2 key
    // This would require scanning step_data and updating URLs
    // For now, we'll just migrate the files

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Main migration function
 */
async function migrateAll() {
  console.log('🚀 Starting Vercel Blob → R2 Migration\n');
  console.log('=' .repeat(60));

  const stats: MigrationStats = {
    total_files: 0,
    migrated: 0,
    failed: 0,
    total_bytes: 0,
    failed_files: [],
  };

  try {
    // List all files in Vercel Blob
    console.log('\n📋 Listing files in Vercel Blob...');
    const { blobs } = await list();

    stats.total_files = blobs.length;
    stats.total_bytes = blobs.reduce((sum, blob) => sum + blob.size, 0);

    console.log(`\n📊 Found ${stats.total_files} files (${(stats.total_bytes / 1024 / 1024 / 1024).toFixed(2)} GB)`);

    if (stats.total_files === 0) {
      console.log('\n✨ No files to migrate!');
      return;
    }

    // Confirm before proceeding
    console.log('\n⚠️  This will upload all files to R2.');
    console.log('⚠️  Make sure R2 credentials are set in your environment.');
    console.log('\n🔄 Starting migration...\n');

    // Migrate each file
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      console.log(`\n[${i + 1}/${blobs.length}]`);

      const result = await migrateFile(blob.url, blob.pathname, blob.size);

      if (result.success) {
        stats.migrated++;
      } else {
        stats.failed++;
        stats.failed_files.push({
          url: blob.url,
          error: result.error || 'Unknown error',
        });
      }

      // Progress update
      const progress = ((i + 1) / blobs.length * 100).toFixed(1);
      console.log(`\n📈 Progress: ${progress}% (${stats.migrated} migrated, ${stats.failed} failed)`);
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Migration Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total files: ${stats.total_files}`);
    console.log(`   ✅ Migrated: ${stats.migrated}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   💾 Total size: ${(stats.total_bytes / 1024 / 1024 / 1024).toFixed(2)} GB`);

    if (stats.failed_files.length > 0) {
      console.log(`\n⚠️  Failed files:`);
      stats.failed_files.forEach(({ url, error }) => {
        console.log(`   - ${url}`);
        console.log(`     Error: ${error}`);
      });
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Verify files in R2 dashboard');
    console.log('   2. Update database references (if needed)');
    console.log('   3. Test file downloads in your app');
    console.log('   4. Once confirmed, you can delete Vercel Blob files\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAll().then(() => {
  console.log('✨ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
