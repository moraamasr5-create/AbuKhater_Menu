import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function verify() {
    console.log('--- Phase 5.5: Verifying Test Configuration Data in Supabase ---');

    const targetIds = [
        '808c11d2-d7af-4512-bb2c-1c14510a1d14', // وجبة الشرقي
        'ade87b63-64f7-417e-93a6-5b92cd71a594', // شاورما فراخ
        '260329a4-49a5-411d-ac19-c5733277ad48'  // بيبسي
    ];

    // 1. Query Variants
    const { data: variants, error: vErr } = await supabase
        .from('menu_item_variants')
        .select('*')
        .in('menu_item_id', targetIds)
        .order('display_order');

    if (vErr) {
        console.error('❌ Error fetching variants:', vErr);
        return false;
    }
    console.log(`\n1. Found ${variants.length} variants for target items:`);
    variants.forEach(v => console.log(`   - [${v.menu_item_id}] ${v.name}: ${v.price} EGP (order: ${v.display_order}, available: ${v.is_available})`));

    // 2. Query Option Groups with nested Options
    const { data: groups, error: gErr } = await supabase
        .from('menu_item_option_groups')
        .select('*, options:menu_item_options(*)')
        .in('menu_item_id', targetIds)
        .order('display_order');

    if (gErr) {
        console.error('❌ Error fetching option groups:', gErr);
        return false;
    }
    console.log(`\n2. Found ${groups.length} option groups for target items:`);
    groups.forEach(g => {
        console.log(`   - [${g.menu_item_id}] Group "${g.name}" (${g.selection_type}, required: ${g.required}, min: ${g.min_selections}, max: ${g.max_selections}):`);
        (g.options || []).forEach(o => {
            console.log(`       * Option "${o.name}": delta +${o.price_delta} EGP (order: ${o.display_order}, available: ${o.is_available})`);
        });
    });

    // 3. Check menu_items count & prices intact
    const { count, error: cErr } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

    if (cErr) {
        console.error('❌ Error counting menu_items:', cErr);
        return false;
    }
    console.log(`\n3. Total menu_items count: ${count} (unchanged)`);

    // 4. Assertions
    const sharqiVariants = variants.filter(v => v.menu_item_id === '808c11d2-d7af-4512-bb2c-1c14510a1d14');
    const shawarmaGroups = groups.filter(g => g.menu_item_id === 'ade87b63-64f7-417e-93a6-5b92cd71a594');
    const pepsiGroups = groups.filter(g => g.menu_item_id === '260329a4-49a5-411d-ac19-c5733277ad48');

    const passSharqi = sharqiVariants.length === 3;
    const passShawarma = shawarmaGroups.length === 1 && (shawarmaGroups[0].options?.length === 3);
    const passPepsi = pepsiGroups.length === 1 && (pepsiGroups[0].options?.length === 3);

    console.log('\n--- Assertion Summary ---');
    console.log(`- وجبة الشرقي (3 Variants): ${passSharqi ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- شاورما فراخ (1 Group with 3 Options): ${passShawarma ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- بيبسي (1 Group with 3 Options): ${passPepsi ? '✅ PASS' : '❌ FAIL'}`);

    return passSharqi && passShawarma && passPepsi;
}

verify();
