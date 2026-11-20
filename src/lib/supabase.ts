import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY belum diisi. Buat file .env di root proyek (lihat .env.example) lalu restart npm run dev.'
  );
}


export const supabase = createClient(supabaseUrl, supabaseKey);