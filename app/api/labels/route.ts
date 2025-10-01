import { NextResponse } from 'next/server';
import { put, head } from '@vercel/blob';
import { Label } from '@/lib/types';

/**
 * POST /api/labels
 *
 * Save a label to Vercel Blob storage
 * Labels are stored in JSONL format (one JSON object per line)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.task_id || !body.labeler_id || !body.selected_standards) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Required fields: task_id, labeler_id, selected_standards',
        },
        { status: 400 }
      );
    }

    // Create label object
    const label: Label = {
      task_id: body.task_id,
      labeler_id: body.labeler_id,
      timestamp: new Date().toISOString(),
      selected_domains: body.selected_domains || [],
      selected_clusters: body.selected_clusters || [],
      selected_standards: body.selected_standards,
      time_spent_seconds: body.time_spent_seconds || 0,
    };

    // Read existing labels from Vercel Blob
    const filename = `labels/labeler_${body.labeler_id}.jsonl`;
    let existingContent = '';

    try {
      // Check if Vercel Blob is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        // Local development mode: Use filesystem instead
        console.warn('BLOB_READ_WRITE_TOKEN not found, using filesystem storage');
        const fs = require('fs');
        const path = require('path');

        // Create labels directory if it doesn't exist
        const labelsDir = path.join(process.cwd(), 'labels');
        if (!fs.existsSync(labelsDir)) {
          fs.mkdirSync(labelsDir, { recursive: true });
        }

        const filepath = path.join(labelsDir, `labeler_${body.labeler_id}.jsonl`);

        // Read existing content
        let existingContent = '';
        if (fs.existsSync(filepath)) {
          existingContent = fs.readFileSync(filepath, 'utf-8');
        }

        // Append new label
        const newContent = existingContent + JSON.stringify(label) + '\n';
        fs.writeFileSync(filepath, newContent, 'utf-8');

        return NextResponse.json({
          success: true,
          label_id: `${body.labeler_id}_${body.task_id}`,
          message: 'Label saved (local mode - filesystem storage)',
        });
      }

      // Try to fetch existing content from Blob using proper SDK
      try {
        const blobMetadata = await head(filename);
        const response = await fetch(blobMetadata.downloadUrl);

        if (response.ok) {
          existingContent = await response.text();
        }
      } catch (blobError) {
        // Blob doesn't exist yet, that's fine - we'll create it
        console.log('No existing blob found, creating new one');
      }
    } catch (error) {
      // File doesn't exist yet, that's okay
      console.log('Creating new label file for labeler:', body.labeler_id);
    }

    // Append new label (JSONL format)
    const newContent = existingContent + JSON.stringify(label) + '\n';

    // Write back to Vercel Blob
    await put(filename, newContent, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      label_id: `${body.labeler_id}_${body.task_id}`,
    });
  } catch (error) {
    console.error('Error saving label:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save label',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/labels?labeler_id=[id]
 *
 * Fetch labeler's progress (all labels they've submitted)
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
      // Local development mode: Read from filesystem instead
      console.warn('BLOB_READ_WRITE_TOKEN not found, using filesystem storage');
      const fs = require('fs');
      const path = require('path');

      const filepath = path.join(process.cwd(), 'labels', `labeler_${labelerId}.jsonl`);

      if (!fs.existsSync(filepath)) {
        // File doesn't exist yet - return empty
        return NextResponse.json({
          success: true,
          labels: [],
          labeled_task_ids: [],
        });
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      const labels = content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => JSON.parse(line));

      return NextResponse.json({
        success: true,
        labels,
        labeled_task_ids: labels.map((l: Label) => l.task_id),
        count: labels.length,
        message: 'Local mode - filesystem storage',
      });
    }

    // Read from Vercel Blob
    const filename = `labels/labeler_${labelerId}.jsonl`;

    try {
      // Check if blob exists and get its metadata
      const blobMetadata = await head(filename);

      // Fetch the blob content using the download URL
      const response = await fetch(blobMetadata.downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }

      const content = await response.text();
      const labels = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      return NextResponse.json({
        success: true,
        labels,
        labeled_task_ids: labels.map((l: Label) => l.task_id),
        count: labels.length,
      });
    } catch (error) {
      console.error('Error reading labels:', error);
      // Return empty on error (file might not exist yet)
      return NextResponse.json({
        success: true,
        labels: [],
        labeled_task_ids: [],
      });
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/labels:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch labels',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
