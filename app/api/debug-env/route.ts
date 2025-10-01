import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to check environment configuration
 * DELETE THIS FILE after debugging
 */
export async function GET() {
  return NextResponse.json({
    has_blob_token: !!process.env.BLOB_READ_WRITE_TOKEN,
    blob_token_length: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    is_vercel: !!process.env.VERCEL,
  });
}
