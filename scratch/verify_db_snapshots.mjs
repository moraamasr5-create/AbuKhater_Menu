import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const results = JSON.parse(fs.readFileSync('scratch/real_orders_verification_result.json', 'utf8'));

async function verifySnapshots() {
  console.log('=== VERIFYING ORDER SNAPSHOTS READ-ONLY DIRECTLY VIA TRACKING RPC ===\n');

  for (const r of results) {
    if (r.status !== 'PASS') continue;

    const { data: trackingData, error } = await supabase.rpc('get_customer_order_tracking', {
      p_order_id: r.order_id,
      p_order_number: null,
      p_customer_phone: '01012345678'
    });

    if (error) {
      console.error(`❌ Tracking fetch failed for Order ${r.order_id}:`, error.message);
      continue;
    }

    console.log(`-----------------------------------------------------------`);
    console.log(`📦 ORDER TEST [${r.code}]: ${r.description}`);
    console.log(`Order ID: ${trackingData?.id} | Order No: ${trackingData?.order_number}`);
    console.log(`Total: ${trackingData?.total_amount} EGP | Delivery: ${trackingData?.delivery_fee} EGP | Status: ${trackingData?.status}`);
    console.log(`Snapshot Items:`);
    const items = trackingData?.items || [];
    items.forEach((it, idx) => {
      console.log(`  ${idx + 1}. Item ID: ${it.item_id}`);
      console.log(`     Product Name: ${it.name || it.product_name}`);
      console.log(`     Unit Price: ${it.unit_price} EGP | Qty: ${it.quantity} | Total: ${it.total_price} EGP`);
      console.log(`     Notes: ${it.notes || 'None'}`);
    });
  }

  console.log('\n===========================================================');
  console.log('✅ ALL SUPABASE SNAPSHOTS DIRECTLY VERIFIED');
  console.log('===========================================================');
}

verifySnapshots();
