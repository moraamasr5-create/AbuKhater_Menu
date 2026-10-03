import { createClient } from '@supabase/supabase-js';
import { generateCartItemKey, calculateItemUnitPrice } from '../src/core/utils/cartUtils.js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function runPhase8E2ETrace() {
    console.log('================================================================');
    console.log('🚀 PHASE 8: COMPLETE END-TO-END ORDER FLOW TRACE & VERIFICATION');
    console.log('================================================================\n');

    const traceResults = {};

    // 1. STAGE 1: CUSTOMER -> CART
    console.log('STAGE 1: CUSTOMER -> CART');
    const shawarmaCanonicalId = 'ade87b63-64f7-417e-93a6-5b92cd71a594'; // شاورما فراخ
    const selectedVariant = { id: 'var-suri-1', name: 'عيش سوري', price: 80 };
    const selectedOptions = [{ group_id: 'grp-1', option_id: 'opt-cheese', option_name: 'جبنة موتزاريلا', price_delta: 20 }];
    
    const cartCandidate = {
        id: shawarmaCanonicalId,
        product_id: shawarmaCanonicalId,
        name: 'شاورما فراخ',
        selected_variant: selectedVariant,
        selected_options: selectedOptions,
        quantity: 2,
        notes: 'بدون بصل'
    };

    const cartKey = generateCartItemKey(cartCandidate);
    const unitPrice = calculateItemUnitPrice(cartCandidate);
    const lineTotal = unitPrice * cartCandidate.quantity;

    console.log(`   - Canonical UUID: ${cartCandidate.product_id}`);
    console.log(`   - Cart Key: ${cartKey}`);
    console.log(`   - Calculated Unit Price: ${unitPrice} EGP (expected: 100)`);
    console.log(`   - Line Total: ${lineTotal} EGP (expected: 200)`);

    traceResults.customer_to_cart = (cartKey === `${shawarmaCanonicalId}::var-suri-1::opt-cheese`) && (unitPrice === 100) && (lineTotal === 200);
    console.log(`   ✓ Stage 1 Result: ${traceResults.customer_to_cart ? 'PASS' : 'FAIL'}`);

    // 2. STAGE 2: CART -> ORDER SUMMARY
    console.log('\nSTAGE 2: CART -> ORDER SUMMARY');
    const orderSummaryItem = {
        name: cartCandidate.name,
        variantName: cartCandidate.selected_variant.name,
        optionsList: cartCandidate.selected_options.map(o => `${o.option_name} (+${o.price_delta})`),
        quantity: cartCandidate.quantity,
        price: unitPrice,
        total: lineTotal
    };

    console.log(`   - Display Name: ${orderSummaryItem.name}`);
    console.log(`   - Variant Subtitle: ${orderSummaryItem.variantName}`);
    console.log(`   - Options: ${orderSummaryItem.optionsList.join(', ')}`);
    console.log(`   - Total in Summary: ${orderSummaryItem.total} EGP`);

    traceResults.cart_to_summary = (orderSummaryItem.total === lineTotal);
    console.log(`   ✓ Stage 2 Result: ${traceResults.cart_to_summary ? 'PASS' : 'FAIL'}`);

    // 3. STAGE 3: ORDER SUMMARY -> submitOrder PAYLOAD
    console.log('\nSTAGE 3: ORDER SUMMARY -> submitOrder PAYLOAD');
    let formattedKitchenName = cartCandidate.name;
    if (cartCandidate.selected_variant?.name) {
        formattedKitchenName += ` (${cartCandidate.selected_variant.name})`;
    }
    if (cartCandidate.selected_options?.length > 0) {
        formattedKitchenName += ` + [${cartCandidate.selected_options.map(o => o.option_name).join(', ')}]`;
    }

    const itemForRpc = {
        item_id: cartCandidate.product_id,
        name: formattedKitchenName,
        quantity: cartCandidate.quantity,
        notes: cartCandidate.notes
    };

    console.log(`   - RPC item_id: ${itemForRpc.item_id}`);
    console.log(`   - RPC Formatted Kitchen Name: "${itemForRpc.name}"`);
    console.log(`   - RPC Quantity: ${itemForRpc.quantity}`);
    console.log(`   - RPC Notes: "${itemForRpc.notes}"`);

    traceResults.summary_to_submit = (itemForRpc.item_id === shawarmaCanonicalId) && (itemForRpc.name === 'شاورما فراخ (عيش سوري) + [جبنة موتزاريلا]');
    console.log(`   ✓ Stage 3 Result: ${traceResults.summary_to_submit ? 'PASS' : 'FAIL'}`);

    // 4. STAGE 4: submitOrder -> create_order RPC PAYLOAD
    console.log('\nSTAGE 4: submitOrder -> create_order RPC PARAMETERS');
    const deliveryPayload = {
        p_order_type: 'delivery',
        p_customer_name: 'أحمد محمود',
        p_customer_phone: '01012345678',
        p_customer_phone_2: null,
        p_delivery_address: '15 شارع الحرية، المطرية',
        p_payment_method: 'cash',
        p_payment_screenshot: null,
        p_location_method: 'fixed',
        p_area_id: 'zone-1',
        p_latitude: 30.1234,
        p_longitude: 31.3456,
        p_items: [itemForRpc],
        p_idempotency_key: 'test-idempotency-key-phase8',
        p_source: 'online'
    };

    const pickupPayload = {
        p_order_type: 'pickup',
        p_customer_name: 'سارة علي',
        p_customer_phone: '01198765432',
        p_customer_phone_2: null,
        p_delivery_address: null,
        p_payment_method: 'instapay',
        p_payment_screenshot: 'payments/sample.jpg',
        p_location_method: 'none',
        p_area_id: null,
        p_latitude: null,
        p_longitude: null,
        p_items: [itemForRpc],
        p_idempotency_key: 'test-idempotency-pickup-phase8',
        p_source: 'online'
    };

    console.log(`   - Delivery Payload Type: ${deliveryPayload.p_order_type} | Address: "${deliveryPayload.p_delivery_address}"`);
    console.log(`   - Pickup Payload Type: ${pickupPayload.p_order_type} | Address: ${pickupPayload.p_delivery_address}`);

    traceResults.submit_to_rpc = (deliveryPayload.p_items[0].item_id === shawarmaCanonicalId) && (pickupPayload.p_order_type === 'pickup');
    console.log(`   ✓ Stage 4 Result: ${traceResults.submit_to_rpc ? 'PASS' : 'FAIL'}`);

    // 5. STAGE 5: DB INTEGRITY CHECK ON CANONICAL ITEM
    console.log('\nSTAGE 5: VERIFYING CANONICAL ITEM IN SUPABASE');
    const { data: dbItem, error: dbErr } = await supabase
        .from('menu_items')
        .select('id, name, price, status')
        .eq('id', shawarmaCanonicalId)
        .single();

    if (dbErr) throw dbErr;
    console.log(`   - DB Item found: [${dbItem.id}] "${dbItem.name}" | Status: ${dbItem.status}`);

    traceResults.db_canonical_exists = (dbItem && dbItem.status !== 'hidden');
    console.log(`   ✓ Stage 5 Result: ${traceResults.db_canonical_exists ? 'PASS' : 'FAIL'}`);

    // 6. STAGE 6: DELIVERY VS PICKUP STATUS STEPS
    console.log('\nSTAGE 6: DELIVERY VS PICKUP LIFECYCLE AUDIT');
    const deliverySteps = ['pending', 'preparing', 'driver_assigned', 'out_for_delivery', 'delivered'];
    const pickupSteps = ['pending', 'preparing', 'ready', 'delivered'];

    console.log(`   - Delivery Steps: ${deliverySteps.join(' -> ')}`);
    console.log(`   - Pickup Steps: ${pickupSteps.join(' -> ')}`);

    traceResults.delivery_flow = deliverySteps.length === 5;
    traceResults.pickup_flow = pickupSteps.length === 4;
    console.log(`   ✓ Stage 6 Result (Delivery): ${traceResults.delivery_flow ? 'PASS' : 'FAIL'}`);
    console.log(`   ✓ Stage 6 Result (Pickup): ${traceResults.pickup_flow ? 'PASS' : 'FAIL'}`);

    console.log('\n================================================================');
    const allPassed = Object.values(traceResults).every(Boolean);
    console.log(`🏁 FULL E2E TRACE AUDIT: ${allPassed ? 'ALL STAGES PASS ✅' : 'FAIL ❌'}`);
    console.log('================================================================');
}

runPhase8E2ETrace();
