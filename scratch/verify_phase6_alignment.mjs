import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function verifyPhase6DataAlignment() {
    console.log('=== VERIFYING PHASE 6 DATA ALIGNMENT ===\n');

    // 1. Check Category 'الصواريخ'
    const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('id', 'e5e95a54-bf70-4aa1-9ab7-11a83e4d8553')
        .single();
    console.log(`1. Category name for e5e95a54: "${cat?.name}" (Expected: "الصواريخ")`);

    // 2. Check Shawarma variants
    const { data: shwVariants } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', 'ade87b63-64f7-417e-93a6-5b92cd71a594')
        .order('display_order');
    console.log(`\n2. شاورما فراخ Variants (${shwVariants?.length}):`);
    shwVariants?.forEach(v => console.log(`   - ${v.name}: ${v.price} EGP`));

    // 3. Check Broast meal variants
    const { data: broastVariants } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', '6e55a581-17c4-4d56-a88a-252756803ef3')
        .order('display_order');
    console.log(`\n3. وجبة بروست Variants (${broastVariants?.length}):`);
    broastVariants?.forEach(v => console.log(`   - ${v.name}: ${v.price} EGP`));

    // 4. Check Shish chicken variants
    const { data: shishVariants } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', '47329087-a3ed-4663-9984-2c9c531d9f0c')
        .order('display_order');
    console.log(`\n4. فرخة شيش Variants (${shishVariants?.length}):`);
    shishVariants?.forEach(v => console.log(`   - ${v.name}: ${v.price} EGP`));

    // 5. Check hidden status of deprecated duplicate rows
    const hiddenIds = [
        'c04b8c24-2edd-40cc-adf1-033c6d5e9668',
        'a8adc1e6-27d9-40bd-b4d0-17394bbf2559',
        'c0f4ca81-754f-4001-ba24-4b399874c0be',
        'f8c3c907-bcbf-4fa0-b0b1-d106c9c3edbc',
        'ecc83143-3822-434a-a075-0f05c4a2d34f',
        'f9618b3f-dcf6-48fc-8a3a-3895cf08cb0b',
        '589ce660-5420-4021-82d5-bc7747177197',
        '4812b0b7-560c-4cbe-8728-e697fd8d1e51',
        '69202494-866a-48b1-9316-47bba61d69c1',
        '2d4a9101-a0b5-4d0e-8878-bc8525f98dbf'
    ];

    const { data: hiddenRows } = await supabase
        .from('menu_items')
        .select('id, name, status')
        .in('id', hiddenIds);

    const allHidden = hiddenRows?.every(r => r.status === 'hidden');
    console.log(`\n5. Deprecated duplicate rows status: ${allHidden ? '✅ ALL HIDDEN (Preserved for History)' : '⏳ PENDING MIGRATION'}`);

    // 6. Check Active menu items count
    const { count } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'hidden');
    console.log(`\n6. Active Public Menu Items: ${count}`);
}

verifyPhase6DataAlignment();
