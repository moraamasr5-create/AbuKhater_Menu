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
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Fetched ${data.length} active menu items from Supabase.`);
    const withVariants = data.filter(i => i.menu_item_variants?.length > 0);
    const withOptions = data.filter(i => i.menu_item_option_groups?.length > 0);
    console.log(`Items with variants: ${withVariants.length}`);
    console.log(`Items with options: ${withOptions.length}`);
}

testFetch();
