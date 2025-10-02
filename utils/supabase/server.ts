import { createClient } from '@supabase/supabase-js';

export async function createSupabaseClient() {
  const supabaseUrl = process.env.SUPA_LABELS_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPA_LABELS_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
