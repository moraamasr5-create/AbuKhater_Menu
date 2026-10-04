import { createClient } from '@supabase/supabase-js';
import { getCommercialItemType, getNormalizedVariants, formatCommercialItemName } from '../src/core/utils/pricingEngine.js';
import { parseItemCommercialDetails } from '../../AbuKhater_delivery/src/utils/commercialItemParser.js';
import { repairOrder } from '../../AbuKhater_delivery/src/utils/safeOrderParser.js';
import fs from 'fs';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const allItems = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));

// Test Cases Definition
const testCases = [
  {
    code: 'A',
    description: 'Weight-based 1 KG (كفتة كاندوز 1 كجم)',
    itemFinder: () => allItems.find(i => i.name.trim() === 'كفتة كاندوز' && i.categories?.name === 'مشويـات'),
    variantSelector: (variants) => variants.find(v => v.weight_kg === 1.0 || v.name.includes('1 كجم')),
    qty: 1
  },
  {
    code: 'B',
    description: 'Weight-based ½ KG (كفتة كاندوز نصف كيلو)',
    itemFinder: () => allItems.find(i => i.name.trim() === 'كفتة كاندوز' && i.categories?.name === 'مشويـات'),
    variantSelector: (variants) => variants.find(v => v.weight_kg === 0.5 || v.name.includes('نصف')),
    qty: 1
  },
  {
    code: 'C',
    description: 'Weight-based ¼ KG (كفتة كاندوز ربع كيلو)',
    itemFinder: () => allItems.find(i => i.name.trim() === 'كفتة كاندوز' && i.categories?.name === 'مشويـات'),
    variantSelector: (variants) => variants.find(v => v.weight_kg === 0.25 || v.name.includes('ربع')),
    qty: 2
  },
  {
    code: 'D',
    description: 'Portion Product (فرخة شيش نصف فرخة)',
    itemFinder: () => allItems.find(i => i.name.trim() === 'فرخة شيش' && i.categories?.name === 'مشويـات'),
    variantSelector: (variants) => variants.find(v => v.name.includes('نصف')),
    qty: 1
  },
  {
    code: 'E',
    description: 'QTY Product (أرز بسمتي سادة)',
    itemFinder: () => allItems.find(i => i.name.trim() === 'أرز بسمتي سادة'),
    variantSelector: () => null,
    qty: 2
  },
  {
    code: 'F',
    description: 'Sandwich Variant (شاورما فراخ عيش سوري)',
    itemFinder: () => allItems.find(i => i.name.trim() === 'شاورما فراخ' && (i.menu_item_variants?.length > 0 || i.variants?.length > 0)),
    variantSelector: (variants) => variants.find(v => v.name.includes('سوري')) || variants[0],
    qty: 2
  },
  {
    code: 'G',
    description: 'Option Product (بيبسي مع خيارات)',
    itemFinder: () => allItems.find(i => i.name.trim().includes('بيبسي')),
    variantSelector: () => null,
    optionSelector: (groups) => {
      if (!groups || groups.length === 0) return [];
      const opt = groups[0].menu_item_options?.[0];
      return opt ? [{ group_id: groups[0].id, group_name: groups[0].name, option_id: opt.id, option_name: opt.name, price_delta: parseFloat(opt.price_delta) || 0 }] : [];
    },
    qty: 1
  },
  {
    code: 'H',
    description: 'High-Price Fixed Tray (صينية أبو خاطر)',
    itemFinder: () => allItems.find(i => i.name.trim().includes('صينية ابو خاطر') || i.name.trim().startsWith('صينية')),
    variantSelector: () => null,
    qty: 1
  }
];

