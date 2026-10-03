import { generateCartItemKey, calculateItemUnitPrice } from '../src/core/utils/cartUtils.js';

console.log('--- Testing Phase 5: Cart Configuration Identity & Pricing ---');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passCount++;
    } else {
        console.error(`❌ FAIL: ${testName}`);
        failCount++;
    }
}

// 1. Simple Product (No variants, no options)
const simpleItem = { id: 'pepsi-123', name: 'بيبسي', price: 20 };
const simpleKey = generateCartItemKey(simpleItem);
const simplePrice = calculateItemUnitPrice(simpleItem);
assert(simpleKey === 'pepsi-123', 'Test A1: Simple item key matches product id');
assert(simplePrice === 20, 'Test A2: Simple item price matches base price');

// 2. Product with Variant (e.g. half chicken)
const chickenHalf = {
    id: 'ch-01',
    name: 'فرخة شواية',
    price: 300,
    selected_variant: { id: 'var-half', name: 'نصف فرخة', price: 160 }
};
const chickenQuarter = {
    id: 'ch-01',
    name: 'فرخة شواية',
    price: 300,
    selected_variant: { id: 'var-quarter', name: 'ربع فرخة', price: 90 }
};
const halfKey = generateCartItemKey(chickenHalf);
const quarterKey = generateCartItemKey(chickenQuarter);
const halfPrice = calculateItemUnitPrice(chickenHalf);
const quarterPrice = calculateItemUnitPrice(chickenQuarter);

assert(halfKey === 'ch-01::var-half::none', 'Test D1: Half chicken key is deterministic');
assert(quarterKey === 'ch-01::var-quarter::none', 'Test D2: Quarter chicken key is deterministic');
assert(halfKey !== quarterKey, 'Test D3: Variants have distinct keys');
assert(halfPrice === 160, 'Test D4: Half chicken authoritative price is 160 (from variant)');
assert(quarterPrice === 90, 'Test D5: Quarter chicken authoritative price is 90 (from variant)');

// 3. Product with Options in different order (Deterministic sorting)
const shawarmaOrder1 = {
    id: 'shw-1',
    name: 'شاورما',
    price: 80,
    selected_options: [
        { option_id: 'opt-bread-kaiser', option_name: 'كايزر', price_delta: 0 },
        { option_id: 'opt-extra-cheese', option_name: 'جبنة موزاريلا', price_delta: 15 }
    ]
};
const shawarmaOrder2 = {
    id: 'shw-1',
    name: 'شاورما',
    price: 80,
    selected_options: [
        { option_id: 'opt-extra-cheese', option_name: 'جبنة موزاريلا', price_delta: 15 },
        { option_id: 'opt-bread-kaiser', option_name: 'كايزر', price_delta: 0 }
    ]
};
const shwKey1 = generateCartItemKey(shawarmaOrder1);
const shwKey2 = generateCartItemKey(shawarmaOrder2);
const shwPrice1 = calculateItemUnitPrice(shawarmaOrder1);

assert(shwKey1 === 'shw-1::base::opt-bread-kaiser,opt-extra-cheese', 'Test E1: Key has sorted option IDs');
assert(shwKey1 === shwKey2, 'Test E2: Different option selection order produces IDENTICAL key');
assert(shwPrice1 === 95, 'Test E3: Shawarma unit price is 80 + 15 = 95');

// 4. Shawarma with different bread option (French bread)
const shawarmaFrench = {
    id: 'shw-1',
    name: 'شاورما',
    price: 80,
    selected_options: [
        { option_id: 'opt-bread-french', option_name: 'فرنساوي', price_delta: 5 }
    ]
};
const shwFrenchKey = generateCartItemKey(shawarmaFrench);
const shwFrenchPrice = calculateItemUnitPrice(shawarmaFrench);
assert(shwFrenchKey === 'shw-1::base::opt-bread-french', 'Test C1: French shawarma has distinct key');
assert(shwFrenchKey !== shwKey1, 'Test C2: Kaiser vs French shawarma do not merge');
assert(shwFrenchPrice === 85, 'Test C3: French shawarma price is 80 + 5 = 85');

// 5. Cart Simulation: Adding & Merging
let cart = [];

function simulateAddToCart(item, quantity = 1) {
    const key = generateCartItemKey(item);
    const unitPrice = calculateItemUnitPrice(item);
    const existingIndex = cart.findIndex(i => (i.cart_item_key || i.id) === key);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            ...item,
            id: key,
            cart_item_key: key,
            product_id: item.product_id || item.id,
            price: unitPrice,
            unit_price: unitPrice,
            quantity
        });
    }
}

// Add simple item
simulateAddToCart(simpleItem, 2);
assert(cart.length === 1 && cart[0].quantity === 2, 'Test B1: Simple item added with qty 2');

// Add Half Chicken
simulateAddToCart(chickenHalf, 1);
assert(cart.length === 2 && cart[1].id === halfKey, 'Test B2: Half chicken added as separate entry');

// Add Quarter Chicken
simulateAddToCart(chickenQuarter, 1);
assert(cart.length === 3 && cart[2].id === quarterKey, 'Test B3: Quarter chicken added as separate entry');

// Add Shawarma Kaiser x 1
simulateAddToCart(shawarmaOrder1, 1);
assert(cart.length === 4, 'Test B4: Shawarma Kaiser added');

// Add Shawarma Kaiser with reversed options x 2
simulateAddToCart(shawarmaOrder2, 2);
assert(cart.length === 4, 'Test B5: Shawarma Kaiser with reversed options merged into existing row');
assert(cart[3].quantity === 3, 'Test B6: Merged Shawarma Kaiser quantity is 1 + 2 = 3');

// 6. Subtotal Calculation
const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// Calculation:
// Simple Pepsi: 20 * 2 = 40
// Half Chicken: 160 * 1 = 160
// Quarter Chicken: 90 * 1 = 90
// Shawarma Kaiser: 95 * 3 = 285
// Total = 40 + 160 + 90 + 285 = 575
assert(subtotal === 575, `Test F1: Cart subtotal is exactly 575 (got ${subtotal})`);

// 7. Old Cart Data Compatibility (No crash, preserves items)
const legacyCart = [
    { id: 'old-item-1', name: 'كريب مشكل', price: 110, quantity: 1 }
];
const legacySubtotal = legacyCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
assert(legacySubtotal === 110, 'Test H1: Legacy cart items calculate subtotal correctly');
assert(generateCartItemKey(legacyCart[0]) === 'old-item-1', 'Test H2: Legacy cart items resolve key safely');

console.log(`\nResults: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
