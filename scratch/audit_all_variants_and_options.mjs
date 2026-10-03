import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function fullAudit() {
    console.log('=== FULL AUDIT OF ALL PRODUCTS WITH VARIANTS & OPTIONS ===\n');

    // 1. All Option Groups in DB
    const { data: allGroups, error: grpErr } = await supabase
        .from('menu_item_option_groups')
        .select(`
            id,
            menu_item_id,
            name,
            selection_type,
            required,
            menu_items (id, name, price, status, categories(name)),
            menu_item_options (id, name, price_delta, is_available)
        `);

    if (grpErr) throw grpErr;

    console.log(`Found ${allGroups.length} Option Groups in Database:\n`);
    for (const g of allGroups) {
        console.log(`--------------------------------------------------`);
        console.log(`PRODUCT: "${g.menu_items?.name}" [${g.menu_items?.categories?.name}]`);
        console.log(`PRODUCT UUID: ${g.menu_item_id}`);
        console.log(`OPTION GROUP: "${g.name}" (Required: ${g.required}, Type: ${g.selection_type}) | Group ID: ${g.id}`);
        console.log(`OPTIONS:`);
        g.menu_item_options?.forEach(o => {
            console.log(`   - "${o.name}" (Delta: +${o.price_delta} EGP) | Opt ID: ${o.id}`);
        });

        // Also fetch variants for this product
        const { data: vars } = await supabase
            .from('menu_item_variants')
            .select('id, name, price, is_available')
            .eq('menu_item_id', g.menu_item_id);

        console.log(`VARIANTS FOR THIS PRODUCT:`);
        if (vars && vars.length > 0) {
            vars.forEach(v => console.log(`   * "${v.name}" (${v.price} EGP)`));
        } else {
            console.log(`   * None`);
        }
    }

    // 2. All products with Variants in DB
    console.log(`\n\n==================================================`);
    console.log(`ALL PRODUCTS WITH VARIANTS IN DB:`);
    console.log(`==================================================`);
    const { data: allVars } = await supabase
        .from('menu_item_variants')
        .select(`
            id,
            menu_item_id,
            name,
            price,
            menu_items (id, name, price, status, categories(name))
        `);

    const byItem = {};
    allVars?.forEach(v => {
        const pId = v.menu_item_id;
        if (!byItem[pId]) byItem[pId] = { item: v.menu_items, variants: [] };
        byItem[pId].variants.push(v);
    });

    for (const [pId, obj] of Object.entries(byItem)) {
        console.log(`\nProduct: "${obj.item?.name}" [${obj.item?.categories?.name}] (UUID: ${pId})`);
        obj.variants.forEach(v => console.log(`   - "${v.name}" -> ${v.price} EGP`));
    }
}

fullAudit();
