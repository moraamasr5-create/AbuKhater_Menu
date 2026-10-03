import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function fullAudit() {
    const { data: items } = await supabase
        .from('menu_items')
        .select(`
            id,
            name,
            price,
            status,
            category_id,
            categories(name),
            menu_item_variants(*),
            menu_item_option_groups(*, menu_item_options(*))
        `)
        .neq('status', 'hidden')
        .order('display_order');

    console.log(`Auditing all ${items.length} active items in SSOT...\n`);

    const fullInventory = items.map(item => {
        const variants = (item.menu_item_variants || []).filter(v => v.is_available !== false);
        const optionGroups = (item.menu_item_option_groups || []).filter(g => (g.menu_item_options || []).some(o => o.is_available !== false));

        const isConfigurable = variants.length > 0 || optionGroups.length > 0;

        return {
            id: item.id,
            name: item.name.trim(),
            category: item.categories?.name || 'عام',
            price: item.price,
            is_configurable: isConfigurable,
            expected_cta: isConfigurable ? 'اختر التخصيص' : '+ إضافة للطلب',
            expected_behavior: isConfigurable ? 'فتح DishDetailModal لاختيار الحجم/الخيارات' : 'إضافة مباشرة للسلة',
            variants: variants.map(v => ({ id: v.id, name: v.name, price: v.price })),
            option_groups: optionGroups.map(g => ({
                id: g.id,
                name: g.name,
                required: g.required,
                options: (g.menu_item_options || []).map(o => ({ id: o.id, name: o.name, price_delta: o.price_delta }))
            }))
        };
    });

    const configurableCount = fullInventory.filter(i => i.is_configurable).length;
    const simpleCount = fullInventory.filter(i => !i.is_configurable).length;

    console.log(`Total Active Products: ${fullInventory.length}`);
    console.log(`Configurable Products (Active in DB): ${configurableCount}`);
    console.log(`Simple Products (Active in DB): ${simpleCount}`);

    fs.writeFileSync('scratch/full_inventory_result.json', JSON.stringify(fullInventory, null, 2));
    console.log('\nFull detailed inventory saved to scratch/full_inventory_result.json');
}

fullAudit();
