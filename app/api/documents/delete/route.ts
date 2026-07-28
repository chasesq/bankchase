import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

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
    const { fileId, url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'No file URL provided' },
        { status: 400 }
      )
    }

    // Extract S3 key from URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/key
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'bankchase-uploads'
    const s3KeyMatch = url.split(`${bucketName}.s3`)[1]

    if (!s3KeyMatch) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      )
    }

    // Extract the key from the URL
    const s3Key = s3KeyMatch.split('/').slice(2).join('/')

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    await s3Client.send(deleteCommand)

    return NextResponse.json(
      {
        success: true,
        message: 'File deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json(
      {
        error: 'Delete failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
