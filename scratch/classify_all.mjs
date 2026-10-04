import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));

// Classification Engine
const classified = {
  WEIGHT_BASED: [],
  PORTION_BASED: [],
  PIECE_QTY_BASED: [],
  VARIANT_BASED: [],
  OPTION_BASED: [],
  FIXED_COMMERCIAL: []
};

// Weight products list from official menu (Grills sold by kg/quarter/half/eighth + Mombar)
const WEIGHT_PRODUCT_NAMES = new Set([
  'ريش ضاني', 'كباب ضاني', 'كباب أستيك', 'نيفا', 'كفتة ضاني', 'كفتة كاندوز',
  'طرب', 'سجق مشوي', 'مشكل حلويات', 'فيلية مشوي', 'ميكس مشويات',
  'ديك رومي مشوي', 'ممبار'
]);

// Portion products (Explicit portion cuts like half/whole chicken, duck)
const PORTION_PRODUCT_NAMES = new Set([
  'بطـة مشوي', 'فرخة شيش', 'فرخة تكا', 'فرخة جامبو', 'فرخـة شوايـة '
]);

items.forEach(item => {
  const catName = item.categories?.name || '';
  const catSlug = item.categories?.slug || '';
  const name = item.name.trim();
  const variants = item.menu_item_variants || [];
  const options = item.menu_item_option_groups || [];
  const isHidden = item.status === 'hidden';

  // 1. Check if weight based
  if (
    (catName === 'مشويـات' || catSlug === 'grills') &&
    (WEIGHT_PRODUCT_NAMES.has(name) || (name === 'شيش طاووق' && catName === 'مشويـات') || (name === 'لحم نعام' && catName === 'مشويـات' && item.price >= 800))
  ) {
    classified.WEIGHT_BASED.push({ ...item, commercialType: 'WEIGHT_BASED' });
  }
  // 2. Check if portion based
  else if (
    PORTION_PRODUCT_NAMES.has(name) ||
    name === 'نصف فرخة' || name === 'ربع فرخة'
  ) {
    classified.PORTION_BASED.push({ ...item, commercialType: 'PORTION_BASED' });
  }
  // 3. Check if variant based (Sandwiches, Rockets, etc. with size/bread variants)
  else if (
    (catName === 'سندوتشات' || catName === 'الصواريخ' || variants.length > 0) &&
    !WEIGHT_PRODUCT_NAMES.has(name) &&
    name !== 'وجبة بروست' && name !== 'ممبار' && name !== 'بطـة مشوي' && name !== 'فرخة شيش'
  ) {
    classified.VARIANT_BASED.push({ ...item, commercialType: 'VARIANT_BASED' });
  }
  // 4. Check if Option based (items with pure option groups like drinks)
  else if (options.length > 0 && variants.length === 0) {
    classified.OPTION_BASED.push({ ...item, commercialType: 'OPTION_BASED' });
  }
  // 5. Fixed commercial products (Trays, Casseroles, Meals, Dishes with fixed price)
  else if (
    catName === 'صـوانـي' || catName === 'طـواجـن' || catName === 'وجـبات' ||
    name.startsWith('صينية') || name.startsWith('وجبة') || name.startsWith('طاجن') || name.startsWith('ورقة') ||
    name === 'موزة ضاني بالأرز' || name === 'حواوشي ضاني' || name === 'حواوشي كاندوز' || name === 'حواوشي جريل مخصوص' ||
    name === 'تورتة وافل' || name === 'فتة شاورما لحمة' || name === 'فتة شاورما فراخ' || name === 'وجبة بروست'
  ) {
    classified.FIXED_COMMERCIAL.push({ ...item, commercialType: 'FIXED_COMMERCIAL' });
  }
  // 6. Piece / QTY based (Sides, Rice dishes, Pasta dishes, single pieces like pigeon, desserts)
  else {
    classified.PIECE_QTY_BASED.push({ ...item, commercialType: 'PIECE_QTY_BASED' });
  }
});

console.log('=== CLASSIFICATION SUMMARY ===');
console.log('1. WEIGHT_BASED:    ', classified.WEIGHT_BASED.length);
console.log('2. PORTION_BASED:   ', classified.PORTION_BASED.length);
console.log('3. PIECE_QTY_BASED: ', classified.PIECE_QTY_BASED.length);
console.log('4. VARIANT_BASED:   ', classified.VARIANT_BASED.length);
console.log('5. OPTION_BASED:    ', classified.OPTION_BASED.length);
console.log('6. FIXED_COMMERCIAL:', classified.FIXED_COMMERCIAL.length);
console.log('Total items:        ', items.length);

fs.writeFileSync('scratch/classification_result_detailed.json', JSON.stringify(classified, null, 2));