async function runRealOrderTests() {
  console.log('===============================================================');
  console.log('🚀 EXECUTING REAL ORDERS A THROUGH H AGAINST SUPABASE RPC');
  console.log('===============================================================\n');

  const results = [];

  for (const tc of testCases) {
    const rawItem = tc.itemFinder();
    if (!rawItem) {
      console.error(`❌ Item for Test ${tc.code} not found!`);
      continue;
    }

    const cType = getCommercialItemType(rawItem);
    const variants = getNormalizedVariants({ ...rawItem, commercial_type: cType });
    const selectedVariant = tc.variantSelector ? tc.variantSelector(variants) : null;
    const selectedOptions = tc.optionSelector ? tc.optionSelector(rawItem.menu_item_option_groups) : [];

    const unitPrice = selectedVariant
      ? parseFloat(selectedVariant.price)
      : (parseFloat(rawItem.price) + selectedOptions.reduce((s, o) => s + (o.price_delta || 0), 0));
    const qty = tc.qty;
    const lineTotal = unitPrice * qty;

    const formattedItemName = formatCommercialItemName(rawItem, selectedVariant, selectedOptions);

    const rpcItem = {
      item_id: rawItem.id,
      name: formattedItemName,
      quantity: qty,
      unit_price: unitPrice,
      line_total: lineTotal,
      selected_variant: selectedVariant ? { id: selectedVariant.id, name: selectedVariant.name, price: selectedVariant.price, weight_kg: selectedVariant.weight_kg || null } : null,
      selected_options: selectedOptions,
      notes: `Test ${tc.code} automated verification`
    };

    const idempotencyKey = crypto.randomUUID();

    const orderPayload = {
      p_order_type: 'delivery',
      p_customer_name: `عميل اختبار ${tc.code}`,
      p_customer_phone: '01012345678',
      p_customer_phone_2: null,
      p_delivery_address: 'شارع المطعم التجريبي - المطرية',
      p_payment_method: 'cash',
      p_payment_screenshot: null,
      p_location_method: 'address',
      p_area_id: 'zone-matareya-main',
      p_latitude: 30.126,
      p_longitude: 31.298,
      p_items: [rpcItem],
      p_idempotency_key: idempotencyKey,
      p_source: 'online',
      p_turnstile_token: '1x00000000000000000000AA'
    };

    console.log(`\n-----------------------------------------------------------`);
    console.log(`🧪 TEST [${tc.code}]: ${tc.description}`);
    console.log(`-----------------------------------------------------------`);
    console.log(`Item: ${rawItem.name} | Type: ${cType}`);
    console.log(`Variant: ${selectedVariant ? `${selectedVariant.name} (${selectedVariant.price} EGP)` : 'None'}`);
    console.log(`Calculated Unit Price: ${unitPrice} EGP | Qty: ${qty} | Line Total: ${lineTotal} EGP`);
    console.log(`Formatted Snapshot Name: "${formattedItemName}"`);

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order', orderPayload);

      if (rpcError) {
        console.error(`❌ create_order RPC Failed for Test ${tc.code}:`, rpcError.message);
        results.push({ code: tc.code, status: 'FAIL', error: rpcError.message });
      } else {
        console.log(`✅ Order Created in Supabase!`);
        console.log(`   Order ID: ${rpcResult?.order_id || rpcResult?.order_number}`);
        console.log(`   Total Amount: ${rpcResult?.total_amount} EGP`);
        console.log(`   Delivery Fee: ${rpcResult?.delivery_fee} EGP`);

        // Test AbuKhater_delivery Parser against this simulated payload
        const simulatedOrderForDashboard = {
          order_id: rpcResult?.order_number || `#${tc.code}-100`,
          customer: { full_name: orderPayload.p_customer_name, phone_1: orderPayload.p_customer_phone, delivery_info: { address: orderPayload.p_delivery_address, delivery_fee: rpcResult?.delivery_fee || 20 } },
          totals: { subtotal: lineTotal, delivery_fee: rpcResult?.delivery_fee || 20, service_fee: 0, total: rpcResult?.total_amount },
          items: [rpcItem]
        };

        const repaired = repairOrder(simulatedOrderForDashboard);
        const parsedDetails = parseItemCommercialDetails(repaired.items[0]);

        console.log(`🔍 Dashboard Parser Verification:`);
        console.log(`   Parsed Product Name: "${parsedDetails.productName}"`);
        console.log(`   Parsed Variant Name: "${parsedDetails.variantName}"`);
        console.log(`   Parsed Unit Price:   ${repaired.items[0].price} EGP`);
        console.log(`   Parsed Line Total:    ${repaired.items[0].price * repaired.items[0].count} EGP`);

        results.push({
          code: tc.code,
          description: tc.description,
          status: 'PASS',
          order_id: rpcResult?.order_id || rpcResult?.order_number,
          total_amount: rpcResult?.total_amount,
          unit_price: unitPrice,
          line_total: lineTotal,
          parsed_variant: parsedDetails.variantName
        });
      }
    } catch (err) {
      console.error(`🔥 Exception in Test ${tc.code}:`, err.message);
      results.push({ code: tc.code, status: 'FAIL', error: err.message });
    }
  }

  console.log('\n===============================================================');
  console.log('📊 FINAL EXECUTION SUMMARY OF REAL SUPABASE ORDERS');
  console.log('===============================================================');
  console.table(results);

  fs.writeFileSync('scratch/real_orders_verification_result.json', JSON.stringify(results, null, 2));
}

runRealOrderTests();
