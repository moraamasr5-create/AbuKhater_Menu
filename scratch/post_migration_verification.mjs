import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function runPostMigrationVerification() {
  console.log('=== POST-MIGRATION VERIFICATION ===\n');

  // 1. Fetch active products
  const { data: items, error: itemsErr } = await supabase
    .from('menu_items')
    .select('id, name, price, status')
    .neq('status', 'hidden');

  if (itemsErr) {
    console.error('Error fetching menu_items:', itemsErr);
    return;
  }

  // 2. Fetch variants
  const { data: variants, error: varErr } = await supabase
    .from('menu_item_variants')
    .select('id, menu_item_id, name, price, is_available');

  if (varErr) {
    console.error('Error fetching variants:', varErr);
    return;
  }

  // 3. Fetch option groups
  const { data: groups, error: grpErr } = await supabase
    .from('menu_item_option_groups')
    .select('id, menu_item_id, name');

  if (grpErr) {
    console.error('Error fetching option groups:', grpErr);
    return;
  }

  const itemVariantMap = new Map();
  for (const v of variants) {
    if (!itemVariantMap.has(v.menu_item_id)) {
      itemVariantMap.set(v.menu_item_id, []);
    }
    itemVariantMap.get(v.menu_item_id).push(v);
  }

  let configurableCount = 0;
  let simpleCount = 0;

  for (const item of items) {
    const itemVars = itemVariantMap.get(item.id) || [];
    if (itemVars.length > 0) {
      configurableCount++;
    } else {
      simpleCount++;
    }
  }

  console.log(`Active Products: ${items.length}`);
  console.log(`Configurable Products: ${configurableCount}`);
  console.log(`Simple Products: ${simpleCount}`);
  console.log(`Total Variants: ${variants.length}`);
  console.log(`Option Groups: ${groups ? groups.length : 0}`);

  // Check orphans
  const itemIds = new Set(items.map(i => i.id));
  const orphans = variants.filter(v => !itemIds.has(v.menu_item_id));
  console.log(`Orphan Variants: ${orphans.length}`);

  // Check duplicates
  const seenKeys = new Set();
  let duplicates = 0;
  for (const v of variants) {
    const key = `${v.menu_item_id}_${v.name}`;
    if (seenKeys.has(key)) duplicates++;
    seenKeys.add(key);
  }
  console.log(`Duplicate Variants: ${duplicates}`);
}

runPostMigrationVerification();
