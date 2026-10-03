import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function fullAudit() {
    console.log('=== FULL MENU AUDIT & BUSINESS DISCOVERY ===\n');

    // 1. Fetch categories
    const { data: categories, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

    console.log(`1. Total Categories: ${categories?.length}`);
    categories?.forEach(c => console.log(`   - [${c.id}] ${c.name} (slug: ${c.slug}, order: ${c.display_order})`));

    // 2. Fetch all menu items
    const { data: items, error: itemErr } = await supabase
        .from('menu_items')
        .select(`
            id,
            name,
            price,
            description,
            category_id,
            status,
            unit_type,
            base_qty,
            display_order,
            categories(name, slug)
        `)
        .order('display_order', { ascending: true });

    console.log(`\n2. Total Menu Items: ${items?.length}`);

    // Group items by category
    const byCategory = {};
    items?.forEach(item => {
        const catName = item.categories?.name || 'بدون تصنيف';
        if (!byCategory[catName]) byCategory[catName] = [];
        byCategory[catName].push(item);
    });

    for (const [catName, catItems] of Object.entries(byCategory)) {
        console.log(`\n================== Category: ${catName} (${catItems.length} items) ==================`);
        catItems.forEach(i => {
            console.log(`- [${i.id}] "${i.name}" | Price: ${i.price} | Status: ${i.status} | Desc: ${i.description || '(none)'}`);
        });
    }

    // 3. Specifically inspect "وجبة الشرقي" and related items
    console.log('\n=== INSPECTING "وجبة الشرقي" BUG ===');
    const sharqiMatches = items?.filter(i => i.name.includes('الشرقي') || i.name.includes('شرقي'));
    console.log('Matches for الشرقي:', sharqiMatches);

    // Look at leading/trailing spaces or ID issues
    sharqiMatches?.forEach(m => {
        console.log(`ID: "${m.id}", Name: "${m.name}", Name char codes:`, [...m.name].map(c => c.charCodeAt(0)));
    });
}

fullAudit();
