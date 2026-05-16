import { createClient } from '@supabase/supabase-js';
import config from '../../core/config';

if (!config.supabase.url || !config.supabase.key) {
    console.error('❌ Missing Supabase configuration! Check .env file and restart Vite.');
    console.log('Current Config:', config.supabase);
} else {
    console.log('✅ Supabase initialized with URL:', config.supabase.url);
}

export const supabase = createClient(
    config.supabase.url || '',
    config.supabase.key || ''
);

export default supabase;


