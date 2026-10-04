import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));

console.log('Total items:', items.length);
const visibleItems = items.filter(i => i.status !== 'hidden');
console.log('Visible items:', visibleItems.length);
const hiddenItems = items.filter(i => i.status === 'hidden');
console.log('Hidden items:', hiddenItems.length);

const byCat = {};
visibleItems.forEach(i => {
  const c = i.categories?.name || 'Uncategorized';
  if (!byCat[c]) byCat[c] = [];
  byCat[c].push(i);
});

for (const [cat, list] of Object.entries(byCat)) {
  console.log(`\n=== Category: ${cat} (${list.length} items) ===`);
  list.forEach(i => {
    const vStr = (i.menu_item_variants || []).map(v => `${v.name}:${v.price}`).join(', ');
    const oStr = (i.menu_item_option_groups || []).map(g => `${g.name} (${(g.menu_item_options||[]).map(o=>`${o.name}+${o.price_delta}`).join(',')})`).join('; ');
    console.log(`- [${i.id}] "${i.name}" | Price: ${i.price} | unit: ${i.unit_type} | base_qty: ${i.base_qty} | Vars: [${vStr}] | Opts: [${oStr}]`);
  });
}
