import { createClient } from '@supabase/supabase-js';

// Configure via .env.local — never hardcode keys here (push protection).
// See backend/.env.example for the required variable names.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-key-configure-via-env';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Subscribe to real-time incident updates from Supabase Realtime
 */
export function subscribeToIncidents(callback: (payload: any) => void) {
  return supabase
    .channel('public:incidents')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'incidents' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
}
