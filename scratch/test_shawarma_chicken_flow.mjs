import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function testShawarmaChickenFlow() {
  console.log('=== REAL E2E FLOW TEST: SHAWARMA CHICKEN ===\n');

  const shawarmaId = 'ade87b63-64f7-417e-93a6-5b92cd71a594';

  // 1. Fetch Item
  const { data: item, error: itemErr } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .eq('id', shawarmaId)
    .single();

  if (itemErr || !item) {
    console.error('Failed to fetch Shawarma Chicken:', itemErr);
    return;
  }
  console.log(`1. Product Fetched: [${item.id}] "${item.name}"`);

  // 2. Fetch Variants
  const { data: variants, error: varErr } = await supabase
    .from('menu_item_variants')
    .select('id, name, price')
    .eq('menu_item_id', shawarmaId);

  if (varErr || !variants || variants.length === 0) {
    console.error('Failed to fetch variants for Shawarma Chicken:', varErr);
    return;
  }

  console.log(`2. Variants Found (${variants.length}):`);
  variants.forEach(v => console.log(`   - [${v.id}] ${v.name}: ${v.price} EGP`));

  // Pick first variant (كيزر)
  const selectedVariant = variants.find(v => v.name.includes('كيزر')) || variants[0];
  console.log(`\n3. Selected Variant: [${selectedVariant.id}] "${selectedVariant.name}" @ ${selectedVariant.price} EGP`);

  // 4. Cart Payload simulation
  const cartItemKey = `${item.id}_v${selectedVariant.id}`;
  const cartItem = {
    cart_item_key: cartItemKey,
    product_id: item.id,
    variant_id: selectedVariant.id,
    variant_name: selectedVariant.name,
    unit_price: selectedVariant.price,
    quantity: 1,
    total_price: selectedVariant.price,
    options: []
  };

  console.log('\n4. Cart Item Formed:', JSON.stringify(cartItem, null, 2));

  // 5. Submit Order via RPC
  const itemsForRpc = [
    {
      item_id: cartItem.product_id,
      name: `${item.name} (${cartItem.variant_name})`,
      quantity: cartItem.quantity,
      notes: null
    }
  ];

  const rpcParams = {
    p_order_type: 'pickup',
    p_customer_name: 'إختبار تتبع شاورما',
    p_customer_phone: '01000000099',
    p_customer_phone_2: null,
    p_delivery_address: null,
    p_payment_method: 'cash',
    p_payment_screenshot: null,
    p_location_method: 'gps',
    p_area_id: null,
    p_latitude: null,
    p_longitude: null,
    p_items: itemsForRpc,
    p_idempotency_key: crypto.randomUUID(),
    p_source: 'online',
    p_turnstile_token: '1x00000000000000000000AA'
  };

  console.log('\n5. Order Payload Sent to create_order RPC...');
  const { data: orderResult, error: orderErr } = await supabase.rpc('create_order', rpcParams);

  if (orderErr) {
    console.error('❌ Order creation failed:', orderErr);
    return;
  }

  console.log('✅ 6. Order Created Successfully in Supabase!');
  console.log('   Result:', JSON.stringify(orderResult, null, 2));
}

testShawarmaChickenFlow();
