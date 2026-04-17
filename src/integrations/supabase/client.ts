// Cliente Supabase - conexão manual (sem Lovable Cloud)
// A anon key é pública por design; a segurança real vem das RLS policies no banco.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://pzzeefqqcrmqfimetpwf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6emVlZnFxY3JtcWZpbWV0cHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTI2NTAsImV4cCI6MjA5MTk2ODY1MH0.aatWJV9VjDm6m1F0IHtwkt94E1usvNg2Q7ZWmst85fc';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
