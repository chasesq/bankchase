# Document Upload Feature - Integration Guide

## Quick Start

The document upload feature is ready to use! Here's how to integrate it into your application.

## 1. Setup Environment Variables

1. Copy the example file:
   ```bash
   cp .env.documents.example .env.local
   ```

2. Add your AWS credentials to `.env.local`:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_here
   AWS_S3_BUCKET_NAME=bankchase-uploads
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## 2. Access the Upload Page

The upload page is immediately available at:
```
http://localhost:3000/documents/upload
```

## 3. Use the Component in Your Pages

### Option A: Use the Full Upload Page

The page at `/documents/upload` has everything built-in:
- File upload interface
- Guidelines and information
- Upload statistics

Add a link in your navigation:
```tsx
<Link href="/documents/upload">Upload Documents</Link>
```

### Option B: Embed the Component

Use `DocumentUploader` in any page:

```tsx
'use client'

import { DocumentUploader } from '@/components/document-uploader'
import { useState } from 'react'

export default function MyDocumentsPage() {
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleFilesUploaded = (files) => {
    setUploadedFiles(prev => [...prev, ...files])
    console.log('Files uploaded:', files)
  }

  return (
    <div>
      <h1>My Documents</h1>
      <DocumentUploader
        onFilesUploaded={handleFilesUploaded}
        maxFileSize={10}
      />
      
      {uploadedFiles.length > 0 && (
        <div>
          <h2>Uploaded Files: {uploadedFiles.length}</h2>
          {uploadedFiles.map(file => (
            <div key={file.id}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 4. Customize the Component

### With Custom Styling

```tsx
<DocumentUploader
  onFilesUploaded={handleFilesUploaded}
  maxFileSize={10}
  className="p-6 bg-blue-50 rounded-lg"
/>
```

### With Different File Size Limit

```tsx
<DocumentUploader
  onFilesUploaded={handleFilesUploaded}
  maxFileSize={50}  // 50MB limit
/>
```

## 5. Integrate with Forms

### Example: KYC Form with Document Upload

```tsx
'use client'

import { DocumentUploader } from '@/components/document-uploader'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function KYCForm() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)

  const handleFilesUploaded = (files) => {
    setDocuments(files)
  }

  const handleSubmit = async () => {
    if (documents.length === 0) {
      alert('Please upload documents')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: documents.map(d => ({
            url: d.url,
            type: d.type,
            name: d.name,
          })),
        }),
      })

      if (response.ok) {
        alert('KYC documents submitted successfully')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Know Your Customer (KYC)</h2>
        <p>Upload your identification documents</p>
      </div>

      <DocumentUploader onFilesUploaded={handleFilesUploaded} />

      <Button 
        onClick={handleSubmit} 
        disabled={loading || documents.length === 0}
      >
        {loading ? 'Submitting...' : 'Submit KYC'}
      </Button>
    </div>
  )
}
```

## 6. Store File References in Database

### With Supabase

```tsx
const saveDocumentMetadata = async (file) => {
  const { data, error } = await supabase
    .from('user_documents')
    .insert([
      {
        user_id: currentUser.id,
        file_name: file.name,
        file_url: file.url,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: file.uploadedAt,
      },
    ])

  if (error) {
    console.error('Error saving file metadata:', error)
  }
  return data
}

<DocumentUploader
  onFilesUploaded={async (files) => {
    for (const file of files) {
      await saveDocumentMetadata(file)
    }
  }}
/>
```

### With Neon/PostgreSQL

```tsx
const saveDocumentMetadata = async (file) => {
  const response = await fetch('/api/documents/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileUrl: file.url,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: file.uploadedAt,
    }),
  })

  return response.json()
}

<DocumentUploader
  onFilesUploaded={async (files) => {
    for (const file of files) {
      await saveDocumentMetadata(file)
    }
  }}
/>
```

## 7. Add File Management Features

### Retrieve Uploaded Documents

```tsx
const getUserDocuments = async () => {
  const response = await fetch('/api/documents/list', {
    method: 'GET',
  })
  
  return response.json()
}

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    getUserDocuments().then(setDocuments)
  }, [])

  return (
    <div>
      <h2>My Documents</h2>
      {documents.map(doc => (
        <div key={doc.id} className="p-4 border rounded">
          <a href={doc.url} target="_blank">
            {doc.name}
          </a>
        </div>
      ))}
    </div>
  )
}
```

## 8. Add Notifications

The component already uses Sonner for toast notifications. Customize them:

```tsx
import { toast } from 'sonner'

// Success
toast.success('Documents uploaded successfully')

// Error
toast.error('Upload failed')

// Custom
toast.custom((t) => (
  <div className="bg-blue-50 p-4 rounded">
    Upload in progress...
  </div>
))
```

## 9. Monitor Uploads

### Server-Side Logging

```typescript
// In /api/documents/upload/route.ts
console.log('[v0] File upload:', {
  fileName: file.name,
  size: file.size,
  type: file.type,
  timestamp: new Date().toISOString(),
})
```

### Client-Side Tracking

```tsx
const handleFilesUploaded = (files) => {
  console.log('[v0] Upload completed:', {
    count: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
  })
  
  // Send analytics event
  analytics.track('documents_uploaded', {
    count: files.length,
  })
}
```

## 10. Test the Integration

1. Navigate to `/documents/upload`
2. Upload a test file (PDF, JPG, or PNG)
3. Watch the progress bar
4. Verify file appears in the list
5. Click the file link to download
6. Test the delete functionality

## Common Integration Points

### Add to Settings Page
```tsx
// app/settings/page.tsx
import { DocumentUploader } from '@/components/document-uploader'

export default function SettingsPage() {
  return (
    <div>
      <h2>Upload Documents</h2>
      <DocumentUploader />
    </div>
  )
}
```

### Add to Onboarding Flow
```tsx
// app/onboarding/documents/page.tsx
export default function OnboardingDocuments() {
  return (
    <div>
      <h3>Step 3: Upload Documents</h3>
      <DocumentUploader />
    </div>
  )
}
```

### Add to Account Verification
```tsx
// app/account/verification/page.tsx
export default function AccountVerification() {
  return (
    <div>
      <h2>Verify Your Account</h2>
      <DocumentUploader />
    </div>
  )
}
```

## Troubleshooting Integration

### Component Not Loading
- Check if `@/components/document-uploader` path is correct
- Verify component file exists at `/components/document-uploader.tsx`
- Check import statement is `'use client'`

### Files Not Uploading
- Check AWS credentials in environment variables
- Verify S3 bucket name is correct
- Check browser console for errors
- Look at server logs in dev console

### Styling Issues
- Component uses Tailwind CSS - ensure it's configured
- Uses shadcn/ui Button - ensure it's installed
- Uses lucide-react icons - ensure package is installed

## API Reference

### DocumentUploader Props

```typescript
interface DocumentUploaderProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  maxFileSize?: number  // in MB, default: 10
  className?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}
```

## Next Steps

- Add file preview functionality
- Implement document categorization
- Add automatic virus scanning
- Create admin dashboard for document management
- Set up automated document processing
- Add OCR capabilities for text extraction

See `DOCUMENT_UPLOAD_SETUP.md` for detailed configuration and troubleshooting.
