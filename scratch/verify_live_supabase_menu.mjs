import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function testFetch() {
    const { data, error } = await supabase
        .from('menu_items')
        .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            unit_type,
            base_qty,
            status,
            is_popular,
            display_order,
            categories (
                id,
                name,
                slug,
                display_order
            ),
            menu_item_variants (
                id,
                name,
                price,
                is_available,
                display_order
            ),
            menu_item_option_groups (
                id,
                name,
                selection_type,
                required,
                min_selections,
                max_selections,
                display_order,
                menu_item_options (
                    id,
                    name,
                    price_delta,
                    is_available,
                    display_order
                )
            )
        `)
        .neq('status', 'hidden')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching menu:', error);
        return;
    }

    const sharqi = data.find(i => i.id === '808c11d2-d7af-4512-bb2c-1c14510a1d14');
    const shawarma = data.find(i => i.id === 'ade87b63-64f7-417e-93a6-5b92cd71a594');
    const pepsi = data.find(i => i.id === '260329a4-49a5-411d-ac19-c5733277ad48');

    console.log('✅ Supabase Menu Query Live Verification:');
    console.log(`- Total items fetched: ${data.length}`);
    console.log('\n1. وجبة الشرقي:');
    console.log('   Variants count:', sharqi.menu_item_variants.length);
    sharqi.menu_item_variants.forEach(v => console.log(`     * ${v.name}: ${v.price} EGP`));

    console.log('\n2. شاورما فراخ:');
    console.log('   Option groups count:', shawarma.menu_item_option_groups.length);
    shawarma.menu_item_option_groups.forEach(g => {
        console.log(`     * Group "${g.name}" (${g.selection_type}, required: ${g.required}):`);
        g.menu_item_options.forEach(o => console.log(`         - ${o.name} (+${o.price_delta} EGP)`));
    });

    console.log('\n3. بيبسي:');
    console.log('   Option groups count:', pepsi.menu_item_option_groups.length);
    pepsi.menu_item_option_groups.forEach(g => {
        console.log(`     * Group "${g.name}" (${g.selection_type}, required: ${g.required}):`);
        g.menu_item_options.forEach(o => console.log(`         - ${o.name} (+${o.price_delta} EGP)`));
    });
}

testFetch();
