'use client'

import { useState } from 'react'
import { DocumentUploader } from '@/components/document-uploader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export default function DocumentsUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [totalUploads, setTotalUploads] = useState(0)

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files])
    setTotalUploads((prev) => prev + files.length)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Supporting Documents</h1>
          <p className="text-gray-600">
            Upload identification, proof of address, and other supporting documents for your account.
          </p>
        </div>

        {/* Main Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag and drop or click to select files (PDF, JPG, PNG - max 10MB each)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploader
              onFilesUploaded={handleFilesUploaded}
              maxFileSize={10}
              className="space-y-4"
            />
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid gap-4 mb-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Supported formats:</strong> PDF, JPG/JPEG, PNG
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Maximum file size:</strong> 10MB per file. Ensure documents are clear and legible.
            </AlertDescription>
          </Alert>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Privacy:</strong> Your documents are securely stored and encrypted. We only use them for
              verification purposes.
            </AlertDescription>
          </Alert>
        </div>

        {/* Upload Statistics */}
        {totalUploads > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{totalUploads}</div>
                <p className="text-gray-600">
                  {totalUploads === 1 ? 'document' : 'documents'} uploaded successfully
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Guidelines */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                1
              </div>
              <p>
                <strong className="text-gray-900">Clear and Legible:</strong> Ensure all text is clearly visible
                and not blurry.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                2
              </div>
              <p>
                <strong className="text-gray-900">Full Document:</strong> Upload complete documents with all four
                corners visible.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                3
              </div>
              <p>
                <strong className="text-gray-900">Proper Format:</strong> Use PDF for official documents, JPG/PNG for
                photos.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                4
              </div>
              <p>
                <strong className="text-gray-900">Recent Documents:</strong> Ensure documents are current and not
                expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
