// src/lib/supabase.js — Supabase client (service role for backend)
import { createClient } from '@supabase/supabase-js';

// Accept both naming conventions (Railway may have the old name)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Supabase] FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  console.error('[Supabase] Set these in your Railway / deployment dashboard.');
  process.exit(1);
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
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
