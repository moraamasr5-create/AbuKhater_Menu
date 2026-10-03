import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function traceFrontend32() {
  const { data: items, error: err1 } = await supabase
    .from('menu_items')
    .select('id, name, price, status')
    .neq('status', 'hidden');

  if (err1) {
    console.error('Err1:', err1);
    return;
  }

  const { data: variants, error: err2 } = await supabase
    .from('menu_item_variants')
    .select('id, menu_item_id, name, price, is_available');

  const { data: optionGroups, error: err3 } = await supabase
    .from('menu_item_option_groups')
    .select('id, menu_item_id, name');

  // Build maps
  const varMap = new Map();
  for (const v of (variants || [])) {
    if (!varMap.has(v.menu_item_id)) varMap.set(v.menu_item_id, []);
    varMap.get(v.menu_item_id).push(v);
  }

  const grpMap = new Map();
  for (const g of (optionGroups || [])) {
    if (!grpMap.has(g.menu_item_id)) grpMap.set(g.menu_item_id, []);
    grpMap.get(g.menu_item_id).push(g);
  }

  const mapped = items.map(item => {
    const rawVariants = varMap.get(item.id) || [];
    const activeVariants = rawVariants.filter(v => v.is_available !== false);
    const hasVariants = activeVariants.length > 0;

    const rawGroups = grpMap.get(item.id) || [];
    const hasOptions = rawGroups.length > 0;

    const hasConfiguration = hasVariants || hasOptions;

    return {
      id: item.id,
      name: item.name,
      hasVariants,
      variantCount: activeVariants.length,
      hasOptions,
      groupCount: rawGroups.length,
      hasConfiguration,
      rawGroups
    };
  });

  const configurableFrontend = mapped.filter(m => m.hasConfiguration);
  console.log('Total Active Items in DB:', items.length);
  console.log('Total Mapped Configurable Items in Frontend:', configurableFrontend.length);
  console.log('----------------------------------------------------');

  configurableFrontend.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.id}] "${m.name}" | HasVariants: ${m.hasVariants} (${m.variantCount}) | HasOptionGroups: ${m.hasOptions} (${m.groupCount})`);
  });

  console.log('\nItems configurable ONLY due to Option Groups (no variants):');
  const optionOnly = configurableFrontend.filter(m => !m.hasVariants && m.hasOptions);
  console.log(`Count: ${optionOnly.length}`);
  optionOnly.forEach(m => console.log(`- [${m.id}] "${m.name}" -> Option Groups:`, m.rawGroups.map(g => g.name).join(', ')));
}

traceFrontend32();
