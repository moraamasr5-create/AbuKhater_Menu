import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function analyze() {
    const { data: allItems, error } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id, display_order, categories(id, name, slug)')
        .order('display_order');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Loaded ${allItems.length} items from Supabase.\n`);

    // Let's classify all items
    const classification = {
        KEEP_CANONICAL: [],
        MAP_TO_VARIANT: [],
        MAP_TO_OPTION: [],
        KEEP_SEPARATE: [],
        NEEDS_CONFIRMATION: [],
        ALREADY_HIDDEN: []
    };

    // Save full JSON for inspection
    fs.writeFileSync('scratch/all_items_db.json', JSON.stringify(allItems, null, 2));

    // Analyze each item
    for (const item of allItems) {
        const cat = item.categories?.name || '';
        const name = item.name.trim();

        if (item.status === 'hidden') {
            classification.ALREADY_HIDDEN.push({ id: item.id, name, cat, price: item.price });
            continue;
        }

        // Logic check against canonical tree
        // 1. Sandwiches & bread duplicates
        // e.g. "شاورما فراخ فينو", "شاورما فراخ سوري", "شاورما لحمة فينو", etc.
        const isBreadVar = /(كيزر|فينو|سوري|مخبوز|كبير خاص|وسط|عائلي)/.test(name) && 
                           (name.includes('شاورما') || name.includes('برجر') || name.includes('كبدة') || name.includes('كفتة') || name.includes('شيش') || name.includes('فاهيتا') || name.includes('بانيه') || name.includes('كرسبي') || name.includes('استربس') || name.includes('أستربس'));

        // 2. Grills by weight duplicates
        // e.g. "كفتة كاندوز ربع", "كفتة كاندوز نصف", "طرب ربع", etc.
        const isWeightVar = /(ثمن|ربع|نصف|كيلو|1\/8|1\/4|1\/2)/.test(name) &&
                            (cat.includes('مشوي') || cat.includes('محاشي') || name.includes('ممبار'));

        // 3. Broast pieces duplicates
        const isBroastVar = /(2 قطعة|3 قطع|10 قطع)/.test(name) && name.includes('بروست');

        // 4. Platters
        const isPlatter = cat.includes('صواني') || name.includes('صينية');

        // 5. Casseroles & Pasta
        const isCasserole = cat.includes('طواجن') || cat.includes('مكرونات') || cat.includes('الرز');

        // Let's classify
        if (isPlatter) {
            classification.KEEP_SEPARATE.push({ id: item.id, name, cat, price: item.price, reason: 'صينية عائلية مستقلة التركيبة والسعر' });
        } else if (name === 'إضافة سلطات' || name === 'إضافة جبنة' || name.includes('إضافة')) {
            classification.MAP_TO_OPTION.push({ id: item.id, name, cat, price: item.price, reason: 'إضافة اختيارية (Option/Addon)' });
        } else if (isBreadVar || isWeightVar || isBroastVar) {
            // Check if this is the canonical base or a secondary variant row
            // If it has explicit size in name like "شاورما فراخ فينو كبير" and there is a base "شاورما فراخ"
            classification.MAP_TO_VARIANT.push({ id: item.id, name, cat, price: item.price, reason: 'صف يمثل حجم/وزن/خبز سيتم ربطه بـ Variant وتحويل حالته إلى hidden' });
        } else {
            classification.KEEP_CANONICAL.push({ id: item.id, name, cat, price: item.price, reason: 'Canonical Product رئيسي معتمد' });
        }
    }

    console.log('=== CLASSIFICATION SUMMARY ===');
    console.log(`- KEEP_CANONICAL: ${classification.KEEP_CANONICAL.length}`);
    console.log(`- MAP_TO_VARIANT (to become hidden): ${classification.MAP_TO_VARIANT.length}`);
    console.log(`- MAP_TO_OPTION: ${classification.MAP_TO_OPTION.length}`);
    console.log(`- KEEP_SEPARATE (Platters/Specific Meals): ${classification.KEEP_SEPARATE.length}`);
    console.log(`- ALREADY_HIDDEN: ${classification.ALREADY_HIDDEN.length}`);
    console.log(`- NEEDS_CONFIRMATION: ${classification.NEEDS_CONFIRMATION.length}`);

    fs.writeFileSync('scratch/classification_result.json', JSON.stringify(classification, null, 2));
    console.log('\nDetailed classification written to scratch/classification_result.json');
}

analyze();
