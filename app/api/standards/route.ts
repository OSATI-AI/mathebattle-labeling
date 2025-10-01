import { NextResponse } from 'next/server';
import { loadStandards } from '@/lib/standards';

export const dynamic = 'force-dynamic';

/**
 * GET /api/standards?cluster=[clusterId]
 *
 * Returns all standards for a given cluster
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get('cluster');

    if (!cluster) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing cluster parameter',
          message: 'Please provide a cluster query parameter',
        },
        { status: 400 }
      );
    }

    const navigator = loadStandards();
    const standards = navigator.getStandards(cluster);

    return NextResponse.json({
      success: true,
      standards,
      count: standards.length,
      cluster,
    });
  } catch (error) {
    console.error('Error loading standards:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load standards',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
