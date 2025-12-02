# Media Sharing Feature - Study Room

## Overview

Added ability to share photos, images, documents, and files in Study Room chat.

## Features Implemented

### ✅ Backend Changes

1. **Message Model Updated** (`Backend/models/Message.js`)

   - Added `type` enum: `'user' | 'system' | 'file'`
   - Added file metadata fields:
     - `fileUrl`: Storage path
     - `fileName`: Original filename
     - `fileType`: MIME type
     - `fileSize`: File size in bytes

2. **File Upload System** (`Backend/server.js`)

   - Multer middleware configured
   - File storage in `Backend/uploads/` directory
   - Upload endpoint: `POST /api/upload`
   - **File size limit**: 10MB
   - **Allowed types**: JPEG, PNG, GIF, PDF, DOC, DOCX, TXT, ZIP, RAR

3. **Socket.IO Handler Updated**
   - `sendMessage` event now accepts `fileData` parameter
   - Stores file metadata with messages

### ✅ Frontend Changes

1. **Message Type Extended** (`frontend/src/types/study-room.ts`)

   - Added `type: 'file'` option
   - Added optional file fields

2. **ChatBox Component Enhanced** (`frontend/src/components/study-room/ChatBox.tsx`)
   - File selection button with paperclip icon
   - File preview before sending
   - Upload progress indicator
   - File display in messages:
     - **Images**: Inline preview with click to open full size
     - **Documents**: File card with name, size, and download button

## How to Use

### Sending Files

1. Click the **paperclip icon** (📎) in the chat input area
2. Select a file (max 10MB)
3. File preview appears above input
4. Add optional message text
5. Click **Send** button
6. File uploads and appears in chat

### Viewing Files

- **Images**: Display inline, click to open full size in new tab
- **Documents**: Show as file card with download button
- All files can be downloaded by clicking

## Supported File Types

- **Images**: JPG, JPEG, PNG, GIF
- **Documents**: PDF, DOC, DOCX, TXT
- **Archives**: ZIP, RAR

## Technical Details

### File Storage

- Location: `Backend/uploads/` (gitignored)
- Naming: `timestamp-random-originalname`
- Served via: `/uploads` static route

### API Endpoint

```
POST /api/upload
Content-Type: multipart/form-data
Body: { file: <File> }

Response: {
  success: true,
  file: {
    url: "/uploads/filename",
    name: "original.jpg",
    type: "image/jpeg",
    size: 12345
  }
}
```

### Socket Event

```javascript
socket.emit("sendMessage", {
  roomId: "xxx",
  userId: "xxx",
  username: "John",
  content: "Check this out!",
  fileData: {
    url: "/uploads/xxx.jpg",
    name: "photo.jpg",
    type: "image/jpeg",
    size: 12345,
  },
});
```

## Deployment Notes

### For Render (Backend)

The `uploads/` folder is **ephemeral** on Render free tier. Files uploaded will be lost when the server restarts.

**For production**, consider using:

- **Cloudinary** (free tier: 25GB)
- **AWS S3**
- **Azure Blob Storage**
- **Google Cloud Storage**

To implement cloud storage:

1. Replace multer's `diskStorage` with `memoryStorage`
2. Upload buffer to cloud provider
3. Return cloud URL instead of local path

### For Netlify (Frontend)

No changes needed - frontend only uploads to backend.

## Security Considerations

1. **File size limit**: 10MB prevents abuse
2. **File type validation**: Only allowed extensions/MIME types
3. **Unique filenames**: Prevents overwrites and collisions
4. **No authentication**: Consider adding user verification before upload

## Future Enhancements

- [ ] Add drag-and-drop file upload
- [ ] Support multiple file uploads at once
- [ ] Add image compression before upload
- [ ] Implement cloud storage (Cloudinary/S3)
- [ ] Add file deletion capability
- [ ] Show upload progress percentage
- [ ] Add file preview thumbnails
- [ ] Implement virus scanning

## Testing

1. Start backend: `cd Backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open Study Room
4. Try uploading:
   - An image file
   - A PDF document
   - A text file
5. Verify file appears in chat
6. Click to download/view

---

**Status**: ✅ Feature complete and ready for testing!
