import { createClient } from '@supabase/supabase-js';

// The user-provided Supabase URL and Anon Key are now hardcoded
// to ensure the application can connect to the backend.
const supabaseUrl = 'https://qouxgwfdgnzsfhcalpzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdXhnd2ZkZ256c2ZoY2FscHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzU5NjAsImV4cCI6MjA3NjM1MTk2MH0.iu7x_VOLLJAhVL-WVCxAhabuwelpN4dPwt-OXbLR1IM';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// In a real-world project, you should use environment variables:
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
