import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const allExistingTables = [
  'app_config',
  'applied_mutations',
  'categories',
  'customers',
  'delivery',
  'delivery_shift_logs',
  'delivery_zones',
  'driver_transactions',
  'feedback',
  'menu_availability',
  'menu_item_option_groups',
  'menu_item_options',
  'menu_item_variants',
  'menu_items',
  'notifications',
  'order_assignments',
  'order_events',
  'order_items',
  'order_status_history',
  'orders',
  'profiles',
  'reservations',
  'restaurant_settings',
  'shifts',
  'staff_roles',
  'sync_queue',
  'telegram_logs'
];

async function inspectColumnsAndCounts() {
  const tableReport = {};

  for (const t of allExistingTables) {
    try {
      const { data, count, error } = await supabase
        .from(t)
        .select('*', { count: 'exact' })
        .limit(1);

      tableReport[t] = {
        rowCount: count !== null ? count : (data ? data.length : 0),
        isRlsBlocked: error ? true : false,
        error: error ? error.message : null,
        sampleRow: data && data.length > 0 ? data[0] : null,
        columns: data && data.length > 0 ? Object.keys(data[0]) : []
      };
    } catch (e) {
      tableReport[t] = { exception: e.message };
    }
  }

  console.log('=== TABLE ROW COUNTS AND LIVE COLUMNS ===\n');
  Object.entries(tableReport).forEach(([tbl, rep]) => {
    console.log(`- ${tbl.padEnd(25)} | Rows: ${String(rep.rowCount).padEnd(6)} | Cols (${rep.columns.length}): [${rep.columns.join(', ')}]`);
  });

  fs.writeFileSync('scratch/table_report_live.json', JSON.stringify(tableReport, null, 2));
}

inspectColumnsAndCounts();
