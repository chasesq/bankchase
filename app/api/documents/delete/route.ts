import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (typeof url !== 'string' || !url) {
      return NextResponse.json(
        { error: 'No file URL provided' },
        { status: 400 }
      )
    }

    let blobUrl: URL
    try {
      blobUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      )
    }

    // Only allow deletion of files created by this document upload flow.
    // This prevents the client from using this endpoint to delete arbitrary blobs.
    if (
      blobUrl.protocol !== 'https:' ||
      !blobUrl.hostname.endsWith('.blob.vercel-storage.com') ||
      !blobUrl.pathname.startsWith('/documents/')
    ) {
      return NextResponse.json(
        { error: 'File URL is not managed by this application' },
        { status: 400 }
      )
    }

    await del(blobUrl.toString())

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
