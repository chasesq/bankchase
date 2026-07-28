# Document Upload Feature Setup Guide

## Overview

The document upload feature allows users to securely upload supporting documents (PDF, JPG, PNG) with a maximum file size of 10MB each. Files are stored in AWS S3 and managed through a clean, intuitive UI.

## Features

✅ **File Type Validation** - Only PDF, JPG, JPEG, and PNG files are accepted
✅ **File Size Validation** - Maximum 10MB per file
✅ **Drag & Drop Support** - Intuitive drag-and-drop interface
✅ **Progress Tracking** - Real-time upload progress indication
✅ **File Management** - View, download, and delete uploaded files
✅ **Error Handling** - Comprehensive validation and error messages
✅ **Secure Storage** - Files stored in AWS S3 with proper configurations

## File Structure

```
app/
├── api/
│   └── documents/
│       ├── upload/route.ts          # File upload handler
│       └── delete/route.ts           # File deletion handler
├── documents/
│   └── upload/
│       └── page.tsx                  # Upload page UI
└── components/
    └── document-uploader.tsx         # Reusable upload component
```

## Environment Variables Required

Add these variables to your `.env.local` or Vercel project environment variables:

```env
# AWS S3 Configuration (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=bankchase-uploads
```

## AWS S3 Setup

### 1. Create an S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://bankchase-uploads --region us-east-1
```

### 2. Configure Bucket Policy

Add the following bucket policy to allow uploads:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bankchase-uploads/*"
    },
    {
      "Sid": "AllowUploadFromApp",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::bankchase-uploads/*"
    }
  ]
}
```

### 3. Create IAM User (Recommended)

```bash
# Create IAM user for app access
aws iam create-user --user-name bankchase-app

# Create access key
aws iam create-access-key --user-name bankchase-app

# Attach S3 policy
aws iam attach-user-policy --user-name bankchase-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### 4. Enable CORS (Optional, for cross-origin requests)

```bash
aws s3api put-bucket-cors --bucket bankchase-uploads --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'
```

## Component Usage

### Basic Usage

```tsx
import { DocumentUploader } from '@/components/document-uploader'

export default function MyPage() {
  const handleFilesUploaded = (files) => {
    console.log('Uploaded files:', files)
    // Handle uploaded files
  }

  return (
    <DocumentUploader
      onFilesUploaded={handleFilesUploaded}
      maxFileSize={10}
    />
  )
}
```

### With Custom Props

```tsx
<DocumentUploader
  onFilesUploaded={handleFilesUploaded}
  maxFileSize={20}  // 20MB
  className="custom-class"
/>
```

## API Endpoints

### Upload File

**POST** `/api/documents/upload`

Request:
```
Content-Type: multipart/form-data
- file: File (PDF, JPG, PNG, max 10MB)
```

Response:
```json
{
  "success": true,
  "url": "https://bucket.s3.amazonaws.com/documents/...",
  "key": "documents/...",
  "size": 102400,
  "type": "application/pdf",
  "name": "document.pdf"
}
```

### Delete File

**POST** `/api/documents/delete`

Request:
```json
{
  "fileId": "file-123",
  "url": "https://bucket.s3.amazonaws.com/documents/..."
}
```

Response:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Validation Rules

### File Type Validation
- ✅ PDF (application/pdf)
- ✅ JPEG (image/jpeg)
- ✅ PNG (image/png)
- ❌ All other formats rejected

### File Size Validation
- Maximum: 10MB per file
- Enforced on both client and server

### File Name Sanitization
- Special characters replaced with hyphens
- Converted to lowercase
- Timestamp and random ID added for uniqueness

## Upload Page Features

### URL: `/documents/upload`

The dedicated upload page includes:

1. **Upload Area**
   - Drag & drop support
   - Click to browse
   - Real-time progress tracking

2. **File List**
   - Shows uploaded files with metadata
   - File size and upload time
   - Download links
   - Delete buttons

3. **Information Cards**
   - Supported formats
   - File size limits
   - Privacy information

4. **Upload Guidelines**
   - Best practices for document quality
   - Clear and legible requirements
   - Format recommendations
   - Document recency requirements

5. **Statistics**
   - Total files uploaded
   - Real-time counter

## Error Handling

### Client-Side Validation Errors

1. **Invalid file type**
   - Message: "Invalid file type. Allowed: PDF, JPG, PNG"
   - Trigger: User selects unsupported file format

2. **File too large**
   - Message: "File too large. Maximum size: 10MB"
   - Trigger: File exceeds size limit

3. **Upload failure**
   - Message: "Failed to upload [filename]: [error details]"
   - Trigger: Network or server error

### Server-Side Validation

The API endpoint validates:
- MIME type matching
- File extension validation
- Size limit enforcement
- Buffer integrity

## Security Features

1. **Server-Side Validation**
   - Double-check MIME type and extension
   - Verify file size before processing
   - Reject invalid combinations

2. **Unique File Naming**
   - Timestamp + random ID + sanitized original name
   - Prevents filename conflicts
   - Prevents directory traversal attacks

3. **S3 Access Control**
   - Use IAM policies for access control
   - Configure bucket policies
   - Enable versioning for audit trail (optional)

4. **Data Privacy**
   - Files encrypted in transit (HTTPS)
   - Secure storage in S3
   - Access tokens expire after upload

## Testing

### Manual Testing

1. Navigate to `/documents/upload`
2. Click on upload area or drag files
3. Select a PDF, JPG, or PNG file under 10MB
4. Watch progress bar
5. Verify file appears in list with download link
6. Test delete functionality
7. Test drag & drop
8. Test with invalid file types and sizes

### Automated Testing

```typescript
// Example test
describe('DocumentUploader', () => {
  it('should validate file types', () => {
    // Test implementation
  })

  it('should show progress during upload', () => {
    // Test implementation
  })

  it('should delete files', () => {
    // Test implementation
  })
})
```

## Troubleshooting

### "AWS credentials not configured"
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
- Check environment variables in Vercel dashboard
- Ensure IAM user has S3 permissions

### "Access Denied" on upload
- Check S3 bucket policy
- Verify IAM user has PutObject permission
- Check bucket name matches AWS_S3_BUCKET_NAME

### "File not found" on delete
- Verify S3 key extraction is correct
- Check bucket configuration
- Ensure file exists in S3

### Upload progress stuck
- Check network tab in browser DevTools
- Verify S3 bucket is accessible
- Check CloudWatch logs in AWS console

## Performance Optimization

### Best Practices

1. **Implement server-side presigned URLs for large files** (future enhancement)
2. **Add client-side chunked uploads** for files > 50MB
3. **Implement caching** for file metadata
4. **Use CDN** for file delivery
5. **Add virus scanning** before storing files

### Current Limitations

- Single file uploads up to 10MB
- No chunked upload support
- No virus scanning
- No automatic file compression

## Future Enhancements

- [ ] Presigned URLs for direct browser-to-S3 uploads
- [ ] Chunked upload support for larger files
- [ ] File compression before storage
- [ ] Virus/malware scanning
- [ ] File preview capabilities
- [ ] Multiple file organization
- [ ] Document versioning
- [ ] Automatic expiration policies
- [ ] Audit logging
- [ ] Webhook notifications

## Support & Monitoring

### CloudWatch Logs

Monitor S3 activities in AWS CloudWatch:
```bash
aws logs tail /aws/s3/bankchase-uploads --follow
```

### Health Check

```bash
curl -X GET https://your-domain/api/documents/health
```

## License & Credits

This feature is part of the BankChase application built with Next.js and AWS S3.
