import fs from 'fs';
const report = JSON.parse(fs.readFileSync('scratch/full_classification_report.json', 'utf8'));
console.log(`=== MAP_TO_VARIANT ITEMS (${report.MAP_TO_VARIANT.length} items) ===\n`);
report.MAP_TO_VARIANT.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.cat}] "${item.name}" | Price: ${item.price} EGP | ID: ${item.id}`);
});

console.log(`\n=== MAP_TO_OPTION ITEMS (${report.MAP_TO_OPTION.length} items) ===\n`);
report.MAP_TO_OPTION.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.cat}] "${item.name}" | Price: ${item.price} EGP | ID: ${item.id}`);
});
