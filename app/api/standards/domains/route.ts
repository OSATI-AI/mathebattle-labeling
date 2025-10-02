import { NextResponse } from 'next/server';
import { loadStandards } from '@/lib/standards-static';

/**
 * GET /api/standards/domains
 *
 * Returns all Common Core domains
 */
export async function GET() {
  try {
    const navigator = loadStandards();
    const domains = navigator.getDomains();

    return NextResponse.json({
      success: true,
      domains,
      count: domains.length,
    });
  } catch (error) {
    console.error('Error loading domains:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load domains',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
