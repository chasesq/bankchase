import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, JPG, PNG' },
        { status: 400 }
      )
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'Invalid file extension' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      )
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()

    // Generate unique S3 key
    const timestamp = Date.now()
    const randomId = uuidv4().substring(0, 8)
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .toLowerCase()
    const s3Key = `documents/${timestamp}/${randomId}/${sanitizedFileName}`

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'bankchase-uploads',
      Key: s3Key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'upload-date': new Date().toISOString(),
      },
    })

    await s3Client.send(uploadCommand)

    // Construct public URL (adjust based on your S3 bucket configuration)
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME || 'bankchase-uploads'}.s3.${
      process.env.AWS_REGION || 'us-east-1'
    }.amazonaws.com/${s3Key}`

    return NextResponse.json(
      {
        success: true,
        url: s3Url,
        key: s3Key,
        size: file.size,
        type: file.type,
        name: file.name,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
