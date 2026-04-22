// src/lib/supabase.js — Supabase client (service role for backend)
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  }
);

/**
 * Helper — throw on Supabase error
 */
export function assertNoError(error, context = '') {
  if (error) {
    console.error(`[Supabase] ${context}:`, error.message);
    throw new Error(`DB error: ${error.message}`);
  }
}

export default supabase;
