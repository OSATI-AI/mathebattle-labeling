import { NextResponse } from 'next/server';
import { loadStandards } from '@/lib/standards-static';

export const dynamic = 'force-dynamic';

/**
 * GET /api/standards/clusters?domain=[domainId]
 *
 * Returns all clusters for a given domain
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing domain parameter',
          message: 'Please provide a domain query parameter',
        },
        { status: 400 }
      );
    }

    const navigator = loadStandards();
    const clusters = navigator.getClusters(domain);

    return NextResponse.json({
      success: true,
      clusters,
      count: clusters.length,
      domain,
    });
  } catch (error) {
    console.error('Error loading clusters:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load clusters',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
