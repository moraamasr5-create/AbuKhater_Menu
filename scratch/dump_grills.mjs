import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function dumpGrillsAndMeals() {
    const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, categories(name, slug)')
        .order('display_order', { ascending: true });

    const grouped = {};
    items.forEach(i => {
        const cat = i.categories?.name || 'Uncategorized';
        if (cat.includes('مشوي') || cat.includes('وجب') || cat.includes('صوان')) {
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(i);
        }
    });

    for (const [cat, list] of Object.entries(grouped)) {
        console.log(`\n### Category: ${cat} (${list.length} items)`);
        list.forEach(i => {
            console.log(`- **${i.name}** | Price: ${i.price} ج.م | Desc: ${i.description || 'N/A'}`);
        });
    }
}

dumpGrillsAndMeals();
