import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Recursively find all files
function getAllFiles(dir, exts = ['.js', '.jsx', '.ts', '.tsx', '.sql', '.json']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const menuFiles = getAllFiles('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu');
const deliveryFiles = getAllFiles('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery');
const allFiles = [...menuFiles, ...deliveryFiles];

console.log(`Searching across ${allFiles.length} files in AbuKhater_Menu and AbuKhater_delivery...`);

const tablePattern = /(?:from|join|into|update|table|TABLE|FROM|JOIN|INTO|UPDATE)\s+["']?(?:public\.)?([a-zA-Z0-9_]+)["']?|\.from\(["']([a-zA-Z0-9_]+)["']\)/g;
const candidateTables = new Set();

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    const tbl = (match[1] || match[2])?.toLowerCase();
    if (tbl && tbl.length > 2 && !['select', 'where', 'order', 'group', 'null', 'true', 'false', 'text', 'uuid', 'jsonb', 'integer', 'boolean', 'numeric', 'public', 'if', 'exists', 'set'].includes(tbl)) {
      candidateTables.add(tbl);
    }
  }
});

console.log(`Found ${candidateTables.size} candidate table names from source files.`);

// List of known/standard tables to definitely check
const knownTables = [
  'orders', 'order_items', 'order_status_history', 'order_events', 'order_assignments',
  'driver_transactions', 'delivery', 'delivery_shift_logs', 'delivery_zones',
  'shifts', 'sync_queue', 'applied_mutations', 'notifications',
  'menu_items', 'menu_item_variants', 'menu_item_option_groups', 'menu_item_options',
  'menu_availability', 'categories', 'restaurant_settings', 'app_config',
  'profiles', 'staff_roles', 'reservations', 'feedback', 'user_orders', 'phone_otps',
  'mutation_log', 'audit_logs', 'shifts_summary', 'customer_profiles', 'turnstile_logs',
  'system_logs', 'rate_limits', 'telegram_subscribers', 'bot_settings', 'shift_reports'
];

knownTables.forEach(t => candidateTables.add(t));

console.log(`Total candidate tables to verify against Supabase: ${candidateTables.size}`);

async function auditTables() {
  const results = {};
  
  for (const table of Array.from(candidateTables).sort()) {
    try {
      // 1. Check if table exists in DB by querying 1 row
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // undefined_table
          results[table] = { exists: false, error: 'Table does not exist (42P01)' };
        } else if (error.code === '42501') {
          // RLS error: Table exists but RLS blocks anon select
          results[table] = { exists: true, rlsBlocked: true, rowCount: 'Protected by RLS (42501)', sampleColumns: [] };
        } else {
          results[table] = { exists: 'unknown', error: error.message, code: error.code };
        }
      } else {
        const sampleRow = data && data.length > 0 ? data[0] : null;
        results[table] = {
          exists: true,
          rlsBlocked: false,
          rowCount: count !== null ? count : (data ? data.length : 0),
          sampleColumns: sampleRow ? Object.keys(sampleRow) : []
        };
      }
    } catch (e) {
      results[table] = { exists: false, exception: e.message };
    }
  }

  // Save raw verification
  fs.writeFileSync('scratch/table_verification_results.json', JSON.stringify(results, null, 2));
  
  const existingTables = Object.entries(results).filter(([k, v]) => v.exists === true);
  console.log(`\n=== FOUND ${existingTables.length} CONFIRMED EXISTING TABLES IN SUPABASE: ===`);
  existingTables.forEach(([tbl, info]) => {
    console.log(`- ${tbl}: rows = ${info.rowCount}, cols = [${info.sampleColumns.join(', ')}]`);
  });
}

auditTables();
