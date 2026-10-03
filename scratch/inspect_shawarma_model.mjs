import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function inspectShawarmaAndOthers() {
    console.log('=== INSPECTING SHAWARMA CHICKEN & ALL CONFIGURABLE ITEMS ===\n');

    const { data: item } = await supabase
        .from('menu_items')
        .select(`
            id, name, price,
            menu_item_variants(*),
            menu_item_option_groups(*, menu_item_options(*))
        `)
        .eq('id', 'ade87b63-64f7-417e-93a6-5b92cd71a594')
        .single();

    console.log(`Product: [${item.id}] "${item.name}" (Base Price: ${item.price} EGP)`);
    console.log('Variants in DB:');
    (item.menu_item_variants || []).forEach(v => {
        console.log(`  - ID: ${v.id} | Name: "${v.name}" | Price: ${v.price} EGP | Available: ${v.is_available} | Order: ${v.display_order}`);
    });

    console.log('\nOption Groups in DB:');
    (item.menu_item_option_groups || []).forEach(g => {
        console.log(`  - Group ID: ${g.id} | Name: "${g.name}" | Required: ${g.required} | SelectionType: ${g.selection_type}`);
        (g.menu_item_options || []).forEach(o => {
            console.log(`      * Option ID: ${o.id} | Name: "${o.name}" | Delta: +${o.price_delta} EGP | Available: ${o.is_available}`);
        });
    });
}

inspectShawarmaAndOthers();
