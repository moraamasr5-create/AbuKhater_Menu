import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function extractAllActiveItems() {
    const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, categories(name, slug)')
        .neq('status', 'hidden')
        .order('category_id');

    console.log(`Total active items in DB: ${items.length}\n`);

    const byCategory = {};
    items.forEach(i => {
        const cat = i.categories?.name || 'Uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(i);
    });

    for (const [cat, list] of Object.entries(byCategory)) {
        console.log(`\n=== Category: ${cat} (${list.length} items) ===`);
        list.forEach(i => {
            console.log(`- ID: ${i.id} | Name: "${i.name.trim()}" | Price: ${i.price} | Desc: "${i.description || ''}"`);
        });
    }
}

extractAllActiveItems();
