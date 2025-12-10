# Fix CORS Error for R2 Downloads

## Problem
R2 presigned URLs are blocked by CORS policy when accessed from your Vercel domain.

## Solution: Add CORS Policy to R2 Bucket

### Step 1: Go to Cloudflare R2 Dashboard

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click on your **solar-documents** bucket
4. Go to **Settings** tab
5. Scroll to **CORS Policy** section

### Step 2: Add CORS Configuration

Click **Add CORS policy** and paste this JSON:

```json
[
  {
    "AllowedOrigins": [
      "https://*.vercel.app",
      "http://localhost:3000",
      "http://localhost:*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Save

Click **Save** and the CORS policy will be applied immediately.

---

## Alternative: Use Specific Domains (More Secure)

If you want to restrict to specific domains only:

```json
[
  {
    "AllowedOrigins": [
      "https://your-app.vercel.app",
      "https://your-app-git-branch.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `your-app.vercel.app` with your actual Vercel domain.

---

## Explanation

- **AllowedOrigins**: Domains that can access R2 files
  - `https://*.vercel.app` - All Vercel preview deployments
  - `http://localhost:*` - Local development on any port

- **AllowedMethods**: HTTP methods allowed
  - `GET` - Download files
  - `HEAD` - Check file metadata

- **AllowedHeaders**: Request headers browsers can send
  - `*` - Allow all headers (safe for presigned URLs)

- **ExposeHeaders**: Response headers browsers can read
  - Needed for file downloads to work properly

- **MaxAgeSeconds**: Cache CORS preflight for 1 hour

---

## Test After Applying

1. Wait ~10 seconds for CORS policy to propagate
2. Refresh your app
3. Try downloading a file again
4. It should work without CORS errors!

---

## Troubleshooting

**Still getting CORS error?**
- Wait 1-2 minutes for changes to propagate
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check browser console for updated error
- Verify CORS policy was saved correctly

**Want to see actual domains?**
Check your Vercel deployment URLs and add them specifically to `AllowedOrigins`.
