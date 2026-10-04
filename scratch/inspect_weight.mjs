import fs from 'fs';

const items = JSON.parse(fs.readFileSync('scratch/all_menu_items_detailed.json', 'utf8'));
const weightNames = ['ريش ضاني', 'كباب ضاني', 'كباب أستيك', 'نيفا', 'كفتة ضاني', 'كفتة كاندوز', 'طرب', 'سجق مشوي', 'مشكل حلويات', 'فيلية مشوي', 'ميكس مشويات', 'ديك رومي مشوي', 'ممبار'];

const weightItems = items.filter(i => {
  const name = i.name.trim();
  const cat = i.categories?.name || '';
  return weightNames.includes(name) || (name === 'شيش طاووق' && cat === 'مشويـات') || (name === 'لحم نعام' && cat === 'مشويـات' && i.price >= 800);
});

console.log('Weight items count:', weightItems.length);
weightItems.forEach(w => {
  console.log(`\nItem: ${w.name} | Base Price: ${w.price} | Cat: ${w.categories?.name}`);
  const variants = w.menu_item_variants || [];
  if (variants.length > 0) {
    variants.forEach(v => console.log(`  - Variant: ${v.name} -> ${v.price} EGP (id: ${v.id})`));
  } else {
    console.log('  - No DB variants');
  }
});
