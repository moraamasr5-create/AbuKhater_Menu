import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scratch/all_items_db.json', 'utf8'));

const analysisReport = {
  KEEP: [],
  MAP_TO_VARIANT: [],
  MAP_TO_OPTION: [],
  KEEP_SEPARATE: [],
  NEEDS_CONFIRMATION: [],
  UNUSED_DUPLICATE: []
};

items.forEach(item => {
  const cat = item.categories?.name || 'Uncategorized';
  const name = item.name.trim();

  if (item.status === 'hidden') {
    analysisReport.UNUSED_DUPLICATE.push({
      id: item.id,
      name,
      cat,
      price: item.price,
      reason: 'سجل مخفي مسبقاً بعد دمجه كـ Variant تجريبياً'
    });
    return;
  }

  // Check if option/add-on
  if (name.includes('إضافة') || name === 'جبنة موتزريلا' || name === 'سلطات مشويات') {
    analysisReport.MAP_TO_OPTION.push({
      id: item.id,
      name,
      cat,
      price: item.price,
      reason: 'خيار إضافي اختياري (Add-on/Option)'
    });
    return;
  }

  // Check sibling duplicate rows in Sandwiches
  // e.g. "شاورما لحم" (60 EGP) vs "شاورما لحمة" (80 EGP)
  // "شيش طاووق" (70 EGP) vs "شيش طاووق" (60 EGP)
  // "فاهيتا فراخ" (75 EGP / 60 EGP / 50 EGP)
  // "استربس" (65 EGP / 40 EGP)
  // "كرسبي" (55 EGP / 35 EGP)
  // "هوت دوج" (40 EGP / 35 EGP)
  // "لحم نعام" (800 EGP / 250 EGP)
  if (item.id === '09cf1eb1-46c9-4af4-9568-695ccf721280' || // شاورما لحم 60 (كيزر)
      item.id === 'bc58760f-c491-462f-9e02-8abaa48e7c79' || // شيش طاووق 70 (كبير)
      item.id === '47e3941e-c5de-4e22-b231-5bbb3d425c6c' || // فاهيتا فراخ 75
      item.id === '4cc70f73-519f-4e6f-8790-85e5750d05be' || // فاهيتا فراخ 60
      item.id === '191497fb-1640-4fd0-9c0e-0ddc909f61e7' || // استربس 65
      item.id === '6674af39-ed86-4abf-8599-1e389a45afaf' || // كرسبي 55
      item.id === 'a76d176a-e83c-49e7-9a7a-61800d2b8809' || // هوت دوج 40
      item.id === 'c53e6ec4-8d0a-4e67-a8fe-0ffd624c130d') { // لحم نعام 250 (وزن ربع)
    analysisReport.MAP_TO_VARIANT.push({
      id: item.id,
      name,
      cat,
      price: item.price,
      reason: 'سجل مكرر يمثل حجماً أو وزناً لنفس المنتج، سيتم ربطه بـ Variant على الـ Canonical Product وإخفاؤه'
    });
    return;
  }

  // Cross-category separation
  if (name.includes('شاورما') || name.includes('كفتة') || name.includes('كبدة') || name.includes('سجق')) {
    analysisReport.KEEP_SEPARATE.push({
      id: item.id,
      name,
      cat,
      price: item.price,
      reason: `منتج مستقل في قسم [${cat}] (لا يدمج مع سندوتشات أو طواجن أو أرز يحمل نفس اسم البروتين)`
    });
    return;
  }

  // Platters & Casseroles & Grills
  if (cat.includes('صواني') || cat.includes('طواجن') || cat.includes('وجبات') || cat.includes('مشويات')) {
    analysisReport.KEEP_SEPARATE.push({
      id: item.id,
      name,
      cat,
      price: item.price,
      reason: `منتج تجاري مستقل في قسم [${cat}]`
    });
    return;
  }

  // Regular Canonical Products
  analysisReport.KEEP.push({
    id: item.id,
    name,
    cat,
    price: item.price,
    reason: 'منتج رئيسي معتمد (Canonical Product)'
  });
});

console.log('=== CLASSIFICATION SUMMARY ===');
console.log(`- KEEP (Base Canonical Products): ${analysisReport.KEEP.length}`);
console.log(`- KEEP_SEPARATE (Commercially distinct): ${analysisReport.KEEP_SEPARATE.length}`);
console.log(`- MAP_TO_VARIANT (Duplicate size/bread rows): ${analysisReport.MAP_TO_VARIANT.length}`);
console.log(`- MAP_TO_OPTION (Add-ons): ${analysisReport.MAP_TO_OPTION.length}`);
console.log(`- UNUSED_DUPLICATE (Already hidden): ${analysisReport.UNUSED_DUPLICATE.length}`);
console.log(`- NEEDS_CONFIRMATION: ${analysisReport.NEEDS_CONFIRMATION.length}`);

fs.writeFileSync('scratch/full_classification_report.json', JSON.stringify(analysisReport, null, 2));
