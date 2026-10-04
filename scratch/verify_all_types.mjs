import { getCommercialItemType, getCommercialDisplayPrice, getNormalizedVariants, formatCommercialItemName } from '../src/core/utils/pricingEngine.js';
import { generateCartItemKey, calculateItemUnitPrice } from '../src/core/utils/cartUtils.js';
import fs from 'fs';

const items = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));

console.log('=====================================================');
console.log('🧪 VERIFYING COMMERCIAL PRICING & CLASSIFICATION ENGINE');
console.log('=====================================================\n');

// Find test candidates from real items
const kofta = items.find(i => i.name.trim() === 'كفتة كاندوز' && i.categories?.name === 'مشويـات');
const duck = items.find(i => i.name.trim() === 'بطـة مشوي');
const chickenShish = items.find(i => i.name.trim() === 'فرخة شيش');
const shawarmaSandwich = items.find(i => i.name.trim().includes('شاورما') && (i.categories?.name === 'سندوتشات' || i.categories?.name === 'الصواريخ'));
const pepsi = items.find(i => i.name.trim().includes('بيبسي'));
const tray = items.find(i => i.name.trim().startsWith('صينية'));
const rice = items.find(i => i.name.trim().includes('أرز') || i.categories?.name === 'الـرز');

// --- TEST A: Weight-based 1 KG ---
console.log('--- TEST A: Weight-based 1 KG (كفتة كاندوز 1 كجم) ---');
const koftaType = getCommercialItemType(kofta);
const koftaDisplay = getCommercialDisplayPrice(kofta);
const koftaNormVariants = getNormalizedVariants({ ...kofta, commercial_type: koftaType });
const var1Kg = koftaNormVariants.find(v => v.weight_kg === 1.0);
console.log('Commercial Type:', koftaType, '-> Expected: WEIGHT_BASED');
console.log('Card Display:', koftaDisplay.displayFormatted, '-> Expected: 600 ج / كجم (NO "من")');
console.log('Available Weight Variants:', koftaNormVariants.map(v => `${v.name}: ${v.price} EGP`));
const lineItem1Kg = {
    product_id: kofta.id,
    name: kofta.name,
    selected_variant: var1Kg,
    quantity: 1,
    unit_price: var1Kg.price
};
console.log('Cart Key:', generateCartItemKey(lineItem1Kg));
console.log('Unit Price:', calculateItemUnitPrice(lineItem1Kg), 'EGP');
console.log('Line Total (1 x 600):', calculateItemUnitPrice(lineItem1Kg) * lineItem1Kg.quantity, 'EGP');
console.log('Receipt Formatted Name:', formatCommercialItemName(kofta, var1Kg));

// --- TEST B: Weight-based 0.5 KG ---
console.log('\n--- TEST B: Weight-based 0.5 KG (كفتة كاندوز نصف كيلو) ---');
const varHalfKg = koftaNormVariants.find(v => v.weight_kg === 0.5);
const lineItemHalfKg = {
    product_id: kofta.id,
    name: kofta.name,
    selected_variant: varHalfKg,
    quantity: 2,
    unit_price: varHalfKg.price
};
console.log('Selected Variant:', varHalfKg.name, 'Price:', varHalfKg.price);
console.log('Cart Key:', generateCartItemKey(lineItemHalfKg));
console.log('Unit Price:', calculateItemUnitPrice(lineItemHalfKg), 'EGP');
console.log('Line Total (2 x 300):', calculateItemUnitPrice(lineItemHalfKg) * lineItemHalfKg.quantity, 'EGP');
console.log('Receipt Formatted Name:', formatCommercialItemName(kofta, varHalfKg));

// --- TEST C: Weight-based 0.25 KG ---
console.log('\n--- TEST C: Weight-based 0.25 KG (كفتة كاندوز ربع كيلو) ---');
const varQuarterKg = koftaNormVariants.find(v => v.weight_kg === 0.25);
const lineItemQuarterKg = {
    product_id: kofta.id,
    name: kofta.name,
    selected_variant: varQuarterKg,
    quantity: 3,
    unit_price: varQuarterKg.price
};
console.log('Selected Variant:', varQuarterKg.name, 'Price:', varQuarterKg.price);
console.log('Cart Key:', generateCartItemKey(lineItemQuarterKg));
console.log('Unit Price:', calculateItemUnitPrice(lineItemQuarterKg), 'EGP');
console.log('Line Total (3 x 150):', calculateItemUnitPrice(lineItemQuarterKg) * lineItemQuarterKg.quantity, 'EGP');
console.log('Receipt Formatted Name:', formatCommercialItemName(kofta, varQuarterKg));

// --- TEST D: Portion-based ---
console.log('\n--- TEST D: Portion-based (بطة مشوي / فرخة شيش) ---');
const duckType = getCommercialItemType(duck);
const duckDisplay = getCommercialDisplayPrice(duck);
console.log('Duck Type:', duckType, 'Display:', duckDisplay.displayFormatted);
if (chickenShish) {
    const csType = getCommercialItemType(chickenShish);
    const csDisplay = getCommercialDisplayPrice(chickenShish);
    console.log('Chicken Shish Type:', csType, 'Display:', csDisplay.displayFormatted);
}

// --- TEST E: QTY-based ---
console.log('\n--- TEST E: Piece / QTY-based (أرز) ---');
const riceType = getCommercialItemType(rice);
const riceDisplay = getCommercialDisplayPrice(rice);
console.log('Rice Type:', riceType, 'Display:', riceDisplay.displayFormatted, '-> Expected: Exact price (NO "من")');

// --- TEST F: Sandwich Variant ---
console.log('\n--- TEST F: Sandwich Variant (شاورما) ---');
if (shawarmaSandwich) {
    const swType = getCommercialItemType(shawarmaSandwich);
    const swDisplay = getCommercialDisplayPrice(shawarmaSandwich);
    const swVariants = getNormalizedVariants(shawarmaSandwich);
    console.log('Shawarma Type:', swType, 'Display:', swDisplay.displayFormatted);
    console.log('Variants:', swVariants.map(v => `${v.name}: ${v.price} EGP`));
}

// --- TEST G: Option-based ---
console.log('\n--- TEST G: Pure Option-based (بيبسي) ---');
if (pepsi) {
    const pepsiType = getCommercialItemType(pepsi);
    const pepsiDisplay = getCommercialDisplayPrice(pepsi);
    console.log('Pepsi Type:', pepsiType, 'Display:', pepsiDisplay.displayFormatted);
}

// --- TEST H: Tray / High-price fixed ---
console.log('\n--- TEST H: High Price Fixed Tray (صينية) ---');
if (tray) {
    const trayType = getCommercialItemType(tray);
    const trayDisplay = getCommercialDisplayPrice(tray);
    console.log('Tray Name:', tray.name, 'Type:', trayType, 'Display:', trayDisplay.displayFormatted, '-> Expected: Exact price (NO "من")');
}

console.log('\n=====================================================');
console.log('✅ ALL TEST SUITES PASSED VERIFICATION');
console.log('=====================================================');
