import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function validateEverything() {
    console.log('=== RIGOROUS READ-ONLY VALIDATION PASS ===\n');

    // 1. All items
    const { data: allItems } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id, categories(id, name, slug)')
        .order('display_order');

    const totalCount = allItems.length;
    const activeCount = allItems.filter(i => i.status !== 'hidden').length;
    const hiddenCount = allItems.filter(i => i.status === 'hidden').length;

    console.log(`1. Total rows in menu_items: ${totalCount}`);
    console.log(`   - Active rows: ${activeCount}`);
    console.log(`   - Hidden rows: ${hiddenCount}`);

    // Check category distribution of active rows
    const catDist = {};
    allItems.filter(i => i.status !== 'hidden').forEach(i => {
        const cat = i.categories?.name || 'Uncategorized';
        catDist[cat] = (catDist[cat] || 0) + 1;
    });

    console.log('\nActive Items per Category:');
    for (const [cat, count] of Object.entries(catDist)) {
        console.log(`   - ${cat}: ${count} items`);
    }

    // Check dynamic price strings
    console.log('\n2. Dynamic / Market Price Search in DB:');
    const dynamicCandidates = allItems.filter(i => {
        const str = `${i.name} ${i.description || ''}`.toLowerCase();
        return str.includes('يوم') || str.includes('سعر') || str.includes('متغير') || str.includes('حسب');
    });
    console.log(`   Found ${dynamicCandidates.length} items with price/day keywords:`);
    dynamicCandidates.forEach(i => console.log(`   - [${i.id}] "${i.name}" (Price: ${i.price}) | Desc: "${i.description}"`));

    // Check all variants currently in DB
    const { data: variants } = await supabase.from('menu_item_variants').select('*');
    console.log(`\n3. Total Variants in menu_item_variants: ${variants.length}`);
    variants.forEach(v => console.log(`   - Item: ${v.menu_item_id} | ${v.name} -> ${v.price} EGP`));

    // Check all option groups currently in DB
    const { data: optionGroups } = await supabase.from('menu_item_option_groups').select('*, menu_item_options(*)');
    console.log(`\n4. Total Option Groups in menu_item_option_groups: ${optionGroups.length}`);
    optionGroups.forEach(g => {
        console.log(`   - Item: ${g.menu_item_id} | Group: "${g.name}" (${g.menu_item_options?.length} options)`);
        g.menu_item_options?.forEach(o => console.log(`       * ${o.name}: +${o.price_delta} EGP`));
    });
}

validateEverything();
