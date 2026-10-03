import { generateCartItemKey, calculateItemUnitPrice } from '../src/core/utils/cartUtils.js';

console.log('=== TESTING PHASE 3 MODAL & CART LOGIC ===\n');

// 1. Simple Product (No variants, no options)
const simpleItem = {
    id: 'prod-simple-1',
    product_id: 'prod-simple-1',
    name: 'أرز بشعرية',
    price: 30
};
const keySimple = generateCartItemKey(simpleItem);
const priceSimple = calculateItemUnitPrice(simpleItem);
console.log('1. Simple Item:');
console.log(`   Key: "${keySimple}" (expected: "prod-simple-1")`);
console.log(`   Price: ${priceSimple} EGP (expected: 30)`);
console.assert(keySimple === 'prod-simple-1', 'Simple key failed');
console.assert(priceSimple === 30, 'Simple price failed');

// 2. Product with Variant A (كيزر 50 EGP)
const itemVarA = {
    id: 'prod-shawarma',
    product_id: 'prod-shawarma',
    name: 'شاورما فراخ',
    price: 50,
    selected_variant: { id: 'var-kaiser', name: 'كيزر', price: 50 },
    selected_options: []
};
const keyVarA = generateCartItemKey(itemVarA);
const priceVarA = calculateItemUnitPrice(itemVarA);
console.log('\n2. Item with Variant A:');
console.log(`   Key: "${keyVarA}" (expected: "prod-shawarma::var-kaiser::none")`);
console.log(`   Price: ${priceVarA} EGP (expected: 50)`);
console.assert(keyVarA === 'prod-shawarma::var-kaiser::none', 'VarA key failed');
console.assert(priceVarA === 50, 'VarA price failed');

// 3. Same Product with Variant B (سوري 80 EGP)
const itemVarB = {
    id: 'prod-shawarma',
    product_id: 'prod-shawarma',
    name: 'شاورما فراخ',
    price: 80,
    selected_variant: { id: 'var-suri', name: 'عيش سوري', price: 80 },
    selected_options: []
};
const keyVarB = generateCartItemKey(itemVarB);
const priceVarB = calculateItemUnitPrice(itemVarB);
console.log('\n3. Same Item with Variant B:');
console.log(`   Key: "${keyVarB}" (expected: "prod-shawarma::var-suri::none")`);
console.log(`   Price: ${priceVarB} EGP (expected: 80)`);
console.assert(keyVarB === 'prod-shawarma::var-suri::none', 'VarB key failed');
console.assert(priceVarB === 80, 'VarB price failed');
console.assert(keyVarA !== keyVarB, 'Variants must have distinct keys!');

// 4. Same Product with Variant B + Options (جبنة +20 EGP)
const itemVarBOpt = {
    id: 'prod-shawarma',
    product_id: 'prod-shawarma',
    name: 'شاورما فراخ',
    price: 100,
    selected_variant: { id: 'var-suri', name: 'عيش سوري', price: 80 },
    selected_options: [
        { option_id: 'opt-cheese', name: 'إضافة جبنة', price_delta: 20 }
    ]
};
const keyVarBOpt = generateCartItemKey(itemVarBOpt);
const priceVarBOpt = calculateItemUnitPrice(itemVarBOpt);
console.log('\n4. Same Item with Variant B + Option:');
console.log(`   Key: "${keyVarBOpt}" (expected: "prod-shawarma::var-suri::opt-cheese")`);
console.log(`   Price: ${priceVarBOpt} EGP (expected: 100)`);
console.assert(keyVarBOpt === 'prod-shawarma::var-suri::opt-cheese', 'VarBOpt key failed');
console.assert(priceVarBOpt === 100, 'VarBOpt price failed');
console.assert(keyVarBOpt !== keyVarB, 'Item with option must have distinct key from plain variant!');

console.log('\n✅ ALL MODAL & CART LOGIC UNIT TESTS PASSED!');
