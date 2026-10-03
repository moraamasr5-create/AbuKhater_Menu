import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function executePhase1() {
    console.log('=== EXECUTING PHASE 1 DATA MIGRATION ===\n');

    // 1. Variant Mappings for the 8 Duplicate Rows:
    const variantMappings = [
        // 1. شاورما لحمة (Canonical: bcfe5b69-143b-4954-8738-99692f941151)
        { canonical_id: 'bcfe5b69-143b-4954-8738-99692f941151', variant_name: 'كيزر', price: 60, duplicate_id: '09cf1eb1-46c9-4af4-9568-695ccf721280', order: 1 },
        { canonical_id: 'bcfe5b69-143b-4954-8738-99692f941151', variant_name: 'فينو وسط', price: 70, duplicate_id: null, order: 2 },
        { canonical_id: 'bcfe5b69-143b-4954-8738-99692f941151', variant_name: 'فينو كبير', price: 80, duplicate_id: null, order: 3 },
        { canonical_id: 'bcfe5b69-143b-4954-8738-99692f941151', variant_name: 'عيش سوري', price: 90, duplicate_id: null, order: 4 },

        // 2. شيش طاووق ساندوتش (Canonical: 98a7e3e8-ba5b-4698-8671-0f5a272b63f9)
        { canonical_id: '98a7e3e8-ba5b-4698-8671-0f5a272b63f9', variant_name: 'وسط', price: 60, duplicate_id: null, order: 1 },
        { canonical_id: '98a7e3e8-ba5b-4698-8671-0f5a272b63f9', variant_name: 'كبير', price: 70, duplicate_id: 'bc58760f-c491-462f-9e02-8abaa48e7c79', order: 2 },

        // 3. فاهيتا فراخ ساندوتش (Canonical: c252b00e-c274-4ecd-9f92-e420f8342c36)
        { canonical_id: 'c252b00e-c274-4ecd-9f92-e420f8342c36', variant_name: 'وسط', price: 80, duplicate_id: '4cc70f73-519f-4e6f-8790-85e5750d05be', order: 1 },
        { canonical_id: 'c252b00e-c274-4ecd-9f92-e420f8342c36', variant_name: 'كبير', price: 100, duplicate_id: '47e3941e-c5de-4e22-b231-5bbb3d425c6c', order: 2 },

        // 4. استربس ساندوتش (Canonical: 0af5f68c-5d32-487c-a049-c10d1c425eda)
        { canonical_id: '0af5f68c-5d32-487c-a049-c10d1c425eda', variant_name: 'وسط', price: 40, duplicate_id: null, order: 1 },
        { canonical_id: '0af5f68c-5d32-487c-a049-c10d1c425eda', variant_name: 'كبير', price: 55, duplicate_id: '191497fb-1640-4fd0-9c0e-0ddc909f61e7', order: 2 },

        // 5. كرسبي ساندوتش (Canonical: b13ed3d9-28ec-46a1-b845-8bcb72a1a55c)
        { canonical_id: 'b13ed3d9-28ec-46a1-b845-8bcb72a1a55c', variant_name: 'وسط', price: 35, duplicate_id: null, order: 1 },
        { canonical_id: 'b13ed3d9-28ec-46a1-b845-8bcb72a1a55c', variant_name: 'كبير', price: 50, duplicate_id: '6674af39-ed86-4abf-8599-1e389a45afaf', order: 2 },

        // 6. هوت دوج ساندوتش (Canonical: b4f7b016-042b-46b3-b0b5-4f96438e2ee9)
        { canonical_id: 'b4f7b016-042b-46b3-b0b5-4f96438e2ee9', variant_name: 'عادي', price: 35, duplicate_id: 'a76d176a-e83c-49e7-9a7a-61800d2b8809', order: 1 },

        // 7. لحم نعام مشوي (Canonical: 45000ac7-52eb-4c81-bdbc-9807dfbd6929)
        { canonical_id: '45000ac7-52eb-4c81-bdbc-9807dfbd6929', variant_name: 'ثمن', price: 200, duplicate_id: null, order: 1 },
        { canonical_id: '45000ac7-52eb-4c81-bdbc-9807dfbd6929', variant_name: 'ربع', price: 400, duplicate_id: 'c53e6ec4-8d0a-4e67-a8fe-0ffd624c130d', order: 2 },
        { canonical_id: '45000ac7-52eb-4c81-bdbc-9807dfbd6929', variant_name: 'نصف', price: 800, duplicate_id: null, order: 3 }
    ];

    console.log('1. Inserting / verifying variants in menu_item_variants...');
    for (const v of variantMappings) {
        // Check if variant exists
        const { data: existing } = await supabase
            .from('menu_item_variants')
            .select('id')
            .eq('menu_item_id', v.canonical_id)
            .eq('name', v.variant_name);

        if (!existing || existing.length === 0) {
            const { error: insErr } = await supabase
                .from('menu_item_variants')
                .insert({
                    menu_item_id: v.canonical_id,
                    name: v.variant_name,
                    price: v.price,
                    is_available: true,
                    display_order: v.order
                });
            if (insErr) console.error(`Error inserting variant ${v.variant_name}:`, insErr);
            else console.log(`   + Added variant "${v.variant_name}" (${v.price} EGP) to item ${v.canonical_id}`);
        } else {
            console.log(`   ✓ Variant "${v.variant_name}" already exists for ${v.canonical_id}`);
        }
    }

    // 2. Hide duplicate rows (NEVER DELETE)
    const duplicateIdsToHide = [
        '09cf1eb1-46c9-4af4-9568-695ccf721280', // شاورما لحم 60
        'bc58760f-c491-462f-9e02-8abaa48e7c79', // شيش طاووق 70
        '47e3941e-c5de-4e22-b231-5bbb3d425c6c', // فاهيتا فراخ 75
        '4cc70f73-519f-4e6f-8790-85e5750d05be', // فاهيتا فراخ 60
        '191497fb-1640-4fd0-9c0e-0ddc909f61e7', // استربس 65
        '6674af39-ed86-4abf-8599-1e389a45afaf', // كرسبي 55
        'a76d176a-e83c-49e7-9a7a-61800d2b8809', // هوت دوج 40
        'c53e6ec4-8d0a-4e67-a8fe-0ffd624c130d'  // لحم نعام 250
    ];

    console.log('\n2. Setting status = "hidden" on duplicate records (No DELETE)...');
    for (const dupId of duplicateIdsToHide) {
        const { error: hideErr } = await supabase
            .from('menu_items')
            .update({ status: 'hidden' })
            .eq('id', dupId);

        if (hideErr) console.error(`Error hiding duplicate ID ${dupId}:`, hideErr);
        else console.log(`   ✓ Marked ID ${dupId} as hidden`);
    }

    // 3. Verify Option Groups
    console.log('\n3. Verifying Option Groups...');
    // A. Add cheese option group for hawawshi canonical items
    const hawawshiItems = [
        '4078864a-cefa-498c-851a-85d8866e4a29', // حواوشي ضاني
        '6cb4ebca-ea31-419b-abeb-613476d0ce02', // حواوشي كاندوز
        '847ec394-ff02-4752-bd8b-d7d6c5cb1624'  // حواوشي مخصوص
    ];

    for (const hwId of hawawshiItems) {
        const { data: existingGroup } = await supabase
            .from('menu_item_option_groups')
            .select('id')
            .eq('menu_item_id', hwId)
            .eq('name', 'إضافات');

        let groupId = existingGroup?.[0]?.id;
        if (!groupId) {
            const { data: newGrp, error: grpErr } = await supabase
                .from('menu_item_option_groups')
                .insert({
                    menu_item_id: hwId,
                    name: 'إضافات',
                    selection_type: 'multiple',
                    required: false,
                    min_selections: 0,
                    max_selections: 3,
                    display_order: 1
                })
                .select();
            if (grpErr) console.error(`Error creating option group for hawawshi ${hwId}:`, grpErr);
            else groupId = newGrp?.[0]?.id;
        }

        if (groupId) {
            // Check if option "إضافة جبنة" exists
            const { data: optExists } = await supabase
                .from('menu_item_options')
                .select('id')
                .eq('group_id', groupId)
                .eq('name', 'إضافة جبنة');

            if (!optExists || optExists.length === 0) {
                await supabase.from('menu_item_options').insert({
                    group_id: groupId,
                    name: 'إضافة جبنة',
                    price_delta: 20,
                    is_available: true,
                    display_order: 1
                });
                console.log(`   + Added option "إضافة جبنة" (+20 EGP) to hawawshi ${hwId}`);
            }
        }
    }

    console.log('\n=== PHASE 1 DATA MIGRATION COMPLETE ===\n');
}

executePhase1();
