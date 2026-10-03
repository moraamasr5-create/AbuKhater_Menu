import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function listAllCategories() {
    const { data: categories } = await supabase
        .from('categories')
        .select('*');

    console.log('Categories:', categories);

    const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, price, category_id')
        .eq('category_id', '1440e098-8c8f-4a71-9f87-227c764e4490'); // category of وجبة الشرقي

    console.log(`Items in category 1440e098... (${items?.length}):`, items);
}

listAllCategories();
