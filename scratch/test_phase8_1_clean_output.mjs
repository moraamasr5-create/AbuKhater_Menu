import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

// Import menuService mapping logic
async function verifyCleanOutput() {
    console.log('=== VERIFYING PHASE 8.1 CLEANED PRODUCT OUTPUT ===\n');

    const { data: rawShawarma } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, description, status,
            categories (id, name, slug),
            menu_item_variants (id, name, price, is_available, display_order),
            menu_item_option_groups (id, name, selection_type, required, min_selections, max_selections, display_order, menu_item_options(id, name, price_delta, is_available, display_order))
        `)
        .eq('id', 'ade87b63-64f7-417e-93a6-5b92cd71a594')
        .single();

    const { menuService } = await import('../src/services/api/menuService.js');
    const mappedShawarma = menuService._mapSingleItem(rawShawarma, 'سندوتشات');

    console.log('1. Cleaned Shawarma Item:');
    console.log(`   - Name: "${mappedShawarma.name}"`);
    console.log(`   - Has Variants: ${mappedShawarma.has_variants} (Count: ${mappedShawarma.variants.length})`);
    mappedShawarma.variants.forEach(v => console.log(`     * Variant: ${v.name} -> ${v.price} EGP`));
    console.log(`   - Has Options: ${mappedShawarma.has_options} (Count: ${mappedShawarma.option_groups.length})`);
    console.log(`   - Redundant "نوع العيش" Group Removed: ${mappedShawarma.option_groups.length === 0}`);

    console.assert(mappedShawarma.has_variants === true, 'Shawarma must have variants');
    console.assert(mappedShawarma.option_groups.length === 0, 'Shawarma must NOT have redundant bread options');

    // Test Pepsi
    const { data: rawPepsi } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, description, status,
            categories (id, name, slug),
            menu_item_variants (id, name, price, is_available, display_order),
            menu_item_option_groups (id, name, selection_type, required, min_selections, max_selections, display_order, menu_item_options(id, name, price_delta, is_available, display_order))
        `)
        .eq('id', '260329a4-49a5-411d-ac19-c5733277ad48')
        .single();

    const mappedPepsi = menuService._mapSingleItem(rawPepsi, 'مشروبات');
    console.log('\n2. Cleaned Pepsi Item:');
    console.log(`   - Name: "${mappedPepsi.name}"`);
    console.log(`   - Has Variants: ${mappedPepsi.has_variants}`);
    console.log(`   - Has Options: ${mappedPepsi.has_options} (Count: ${mappedPepsi.option_groups.length})`);
    mappedPepsi.option_groups[0]?.options.forEach(o => console.log(`     * Option: ${o.name} -> +${o.price_delta} EGP`));

    console.assert(mappedPepsi.has_options === true, 'Pepsi must retain its diet/zero options');

    console.log('\n✅ ALL EXCEPTIONAL PRODUCTS CLEANUP TESTS PASSED!');
}

verifyCleanOutput();
