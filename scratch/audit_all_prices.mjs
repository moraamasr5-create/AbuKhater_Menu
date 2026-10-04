import fs from 'fs';
import { getCommercialItemType, getCommercialDisplayPrice } from '../src/core/utils/pricingEngine.js';

const items = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));

console.log('=== AUDITING ALL MENU ITEMS PRICING DISPLAY ===\n');
const withMin = [];
const weightItems = [];
const fixedItems = [];

items.forEach(item => {
  const cType = getCommercialItemType(item);
  const display = getCommercialDisplayPrice({ ...item, commercial_type: cType });
  if (display.prefix) {
    withMin.push({ name: item.name, cat: item.categories?.name, type: cType, display: display.displayFormatted, variants: item.menu_item_variants });
  } else if (cType === 'WEIGHT_BASED') {
    weightItems.push({ name: item.name, cat: item.categories?.name, display: display.displayFormatted });
  } else {
    fixedItems.push({ name: item.name, cat: item.categories?.name, type: cType, display: display.displayFormatted });
  }
});

console.log(`1. WEIGHT_BASED Items (${weightItems.length} items) - All showing base price per KG, ZERO "من":`);
weightItems.forEach(w => console.log(`   - ${w.name} (${w.cat}) -> ${w.display}`));

console.log(`\n2. Items showing "من" (${withMin.length} items) - Must have multiple real price options:`);
withMin.forEach(m => {
  const varPrices = (m.variants || []).map(v => `${v.name}: ${v.price} EGP`).join(', ');
  console.log(`   - ${m.name} (${m.cat}) [${m.type}] -> ${m.display} | Variants: [${varPrices}]`);
});

console.log(`\n3. FIXED / SINGLE-PRICE Items (${fixedItems.length} items) - Exact price, ZERO "من":`);
console.log(`   Sample fixed items:`);
fixedItems.slice(0, 10).forEach(f => console.log(`   - ${f.name} (${f.cat}) [${f.type}] -> ${f.display}`));
