import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileId, url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'No file URL provided' },
        { status: 400 }
      )
    }

    await del(url)

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
