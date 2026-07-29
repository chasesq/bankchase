'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2, AlertCircle, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

interface DocumentUploaderProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  maxFileSize?: number // in MB
  className?: string
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const DEFAULT_MAX_SIZE = 10 // MB

export function DocumentUploader({
  onFilesUploaded,
  maxFileSize = DEFAULT_MAX_SIZE,
  className = '',
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: PDF, JPG, PNG`,
      }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid MIME type for ${file.name}`,
      }
    }

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxFileSize}MB`,
      }
    }

    return { valid: true }
  }

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const fileId = Math.random().toString(36).substring(7)
    
    try {
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: Math.round(percentComplete),
          }))
        }
      })

      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve({
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                url: response.url,
                uploadedAt: new Date().toISOString(),
              })
            } catch (e) {
              reject(new Error('Failed to parse server response'))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload error'))
        })

        xhr.open('POST', '/api/documents/upload')
        xhr.send(formData)
      })
    } catch (error) {
      console.error('[v0] Upload error:', error)
      throw error
    }
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return

    const filesToProcess = Array.from(fileList)
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of filesToProcess) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
    }

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      const uploadedFiles: UploadedFile[] = []

      for (const file of validFiles) {
        try {
          const uploadedFile = await uploadFile(file)
          if (uploadedFile) {
            uploadedFiles.push(uploadedFile)
          }
        } catch (error) {
          toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (uploadedFiles.length > 0) {
        setFiles((prev) => [...prev, ...uploadedFiles])
        toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`)
        onFilesUploaded?.(uploadedFiles)
      }
    } finally {
      setUploading(false)
      setUploadProgress({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    try {
      await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, url: file.url }),
      })

      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast.success('File deleted')
    } catch (error) {
      toast.error('Failed to delete file')
      console.error('[v0] Delete error:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50/50 transition-colors cursor-pointer bg-gray-50/30"
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('border-blue-500', 'bg-blue-50/30')
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/30')
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/30')
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />

        <div className="space-y-2">
          <Upload className="w-10 h-10 mx-auto text-gray-400" />
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {uploading ? 'Uploading...' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse. Supported: PDF, JPG, PNG (max {maxFileSize}MB each)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-shrink-0">
                  {file.type === 'application/pdf' ? (
                    <File className="w-5 h-5 text-red-500" />
                  ) : (
                    <File className="w-5 h-5 text-blue-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline truncate block"
                  >
                    {file.name}
                  </a>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 ? (
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${uploadProgress[file.id]}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{uploadProgress[file.id]}%</span>
                    </div>
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    disabled={uploading}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || files.length === 0}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? 'Uploading...' : 'Choose Files'}
      </Button>
    </div>
  )
}
