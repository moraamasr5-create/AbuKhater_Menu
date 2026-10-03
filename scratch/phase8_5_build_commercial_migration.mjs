import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function generateCommercialMigration() {
    console.log('=== PHASE 8.5: BUILDING COMPLETE COMMERCIAL VARIANT RECONSTRUCTION ===\n');

    const { data: items, error } = await supabase
        .from('menu_items')
        .select('id, name, price, categories(name)')
        .neq('status', 'hidden');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total Active items in DB: ${items.length}`);

    const commercialVariantsToBuild = [
        // --- 1. SANDWICHES (سندوتشات) ---
        {
            names: ['شاورما لحمة', 'شاورما لحم', 'ساندوتش شاورما لحم'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'كيزر', price: 60, order: 1 },
                { name: 'فينو وسط', price: 70, order: 2 },
                { name: 'فينو كبير', price: 80, order: 3 },
                { name: 'عيش سوري', price: 90, order: 4 }
            ]
        },
        {
            names: ['شيش طاووق', 'ساندوتش شيش طاووق'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 60, order: 1 },
                { name: 'فينو كبير', price: 70, order: 2 }
            ]
        },
        {
            names: ['فاهيتا فراخ', 'ساندوتش فاهيتا فراخ'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 80, order: 1 },
                { name: 'فينو كبير', price: 100, order: 2 }
            ]
        },
        {
            names: ['فراخ بانية', 'بانية'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 50, order: 1 },
                { name: 'فينو كبير', price: 55, order: 2 }
            ]
        },
        {
            names: ['كبدة جريل', 'ساندوتش كبدة جريل'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 35, order: 1 },
                { name: 'فينو كبير', price: 50, order: 2 }
            ]
        },
        {
            names: ['كفتة جريل', 'ساندوتش كفتة جريل', 'كفتة'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 35, order: 1 },
                { name: 'فينو كبير', price: 50, order: 2 }
            ]
        },
        {
            names: ['كرسبي', 'ساندوتش كرسبي'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 35, order: 1 },
                { name: 'فينو كبير', price: 50, order: 2 }
            ]
        },
        {
            names: ['استربس', 'ساندوتش أستربس'],
            categoryMatch: 'سندوتشات',
            variants: [
                { name: 'فينو وسط', price: 40, order: 1 },
                { name: 'فينو كبير', price: 55, order: 2 }
            ]
        },

        // --- 2. ROCKETS (صواريخ) ---
        {
            names: ['كفتة بلدي'],
            categoryMatch: 'الصواريخ',
            variants: [
                { name: 'صغير', price: 40, order: 1 },
                { name: 'كبير', price: 85, order: 2 }
            ]
        },
        {
            names: ['شاورما لحمة', 'شاورما لحم'],
            categoryMatch: 'الصواريخ',
            variants: [
                { name: 'صغير', price: 50, order: 1 },
                { name: 'كبير', price: 90, order: 2 }
            ]
        },

        // --- 3. GRILLS BY WEIGHT (مشويات بالوزن) ---
        {
            names: ['ريش ضاني'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 155, order: 1 },
                { name: 'ربع كيلو', price: 300, order: 2 },
                { name: 'نصف كيلو', price: 600, order: 3 }
            ]
        },
        {
            names: ['كباب ضاني'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 130, order: 1 },
                { name: 'ربع كيلو', price: 250, order: 2 },
                { name: 'نصف كيلو', price: 500, order: 3 }
            ]
        },
        {
            names: ['كباب أستيك'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 120, order: 1 },
                { name: 'ربع كيلو', price: 225, order: 2 },
                { name: 'نصف كيلو', price: 450, order: 3 }
            ]
        },
        {
            names: ['نيفا'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 120, order: 1 },
                { name: 'ربع كيلو', price: 225, order: 2 },
                { name: 'نصف كيلو', price: 450, order: 3 }
            ]
        },
        {
            names: ['كفتة ضاني', 'كفتة ضاني بلدي'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 90, order: 1 },
                { name: 'ربع كيلو', price: 175, order: 2 },
                { name: 'نصف كيلو', price: 350, order: 3 }
            ]
        },
        {
            names: ['كفتة كاندوز'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 80, order: 1 },
                { name: 'ربع كيلو', price: 150, order: 2 },
                { name: 'نصف كيلو', price: 300, order: 3 }
            ]
        },
        {
            names: ['طرب'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 100, order: 1 },
                { name: 'ربع كيلو', price: 200, order: 2 },
                { name: 'نصف كيلو', price: 400, order: 3 }
            ]
        },
        {
            names: ['سجق مشوي', 'سجق بلدي', 'سجق'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 90, order: 1 },
                { name: 'ربع كيلو', price: 175, order: 2 },
                { name: 'نصف كيلو', price: 350, order: 3 }
            ]
        },
        {
            names: ['مشكل حلويات', 'كبدة وقلب وكلاوي ومخاصي'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 80, order: 1 },
                { name: 'ربع كيلو', price: 150, order: 2 },
                { name: 'نصف كيلو', price: 300, order: 3 }
            ]
        },
        {
            names: ['فيلية مشوي', 'فيليه ع الفحم'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 65, order: 1 },
                { name: 'ربع كيلو', price: 130, order: 2 },
                { name: 'نصف كيلو', price: 250, order: 3 }
            ]
        },
        {
            names: ['شيش طاووق'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 65, order: 1 },
                { name: 'ربع كيلو', price: 130, order: 2 },
                { name: 'نصف كيلو', price: 250, order: 3 }
            ]
        },
        {
            names: ['لحم نعام'],
            categoryMatch: 'مشويـات',
            variants: [
                { name: 'ثمن كيلو', price: 200, order: 1 },
                { name: 'ربع كيلو', price: 400, order: 2 },
                { name: 'نصف كيلو', price: 800, order: 3 }
            ]
        },

        // --- 4. STUFFED & DUCKS (أوزان المحاشي والبط) ---
        {
            names: ['ممبار'],
            variants: [
                { name: 'ربع كيلو', price: 75, order: 1 },
                { name: 'نصف كيلو', price: 150, order: 2 },
                { name: 'كيلو ممبار', price: 300, order: 3 }
            ]
        },
        {
            names: ['بطـة مشوي', 'بط مشوي'],
            variants: [
                { name: 'ربع بطة', price: 250, order: 1 },
                { name: 'نصف بطة', price: 500, order: 2 }
            ]
        }
    ];

    const sqlStatements = [];
    let mappedCount = 0;

    sqlStatements.push('-- PHASE 8.5 COMMERCIAL VARIANT ALIGNMENT SCRIPT');
    sqlStatements.push('-- Idempotent INSERTs for menu_item_variants using exact DB Canonical UUIDs\n');

    for (const group of commercialVariantsToBuild) {
        let matched = null;
        for (const name of group.names) {
            const candidate = items.find(i => {
                if (i.name.trim() !== name) return false;
                if (group.categoryMatch && i.categories?.name !== group.categoryMatch) return false;
                return true;
            });
            if (candidate) {
                matched = candidate;
                break;
            }
        }

        if (matched) {
            mappedCount++;
            sqlStatements.push(`-- Canonical Product: [${matched.id}] "${matched.name}" (${matched.categories?.name})`);
            for (const v of group.variants) {
                sqlStatements.push(
                    `INSERT INTO menu_item_variants (menu_item_id, name, price, is_available, display_order) ` +
                    `VALUES ('${matched.id}', '${v.name}', ${v.price}, true, ${v.order}) ` +
                    `ON CONFLICT DO NOTHING;`
                );
            }
            sqlStatements.push('');
        } else {
            console.warn(`⚠️ Warning: Could not find DB item for ${group.names.join(' / ')}`);
        }
    }

    const sqlContent = sqlStatements.join('\n');
    fs.writeFileSync('scratch/phase8_5_commercial_variants.sql', sqlContent);

    console.log(`Successfully mapped all ${mappedCount} canonical products to their commercial variants.`);
    console.log(`Generated SQL written to scratch/phase8_5_commercial_variants.sql\n`);
}

generateCommercialMigration();
