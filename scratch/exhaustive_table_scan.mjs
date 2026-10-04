import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const wordsToCheck = [
  'app_config', 'applied_mutations', 'categories', 'delivery', 'delivery_shift_logs',
  'delivery_zones', 'driver_transactions', 'feedback', 'menu_availability',
  'menu_item_option_groups', 'menu_item_options', 'menu_item_variants', 'menu_items',
  'notifications', 'order_assignments', 'order_events', 'order_items',
  'order_status_history', 'orders', 'profiles', 'reservations',
  'restaurant_settings', 'shifts', 'staff_roles', 'sync_queue', 'telegram_logs',
  'shift_expenses', 'phone_otps', 'user_orders', 'turnstile_logs', 'customer_profiles',
  'mutation_log', 'audit_logs', 'shifts_summary', 'system_logs', 'rate_limits',
  'telegram_subscribers', 'bot_settings', 'shift_reports', 'payment_screenshots',
  'expenses', 'drivers', 'pilots', 'areas', 'zones', 'coupons', 'discounts',
  'users', 'customers', 'admins', 'cashiers', 'settings', 'config', 'logs'
];

async function scan() {
  const verifiedExisting = [];
  const verifiedNonExisting = [];

  for (const w of wordsToCheck) {
    try {
      const { data, count, error } = await supabase.from(w).select('*', { count: 'exact', head: false }).limit(1);
      if (error && error.code === '42P01') {
        verifiedNonExisting.push(w);
      } else {
        const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
        verifiedExisting.push({
          table: w,
          rowCount: count !== null ? count : (data ? data.length : 0),
          error: error ? error.message : null,
          code: error ? error.code : null,
          sampleCols: cols
        });
      }
    } catch (e) {
      verifiedNonExisting.push(w);
    }
  }

  console.log(`=== FOUND ${verifiedExisting.length} EXISTING TABLES IN SUPABASE: ===`);
  verifiedExisting.forEach(v => {
    console.log(`- ${v.table.padEnd(25)} | rows: ${String(v.rowCount).padEnd(6)} | cols: [${v.sampleCols.join(', ')}] ${v.error ? `(RLS: ${v.error})` : ''}`);
  });

  fs.writeFileSync('scratch/all_confirmed_existing_tables.json', JSON.stringify(verifiedExisting, null, 2));
}

scan();
