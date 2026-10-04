import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));
const visibleItems = items.filter(i => i.status !== 'hidden');

const byCat = {};
visibleItems.forEach(i => {
  const c = i.categories?.name || 'Uncategorized';
  if (!byCat[c]) byCat[c] = [];
  byCat[c].push(i);
});

['مشويـات', 'وجـبات', 'صـوانـي'].forEach(cat => {
  const list = byCat[cat] || [];
  console.log(`=== ${cat} (${list.length}) ===`);
  list.forEach(i => {
    const vStr = (i.menu_item_variants || []).map(v => `${v.name}:${v.price}`).join(', ');
    console.log(`  [${i.id}] "${i.name}" | Price: ${i.price} | unit: ${i.unit_type} | Vars: [${vStr}]`);
  });
});
