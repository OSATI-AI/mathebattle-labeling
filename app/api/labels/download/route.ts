import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/labels/download?labeler_id=[id]
 *
 * Download labels from Vercel Blob as a JSONL file
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const labelerId = searchParams.get('labeler_id');

    if (!labelerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing labeler_id parameter',
          message: 'Please provide a labeler_id query parameter',
        },
        { status: 400 }
      );
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blob storage not configured',
          message: 'BLOB_READ_WRITE_TOKEN environment variable not set',
        },
        { status: 503 }
      );
    }

    // Download from Vercel Blob
    const filename = `labels/labeler_${labelerId}.jsonl`;
    const blobUrl = `https://${process.env.BLOB_READ_WRITE_TOKEN}.public.blob.vercel-storage.com/${filename}`;

    const response = await fetch(blobUrl);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'No labels found for this labeler',
          message: `No labels file found for labeler ${labelerId}`,
        },
        { status: 404 }
      );
    }

    const content = await response.text();

    // Return as downloadable JSONL file
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': `attachment; filename="labeler_${labelerId}.jsonl"`,
      },
    });
  } catch (error) {
    console.error('Error downloading labels:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download labels',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
