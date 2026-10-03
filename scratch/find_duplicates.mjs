import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function inspectAllDuplicates() {
    const { data: items } = await supabase
        .from('menu_items')
        .select(`
            id,
            name,
            price,
            description,
            category_id,
            status,
            categories(id, name, slug)
        `)
        .order('name');

    console.log(`Total items loaded: ${items.length}`);

    // Group items by normalized base name to detect duplicates
    const nameMap = {};
    items.forEach(item => {
        const cleanName = item.name.trim();
        if (!nameMap[cleanName]) nameMap[cleanName] = [];
        nameMap[cleanName].push(item);
    });

    console.log('\n--- Duplicate Names Detected in menu_items ---');
    for (const [name, list] of Object.entries(nameMap)) {
        if (list.length > 1) {
            console.log(`\nName: "${name}" (${list.length} rows):`);
            list.forEach(i => {
                console.log(`  - ID: ${i.id} | Price: ${i.price} | Category: ${i.categories?.name} | Desc: "${i.description}"`);
            });
        }
    }
}

inspectAllDuplicates();
