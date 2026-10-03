import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function testPhase81() {
    console.log('===========================================================');
    console.log('🧪 PHASE 8.1: EXCEPTIONAL PRODUCTS AUDIT & VERIFICATION');
    console.log('===========================================================\n');

    // 1. Fetch Shawarma
    const { data: shawarma } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, description, status,
            categories (id, name, slug),
            menu_item_variants (id, name, price, is_available, display_order),
            menu_item_option_groups (id, name, selection_type, required, min_selections, max_selections, display_order, menu_item_options(id, name, price_delta, is_available, display_order))
        `)
        .eq('id', 'ade87b63-64f7-417e-93a6-5b92cd71a594')
        .single();

    console.log('1. شاورما فراخ (ade87b63-64f7-417e-93a6-5b92cd71a594):');
    console.log(`   - Variants found: ${shawarma.menu_item_variants?.length}`);
    shawarma.menu_item_variants?.forEach(v => console.log(`     * ${v.name} -> ${v.price} EGP`));

    // 2. Fetch Pepsi
    const { data: pepsi } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, description, status,
            categories (id, name, slug),
            menu_item_variants (id, name, price, is_available, display_order),
            menu_item_option_groups (id, name, selection_type, required, min_selections, max_selections, display_order, menu_item_options(id, name, price_delta, is_available, display_order))
        `)
        .eq('id', '260329a4-49a5-411d-ac19-c5733277ad48')
        .single();

    console.log('\n2. بيبسي (260329a4-49a5-411d-ac19-c5733277ad48):');
    console.log(`   - Option Group: "${pepsi.menu_item_option_groups?.[0]?.name}"`);
    pepsi.menu_item_option_groups?.[0]?.menu_item_options?.forEach(o => console.log(`     * ${o.name} -> +${o.price_delta} EGP`));

    // 3. Fetch Burger
    const { data: burger } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, description, status,
            categories (id, name, slug),
            menu_item_variants (id, name, price, is_available, display_order)
        `)
        .eq('id', '1e772dbd-643c-4d2a-af71-6cf0666d0b60')
        .single();

    console.log('\n3. برجر سادة (1e772dbd-643c-4d2a-af71-6cf0666d0b60):');
    burger.menu_item_variants?.forEach(v => console.log(`     * ${v.name} -> ${v.price} EGP`));

    console.log('\n===========================================================');
    console.log('✅ PHASE 8.1 VERIFICATION COMPLETE');
    console.log('===========================================================');
}

testPhase81();
