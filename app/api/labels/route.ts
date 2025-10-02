import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/utils/supabase/server';
import { Label } from '@/lib/types';

/**
 * POST /api/labels
 *
 * Save a label to Supabase database
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
    const label = {
      task_id: body.task_id,
      labeler_id: body.labeler_id,
      timestamp: new Date().toISOString(),
      selected_domains: body.selected_domains || [],
      selected_clusters: body.selected_clusters || [],
      selected_standards: body.selected_standards,
      time_spent_seconds: body.time_spent_seconds || 0,
    };

    const supabase = await createSupabaseClient();

    // Insert label into Supabase
    const { data, error } = await supabase
      .from('labels')
      .insert([label])
      .select();

    if (error) {
      console.error('Error inserting label:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save label',
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log('Label saved successfully:', data);

    return NextResponse.json({
      success: true,
      label_id: data[0].id,
      data: data[0],
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

    const supabase = await createSupabaseClient();

    // Fetch labels from Supabase
    const { data: labels, error } = await supabase
      .from('labels')
      .select('*')
      .eq('labeler_id', labelerId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching labels:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch labels',
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log('Retrieved', labels?.length || 0, 'labels for labeler:', labelerId);

    return NextResponse.json({
      success: true,
      labels: labels || [],
      labeled_task_ids: labels?.map((l: any) => l.task_id) || [],
      count: labels?.length || 0,
    });
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
