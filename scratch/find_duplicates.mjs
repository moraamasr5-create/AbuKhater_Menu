import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scratch/all_items_db.json', 'utf8'));
const active = items.filter(i => i.status !== 'hidden');

console.log('=== FINDING ALL SIBLING/DUPLICATE ROWS IN DB BY CATEGORY ===\n');

const byCatAndName = {};
active.forEach(item => {
  const cat = item.categories?.name || 'Uncategorized';
  // normalize name
  let normName = item.name.trim().replace(/\s+/g, ' ');
  if (normName === 'شاورما لحم') normName = 'شاورما لحمة';
  const key = `${cat}:::${normName}`;
  if (!byCatAndName[key]) byCatAndName[key] = [];
  byCatAndName[key].push(item);
});

let duplicateGroupCount = 0;
let totalDuplicateRows = 0;

for (const [key, list] of Object.entries(byCatAndName)) {
  if (list.length > 1) {
    duplicateGroupCount++;
    totalDuplicateRows += (list.length - 1);
    const [cat, name] = key.split(':::');
    console.log(`[${cat}] "${name}" -> ${list.length} rows in DB:`);
    list.forEach(i => console.log(`   - ID: ${i.id} | Price: ${i.price} EGP | Status: ${i.status}`));
  }
}

console.log(`\nFound ${duplicateGroupCount} groups with identical names, total extra rows: ${totalDuplicateRows}`);
