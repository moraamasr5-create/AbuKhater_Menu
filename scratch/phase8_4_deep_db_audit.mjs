import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function deepAudit() {
    console.log('=== DEEP SSOT AUDIT OF ALL TABLES IN SUPABASE ===\n');

    // 1. All rows in menu_item_variants
    const { data: allVariants, error: varErr } = await supabase
        .from('menu_item_variants')
        .select('*');
    
    if (varErr) {
        console.error('Error fetching variants:', varErr);
        return;
    }

    console.log(`1. Total rows in menu_item_variants table: ${allVariants.length}`);
    const distinctItemIdsInVariants = [...new Set(allVariants.map(v => v.menu_item_id))];
    console.log(`   - Distinct menu_items referenced in variants: ${distinctItemIdsInVariants.length}`);

    // Group variants by menu_item_id
    const variantsByItemId = {};
    allVariants.forEach(v => {
        if (!variantsByItemId[v.menu_item_id]) variantsByItemId[v.menu_item_id] = [];
        variantsByItemId[v.menu_item_id].push(v);
    });

    // 2. All rows in menu_item_option_groups & options
    const { data: allOptionGroups, error: grpErr } = await supabase
        .from('menu_item_option_groups')
        .select('*, menu_item_options(*)');

    if (grpErr) {
        console.error('Error fetching option groups:', grpErr);
        return;
    }

    console.log(`\n2. Total rows in menu_item_option_groups table: ${allOptionGroups.length}`);
    const distinctItemIdsInGroups = [...new Set(allOptionGroups.map(g => g.menu_item_id))];
    console.log(`   - Distinct menu_items referenced in option groups: ${distinctItemIdsInGroups.length}`);

    // Group option groups by menu_item_id
    const groupsByItemId = {};
    allOptionGroups.forEach(g => {
        if (!groupsByItemId[g.menu_item_id]) groupsByItemId[g.menu_item_id] = [];
        groupsByItemId[g.menu_item_id].push(g);
    });

    // 3. Active menu_items
    const { data: activeItems } = await supabase
        .from('menu_items')
        .select('id, name, price, status, category_id, categories(name)')
        .neq('status', 'hidden')
        .order('display_order');

    console.log(`\n3. Total active items in menu_items: ${activeItems.length}`);

    console.log('\n=== LISTING ALL ITEMS THAT HAVE VARIANTS IN SUPABASE ===');
    distinctItemIdsInVariants.forEach((itemId, idx) => {
        const item = activeItems.find(i => i.id === itemId);
        const vars = variantsByItemId[itemId] || [];
        console.log(`${idx + 1}. [${itemId}] "${item?.name || 'UNKNOWN'}" (${item?.categories?.name || 'N/A'}): ${vars.length} variants`);
        vars.forEach(v => console.log(`     - "${v.name}" -> ${v.price} EGP (Available: ${v.is_available})`));
    });

    console.log('\n=== LISTING ALL ITEMS THAT HAVE OPTION GROUPS IN SUPABASE ===');
    distinctItemIdsInGroups.forEach((itemId, idx) => {
        const item = activeItems.find(i => i.id === itemId);
        const grps = groupsByItemId[itemId] || [];
        console.log(`${idx + 1}. [${itemId}] "${item?.name || 'UNKNOWN'}" (${item?.categories?.name || 'N/A'}): ${grps.length} groups`);
        grps.forEach(g => {
            console.log(`     - Group "${g.name}" (Required: ${g.required}, Selection: ${g.selection_type}): ${g.menu_item_options?.length || 0} options`);
            g.menu_item_options?.forEach(o => console.log(`         * "${o.name}" (+${o.price_delta} EGP)`));
        });
    });

    // 4. Check items mentioned by user (شاورما لحمة, فاهيتا فراخ, بانية, برجر بالبيض, كبدة جريل)
    console.log('\n=== CHECKING SPECIFIC ITEMS IN SUPABASE DB ===');
    const checkNames = ['شاورما لحمة', 'شاورما لحم', 'فاهيتا فراخ', 'بانية', 'برجر بالبيض', 'برجر بالبيض والجبنة', 'فراخ بانية', 'كبدة جريل', 'كبد وقوانص', 'سجق اسكندراني', 'هوت دوج'];
    checkNames.forEach(name => {
        const matches = activeItems.filter(i => i.name.includes(name));
        matches.forEach(m => {
            const vars = variantsByItemId[m.id] || [];
            const grps = groupsByItemId[m.id] || [];
            console.log(`- Item [${m.id}] "${m.name}" (${m.categories?.name}) | Price: ${m.price} EGP | Variants in DB: ${vars.length} | Option Groups in DB: ${grps.length}`);
        });
    });
}

deepAudit();
