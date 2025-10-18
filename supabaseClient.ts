import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qouxgwfdgnzsfhcalpzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdXhnd2ZkZ256c2ZoY2FscHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzU5NjAsImV4cCI6MjA3NjM1MTk2MH0.iu7x_VOLLJAhVL-WVCxAhabuwelpN4dPwt-OXbLR1IM';

// Initialize the client with the provided credentials.
export const supabase = createClient(supabaseUrl, supabaseKey);
