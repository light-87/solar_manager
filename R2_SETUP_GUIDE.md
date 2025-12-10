# Cloudflare R2 Storage Setup Guide

This guide will help you set up Cloudflare R2 storage for your Solar Manager application.

## Why R2?

- **Free Tier:** 10GB storage, 1M Class A operations/month, 10M Class B operations/month
- **Zero Egress Fees:** Unlimited downloads with no bandwidth charges
- **Cost Effective:** $0.015/GB/month after free tier (vs $20/month for Vercel Blob Pro)
- **S3 Compatible:** Uses standard AWS S3 SDK

## Prerequisites

- Cloudflare account (free tier available)
- R2 enabled on your account

---

## Step 1: Enable R2 on Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **R2** in the left sidebar
3. If prompted, enable R2 on your account
4. Accept the terms (free tier has no credit card requirement)

---

## Step 2: Create R2 Bucket

1. In the R2 dashboard, click **Create bucket**
2. **Bucket name:** `solar-documents` (or your preferred name)
3. **Location:** Leave as "Automatic" (Cloudflare will choose optimal location)
4. Click **Create bucket**

---

## Step 3: Generate API Token

1. In the R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure the token:
   - **Token name:** `solar-manager-app`
   - **Permissions:** Select "Object Read & Write"
   - **Apply to specific buckets only:** Select `solar-documents`
4. Click **Create API Token**

5. **⚠️ IMPORTANT:** Copy these values immediately (Secret Access Key is only shown once):
   ```
   Access Key ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

6. Scroll down to find your endpoint:
   ```
   Jurisdiction-specific Endpoints for S3 Clients:
   https://<account-id>.r2.cloudflarestorage.com
   ```

---

## Step 4: Add to Vercel Environment Variables

Since you've already added these to Vercel, verify they match:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add/verify these variables:

```bash
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_BUCKET_NAME=solar-documents
```

3. Make sure to add them for **Production**, **Preview**, and **Development** environments

---

## Step 5: Add to Local Environment

Create/update `.env.local`:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

Edit `.env.local` and add your R2 credentials:

```bash
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_BUCKET_NAME=solar-documents
```

---

## Step 6: Run Database Migration

Execute the SQL migration to add workspace support:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `DATABASE_MIGRATION_R2.sql`
4. Execute the SQL

This adds `workspace_id` columns to all tables for multi-tenancy support.

---

## Step 7: Test R2 Integration

### Local Testing:

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

### Test Upload:

1. Go to your app
2. Navigate to a customer
3. Try uploading a document
4. Check the R2 dashboard to verify the file appears

### Verify File Structure:

Files should be organized like:
```
solar-documents/
├── default/                    (workspace ID)
│   ├── customer-uuid-1/
│   │   ├── documents/
│   │   │   └── 1234567890_aadhar.pdf
│   │   ├── photos/
│   │   │   └── 1234567891_site-photo.jpg
│   │   └── reports/
│   │       └── 1234567892_inspection.pdf
```

---

## Step 8: Migrate Existing Files (Optional)

If you have existing files in Vercel Blob:

```bash
# Install tsx for running TypeScript
npm install -D tsx

# Run migration script
npx tsx scripts/migrate-vercel-to-r2.ts
```

This will:
- Download all files from Vercel Blob
- Upload them to R2 with proper workspace structure
- Show progress and report any errors

---

## R2 Storage Structure

### Path Format:
```
{workspaceId}/{customerId}/{category}/{timestamp}_{filename}
```

### Example:
```
default/123e4567-e89b-12d3-a456-426614174000/documents/1702345678901_aadhar_card.pdf
```

### Categories:
- `documents` - Customer documents (IDs, contracts, etc.)
- `photos` - Site photos, installation photos
- `reports` - Inspection reports, completion certificates
- `agreements` - Signed agreements, bank documents

---

## Workspace Management

### Default Workspace:

All existing customers are assigned to the `default` workspace.

### Adding New Workspaces:

To separate clients into different workspaces:

```sql
-- Update customers to a new workspace
UPDATE customers
SET workspace_id = 'client-a'
WHERE id IN ('uuid1', 'uuid2');

-- Update users for that workspace
UPDATE users
SET workspace_id = 'client-a'
WHERE username = 'client-a-admin';
```

### Workspace Codes:

Update `.env` for different deployments:

```bash
# Client A deployment
NEXT_PUBLIC_WORKSPACE_CODE=SOLAR-CLIENT-A

# Client B deployment
NEXT_PUBLIC_WORKSPACE_CODE=SOLAR-CLIENT-B
```

---

## Monitoring & Costs

### Check Usage:

1. Go to R2 dashboard
2. Click on your bucket
3. View **Metrics** tab

### Free Tier Limits:

- **Storage:** 10GB free, then $0.015/GB/month
- **Class A (writes):** 1M/month free, then $4.50 per million
- **Class B (reads):** 10M/month free, then $0.36 per million
- **Egress:** Always free!

### Example Costs (after free tier):

| Customers | Storage | Monthly Cost |
|-----------|---------|--------------|
| 30 | 1.5GB | $0.00 |
| 100 | 5GB | $0.00 |
| 200 | 10GB | $0.00 |
| 400 | 20GB | $0.15 |
| 1,000 | 50GB | $0.60 |

---

## Security Best Practices

### 1. Keep Credentials Secret

- Never commit `.env.local` to git
- Rotate API tokens periodically
- Use separate tokens for dev/prod

### 2. Presigned URLs

By default, R2 storage is private. Files are accessed via presigned URLs that expire after 1 hour.

To change expiry time, update `lib/r2-storage.ts`:

```typescript
// 24-hour expiry
const url = await getFileUrl(key, 86400);

// 5-minute expiry for sensitive docs
const url = await getFileUrl(key, 300);
```

### 3. Public Access (Optional)

If you want permanent public URLs:

1. In R2 dashboard, go to your bucket settings
2. Enable **Public Access**
3. Connect a custom domain (e.g., `files.yourdomain.com`)
4. Set `R2_PUBLIC_URL` in your environment variables

---

## Troubleshooting

### Error: "R2 credentials not configured"

- Check `.env.local` has all R2 variables
- Restart your dev server: `npm run dev`
- For Vercel: redeploy after adding env vars

### Error: "Access Denied"

- Verify API token has "Object Read & Write" permissions
- Check token is applied to correct bucket
- Try regenerating the API token

### Files not appearing in R2

- Check bucket name matches `R2_BUCKET_NAME`
- Verify upload API returned success
- Check R2 dashboard → Objects tab

### Slow uploads/downloads

- R2 uses global CDN - should be fast worldwide
- Check your internet connection
- Large files (>10MB) may take time

---

## Migration Checklist

- [x] Install AWS SDK packages
- [x] Create R2 bucket
- [x] Generate API token
- [x] Add credentials to Vercel
- [x] Add credentials to `.env.local`
- [x] Run database migration SQL
- [ ] Test file upload in app
- [ ] Verify files appear in R2 dashboard
- [ ] Run migration script (if you have existing files)
- [ ] Test file downloads
- [ ] Update any frontend components that reference Vercel Blob

---

## Support

If you run into issues:

1. Check R2 dashboard for error messages
2. Check browser console for upload errors
3. Check server logs in Vercel dashboard
4. Verify all environment variables are set correctly

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://www.cloudflare.com/plans/developer-platform/#r2)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
