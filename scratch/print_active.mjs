import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scratch/all_items_db.json', 'utf8'));
const active = items.filter(i => i.status !== 'hidden');

console.log('=== FULL AUDIT OF ALL 161 ACTIVE ITEMS ===');
active.forEach((item, idx) => {
  const cat = item.categories?.name || 'Uncategorized';
  console.log(`${idx + 1}. [${cat}] "${item.name}" | Price: ${item.price} EGP | ID: ${item.id}`);
});
