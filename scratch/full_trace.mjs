import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function fullTrace() {
    console.log('=== LAYER 1: DATABASE TRACE ===');
    // Check categories
    const { data: categories } = await supabase.from('categories').select('*').order('display_order');
    console.log('Categories in DB:', categories);

    // Check shw variants
    const { data: shwVariants } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', 'ade87b63-64f7-417e-93a6-5b92cd71a594');
    console.log('Shawarma variants in DB:', shwVariants);

    // Check all menu_items with neq status hidden
    const { data: activeItems, error: itemsErr } = await supabase
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

    console.log('\n=== LAYER 2: FETCH & QUERY TRACE ===');
    console.log(`Active items fetched count: ${activeItems?.length}`);
    const shwActive = activeItems?.filter(i => i.name.includes('شاورما فراخ'));
    console.log('Active "شاورما فراخ" items in query result:', shwActive);

    // Check if there are other items with status 'available' that have old names
    console.log('\n=== LAYER 3: CATEGORY MAPPING TRACE ===');
    const catKeys = new Set();
    activeItems?.forEach(i => {
        const catName = i.categories?.name;
        const catSlug = i.categories?.slug;
        catKeys.add(`name: "${catName}" | slug: "${catSlug}"`);
    });
    console.log('Category keys present in active items:', Array.from(catKeys));
}

fullTrace();
