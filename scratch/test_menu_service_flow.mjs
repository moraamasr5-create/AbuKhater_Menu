import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function testMenuServiceFlow() {
    console.log('--- Testing API Layer & Menu Service integration ---');
    const { data: items, error } = await supabase
        .from('menu_items')
        .select(`
            id,
            name,
            price,
            image,
            category_id,
            status,
            display_order,
            is_popular,
            category:categories(id, name, slug, display_order),
            variants:menu_item_variants(
                id,
                name,
                price,
                display_order,
                is_available
            ),
            option_groups:menu_item_option_groups(
                id,
                name,
                selection_type,
                required,
                min_selections,
                max_selections,
                display_order,
                options:menu_item_options(
                    id,
                    name,
                    price_delta,
                    display_order,
                    is_available
                )
            )
        `)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('❌ Menu query error:', error);
        return;
    }

    const transformed = items.map(item => {
        const variants = (item.variants || [])
            .filter(v => v.is_available !== false)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

        const optionGroups = (item.option_groups || [])
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map(group => ({
                ...group,
                options: (group.options || [])
                    .filter(o => o.is_available !== false)
                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            }));

        return {
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            variants,
            option_groups: optionGroups,
            has_variants: variants.length > 0,
            has_options: optionGroups.length > 0,
            has_configuration: variants.length > 0 || optionGroups.length > 0
        };
    });

    const sharqi = transformed.find(i => i.id === '808c11d2-d7af-4512-bb2c-1c14510a1d14');
    const shawarma = transformed.find(i => i.id === 'ade87b63-64f7-417e-93a6-5b92cd71a594');
    const pepsi = transformed.find(i => i.id === '260329a4-49a5-411d-ac19-c5733277ad48');

    console.log('\n وجبة الشرقي in API:', JSON.stringify(sharqi, null, 2));
    console.log('\n شاورما فراخ in API:', JSON.stringify(shawarma, null, 2));
    console.log('\n بيبسي in API:', JSON.stringify(pepsi, null, 2));
}

testMenuServiceFlow();
