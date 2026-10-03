import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function inspectOrdersColumns() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

    if (error) console.error('Orders select error:', error);
    else console.log('Orders query success, row count:', data?.length);

    // Also check categories and their exact slugs
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

    console.log('\n--- Current Categories in DB ---');
    categories?.forEach(c => console.log(`- ${c.name} (slug: ${c.slug}, order: ${c.display_order})`));
}

inspectOrdersColumns();
