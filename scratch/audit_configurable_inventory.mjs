import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function auditInventory() {
    console.log('====================================================');
    console.log('🔍 AUDITING FULL MENU INVENTORY FOR CONFIGURABILITY');
    console.log('====================================================\n');

    // Fetch exactly as menuService does
    const { data: items, error } = await supabase
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
        console.error(error);
        return;
    }

    console.log(`Total Active Items in DB: ${items.length}\n`);

    const configurable = [];
    const simple = [];

    items.forEach(item => {
        const variants = (item.menu_item_variants || []).filter(v => v.is_available !== false);
        const optionGroups = item.menu_item_option_groups || [];
        
        const hasVariants = variants.length > 0;
        const hasOptionGroups = optionGroups.length > 0;
        const isConfigurable = hasVariants || hasOptionGroups;

        const info = {
            id: item.id,
            name: item.name,
            category: item.categories?.name,
            price: item.price,
            variants_count: variants.length,
            variants: variants.map(v => `${v.name} (${v.price} ج)`),
            option_groups_count: optionGroups.length,
            option_groups: optionGroups.map(g => `${g.name} (${g.menu_item_options?.length || 0} opts)`)
        };

        if (isConfigurable) {
            configurable.push(info);
        } else {
            simple.push(info);
        }
    });

    console.log(`=== CONFIGURABLE PRODUCTS (${configurable.length}) ===`);
    configurable.forEach((c, idx) => {
        console.log(`${idx + 1}. [${c.category}] "${c.name}" (Base: ${c.price} ج)`);
        if (c.variants.length) console.log(`   - Variants (${c.variants.length}): ${c.variants.join(', ')}`);
        if (c.option_groups.length) console.log(`   - Option Groups (${c.option_groups.length}): ${c.option_groups.join(', ')}`);
    });

    console.log(`\n=== SIMPLE PRODUCTS (${simple.length}) ===`);
    simple.slice(0, 15).forEach((s, idx) => {
        console.log(`${idx + 1}. [${s.category}] "${s.name}" -> ${s.price} ج`);
    });
    if (simple.length > 15) {
        console.log(`... and ${simple.length - 15} more simple products.`);
    }

    console.log('\n====================================================');
    console.log(`Summary: ${configurable.length} Configurable, ${simple.length} Simple (Total: ${items.length})`);
    console.log('====================================================');
}

auditInventory();
