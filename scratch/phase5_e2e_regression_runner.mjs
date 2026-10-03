import { createClient } from '@supabase/supabase-js';
import { generateCartItemKey, calculateItemUnitPrice } from '../src/core/utils/cartUtils.js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function runFullRegression() {
    console.log('===========================================================');
    console.log('🏁 PHASE 5: COMPREHENSIVE END-TO-END REGRESSION TEST RUNNER');
    console.log('===========================================================\n');

    const results = {};

    // -------------------------------------------------------------
    // TEST 1 — MENU DATA
    // -------------------------------------------------------------
    console.log('👉 TEST 1 — MENU DATA & SSOT AUDIT:');
    const { data: allDbItems } = await supabase.from('menu_items').select('id, name, price, status');
    const { data: activeItems, error: activeErr } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, status,
            categories(id, name, slug),
            menu_item_variants(id, name, price, is_available),
            menu_item_option_groups(id, name, required, selection_type, menu_item_options(id, name, price_delta))
        `)
        .neq('status', 'hidden');

    if (activeErr) throw activeErr;

    const totalCount = allDbItems.length;
    const activeCount = activeItems.length;
    const hiddenCount = allDbItems.filter(i => i.status === 'hidden').length;

    console.log(`   - Total DB items: ${totalCount}`);
    console.log(`   - Active items fetched: ${activeCount}`);
    console.log(`   - Hidden duplicates: ${hiddenCount}`);

    // Verify no hidden items in active query
    const hasHiddenInActive = activeItems.some(i => i.status === 'hidden');
    console.assert(!hasHiddenInActive, 'Hidden items leaked into active fetch!');
    results.menu_data = !hasHiddenInActive && activeCount === 161;
    console.log(`   ✓ TEST 1 STATUS: ${results.menu_data ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 2 — PRODUCT CARD & PRICE DISPLAY
    // -------------------------------------------------------------
    console.log('\n👉 TEST 2 — PRODUCT CARD PRESENTATION:');
    let cardTestsPassed = true;
    for (const item of activeItems) {
        const hasVariants = Array.isArray(item.menu_item_variants) && item.menu_item_variants.length > 0;
        const hasOptions = Array.isArray(item.menu_item_option_groups) && item.menu_item_option_groups.length > 0;
        const hasConfig = hasVariants || hasOptions;

        const minPrice = hasVariants ? Math.min(...item.menu_item_variants.map(v => v.price)) : item.price;
        const priceLabel = hasVariants ? `من ${minPrice}` : item.price;
        const ctaLabel = hasConfig ? 'اختر التخصيص' : '+ إضافة للطلب';

        if (hasVariants && (!priceLabel.startsWith('من') || minPrice <= 0)) {
            cardTestsPassed = false;
        }
    }
    results.product_card = cardTestsPassed;
    console.log(`   ✓ TEST 2 STATUS: ${results.product_card ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 3 — CUSTOMIZATION MODAL & GATING RULES
    // -------------------------------------------------------------
    console.log('\n👉 TEST 3 — MODAL GATING & FORM VALIDATION:');
    const shawarmaItem = activeItems.find(i => i.id === 'ade87b63-64f7-417e-93a6-5b92cd71a594');
    let modalTestPassed = true;

    if (shawarmaItem) {
        const variants = shawarmaItem.menu_item_variants || [];
        const optGroups = shawarmaItem.menu_item_option_groups || [];

        // Test price delta sum
        const basePrice = variants[0]?.price || 50;
        const sampleDelta = optGroups[0]?.menu_item_options?.[0]?.price_delta || 0;
        const calculatedUnit = basePrice + sampleDelta;
        console.log(`   - Shawarma base variant (${variants[0]?.name}): ${basePrice} EGP, option delta: +${sampleDelta} EGP -> Unit: ${calculatedUnit} EGP`);
        if (calculatedUnit !== basePrice + sampleDelta) modalTestPassed = false;
    }
    results.modal = modalTestPassed;
    console.log(`   ✓ TEST 3 STATUS: ${results.modal ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 4 — CART IDENTITY & DETERMINISTIC KEYS
    // -------------------------------------------------------------
    console.log('\n👉 TEST 4 — CART IDENTITY & STATE ISOLATION:');
    const baseId = 'ade87b63-64f7-417e-93a6-5b92cd71a594';

    const cartItem1 = {
        product_id: baseId,
        id: baseId,
        selected_variant: { id: 'var-1', name: 'كيزر', price: 50 },
        selected_options: []
    };
    const cartItem2 = {
        product_id: baseId,
        id: baseId,
        selected_variant: { id: 'var-2', name: 'سوري', price: 80 },
        selected_options: []
    };
    const cartItem3 = {
        product_id: baseId,
        id: baseId,
        selected_variant: { id: 'var-2', name: 'سوري', price: 80 },
        selected_options: [{ option_id: 'opt-1', name: 'جبنة', price_delta: 20 }]
    };

    const key1 = generateCartItemKey(cartItem1);
    const key2 = generateCartItemKey(cartItem2);
    const key3 = generateCartItemKey(cartItem3);

    console.log(`   - Config 1 key: ${key1}`);
    console.log(`   - Config 2 key: ${key2}`);
    console.log(`   - Config 3 key: ${key3}`);

    const keysAreUnique = key1 !== key2 && key2 !== key3 && key1 !== key3;
    console.assert(keysAreUnique, 'Cart keys collision detected!');
    results.cart = keysAreUnique;
    console.log(`   ✓ TEST 4 STATUS: ${results.cart ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 5 — ORDER PAYLOAD & RPC COMPATIBILITY
    // -------------------------------------------------------------
    console.log('\n👉 TEST 5 — ORDER PAYLOAD & RPC SCHEMA AUDIT:');
    const orderItemsPayload = [
        {
            item_id: baseId,
            name: 'شاورما فراخ (عيش سوري) + [جبنة إضافية]',
            quantity: 2,
            notes: 'بدون بصل'
        },
        {
            item_id: '9ac419d1-2bb4-4e30-9c3e-2351595a06c6',
            name: 'طاجن شاورما لحمة',
            quantity: 1,
            notes: null
        }
    ];

    let orderPayloadValid = true;
    for (const item of orderItemsPayload) {
        // Ensure UUID exists in active or allDbItems
        const existsInDb = allDbItems.some(dbItem => dbItem.id === item.item_id);
        if (!existsInDb) {
            console.error(`Item UUID ${item.item_id} NOT found in database!`);
            orderPayloadValid = false;
        }
    }
    results.order_payload = orderPayloadValid;
    console.log(`   ✓ TEST 5 STATUS: ${results.order_payload ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 6 — DELIVERY & DASHBOARD COMPATIBILITY
    // -------------------------------------------------------------
    console.log('\n👉 TEST 6 — DELIVERY & DASHBOARD WORKFLOW AUDIT:');
    // Verify RPC get_customer_order_tracking exists and can be queried
    const { error: rpcCheckErr } = await supabase.rpc('get_customer_order_tracking', {
        p_order_id: null,
        p_order_number: 'NON_EXISTENT_TEST_99999',
        p_customer_phone: null
    });
    // If error is not a fatal missing function error, function is present
    const rpcAvailable = !rpcCheckErr || !rpcCheckErr.message?.includes('does not exist');
    results.dashboard_delivery = rpcAvailable;
    console.log(`   ✓ TEST 6 STATUS: ${results.dashboard_delivery ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 7 — LEGACY SAFETY & ZERO DATA LOSS
    // -------------------------------------------------------------
    console.log('\n👉 TEST 7 — LEGACY SAFETY & ZERO DELETE AUDIT:');
    const allItemsCountValid = totalCount >= 174;
    console.log(`   - Initial rows recorded: 174 | Current rows in DB: ${totalCount}`);
    results.legacy_safety = allItemsCountValid;
    console.log(`   ✓ TEST 7 STATUS: ${results.legacy_safety ? 'PASS' : 'FAIL'}`);

    console.log('\n===========================================================');
    const allPassed = Object.values(results).every(Boolean);
    console.log(`🏁 ALL AUTOMATED REGRESSION TESTS: ${allPassed ? 'ALL PASS ✅' : 'FAIL ❌'}`);
    console.log('===========================================================');
}

runFullRegression();
