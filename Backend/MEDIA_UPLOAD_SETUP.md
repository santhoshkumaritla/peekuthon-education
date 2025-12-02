# Media Upload Configuration for Render

## Issue

Render uses ephemeral filesystem by default - uploaded files are lost on server restart.

## Solution

We've configured a persistent disk in `render.yaml` to store uploaded files.

## Render Dashboard Configuration

### Step 1: Deploy with Persistent Disk

The `render.yaml` file now includes:

```yaml
disk:
  name: uploads-disk
  mountPath: /opt/render/project/src/uploads
  sizeGB: 1
```

### Step 2: Verify Disk Mount (After Deployment)

1. Go to your service on Render Dashboard
2. Navigate to **Disks** tab
3. Verify that `uploads-disk` is mounted at `/opt/render/project/src/uploads`
4. You can increase the disk size if needed (default: 1GB)

## Important Notes

### Disk Persistence

- The disk persists across deploys and restarts
- Files uploaded will remain available
- Disk is backed up automatically by Render

### Disk Size Management

- Free tier: Limited disk space
- Monitor usage in Render Dashboard
- Consider implementing:
  - File cleanup for old uploads
  - File size restrictions (currently 10MB max)
  - Cloud storage migration (AWS S3, Cloudinary) for production

### Environment Variables Required

Make sure these are set in Render Dashboard:

- `MONGODB_URI` - Your MongoDB connection string
- `FRONTEND_URL` - Your Netlify frontend URL (e.g., https://yourapp.netlify.app)

## Testing Upload After Deployment

1. Open your deployed frontend
2. Join a study room
3. Try uploading an image or file
4. Verify the file appears in chat
5. Restart your backend service and verify file is still accessible

## Alternative: Cloud Storage (Recommended for Production)

For production at scale, consider using cloud storage:

### Option 1: AWS S3

```bash
npm install aws-sdk multer-s3
```

### Option 2: Cloudinary

```bash
npm install cloudinary multer-storage-cloudinary
```

### Option 3: Google Cloud Storage

```bash
npm install @google-cloud/storage multer-cloud-storage
```

## Current Implementation Status

✅ Frontend: URL construction fixed for production  
✅ Backend: Persistent disk configured in render.yaml  
✅ Backend: Uploads directory auto-created on startup  
✅ Backend: Enhanced error logging for debugging

## Troubleshooting

### Files not uploading

1. Check browser console for upload errors
2. Check Render logs: Dashboard > Logs
3. Verify disk is mounted: Dashboard > Disks
4. Check CORS configuration allows your frontend domain

### Files not displaying

1. Verify file URL in message object
2. Check network tab for 404 errors
3. Ensure `/uploads` route is accessible
4. Test direct file URL: `https://your-backend.onrender.com/uploads/filename`

### Disk full error

1. Increase disk size in Render Dashboard
2. Implement file cleanup logic
3. Migrate to cloud storage solution
