/**
 * 🏷️ Abu Khater Central Commercial Pricing & Classification Engine
 * 
 * Single Source of Truth for:
 * 1. Commercial Item Classification (WEIGHT_BASED, PORTION_BASED, VARIANT_BASED, OPTION_BASED, FIXED_COMMERCIAL, PIECE_QTY_BASED)
 * 2. Product Card Display Pricing (e.g. "600 ج / كجم" for weight items, exact prices for fixed trays/meals, "من X" only for real variant choices)
 * 3. Variant Normalization (Ensuring 1 KG, 0.5 KG, 0.25 KG, 0.125 KG are properly structured for weight products)
 * 4. Authoritative Line Total and Order Snapshot Formatting
 */

// Official Grills Sold by Weight in "مشويات"
const WEIGHT_PRODUCT_NAMES = new Set([
    'ريش ضاني', 'كباب ضاني', 'كباب أستيك', 'نيفا', 'كفتة ضاني', 'كفتة كاندوز',
    'طرب', 'سجق مشوي', 'مشكل حلويات', 'فيلية مشوي', 'ميكس مشويات',
    'ممبار'
]);

// Portion-based products (explicit cuts/portions)
const PORTION_PRODUCT_NAMES = new Set([
    'بطـة مشوي', 'فرخة شيش', 'فرخة تكا', 'فرخة جامبو', 'فرخـة شوايـة',
    'نصف فرخة', 'ربع فرخة', 'فرخة كاملة'
]);

/**
 * Classify any menu item into its authoritative commercial type
 * @param {Object} item 
 * @returns {'WEIGHT_BASED' | 'PORTION_BASED' | 'VARIANT_BASED' | 'OPTION_BASED' | 'FIXED_COMMERCIAL' | 'PIECE_QTY_BASED'}
 */
export function getCommercialItemType(item) {
    if (!item) return 'PIECE_QTY_BASED';

    const rawName = String(item.name || '').trim();
    const catName = String(item.categories?.name || item.category || '').trim();
    const catSlug = String(item.categories?.slug || item.category_slug || '').trim().toLowerCase();
    const variants = Array.isArray(item.variants || item.menu_item_variants) ? (item.variants || item.menu_item_variants) : [];
    const options = Array.isArray(item.option_groups || item.menu_item_option_groups) ? (item.option_groups || item.menu_item_option_groups) : [];
    const price = parseFloat(item.price) || 0;

    const isGrillsCat = catName === 'مشويـات' || catName === 'مشويات' || catSlug === 'grills';

    // 1. TYPE A — WEIGHT_BASED (Only Grills in Grills category sold by weight + Mombar with weight variants)
    if (
        (isGrillsCat && (WEIGHT_PRODUCT_NAMES.has(rawName) || rawName === 'شيش طاووق' || (rawName === 'لحم نعام' && price >= 800))) ||
        (rawName === 'ممبار' && variants.some(v => v.name?.includes('كيلو') || v.name?.includes('ربع')))
    ) {
        return 'WEIGHT_BASED';
    }

    // 2. TYPE B — PORTION_BASED (Duck, Whole Chicken, Half Chicken cuts)
    if (
        PORTION_PRODUCT_NAMES.has(rawName) ||
        rawName.includes('فرخة شيش') ||
        rawName.includes('فرخة تكا') ||
        rawName.includes('فرخة جامبو') ||
        rawName.includes('فرخـة شوايـة')
    ) {
        return 'PORTION_BASED';
    }

    // 3. TYPE D — VARIANT_BASED (Sandwiches, Rockets, and items with size/bread variants)
    if (
        (catName === 'سندوتشات' || catName === 'ساندوتشات' || catName === 'الصواريخ' || catName === 'كريب' || catSlug === 'sandwiches' || catSlug === 'crepes' || variants.length > 0) &&
        !WEIGHT_PRODUCT_NAMES.has(rawName) &&
        rawName !== 'وجبة بروست' &&
        rawName !== 'ممبار'
    ) {
        return 'VARIANT_BASED';
    }

    // 4. TYPE E — OPTION_BASED (Pure options like drinks with flavors)
    if (options.length > 0 && variants.length === 0) {
        return 'OPTION_BASED';
    }

    // 5. TYPE F — FIXED_COMMERCIAL (Trays, Casseroles, Set Meals, Hawawshi, Special trays)
    if (
        catName === 'صـوانـي' || catName === 'صواني' || catName === 'طـواجـن' || catName === 'طواجن' || catName === 'وجـبات' || catName === 'وجبات' ||
        catSlug === 'trays' || catSlug === 'casseroles' || catSlug === 'meals' ||
        rawName.startsWith('صينية') || rawName.startsWith('وجبة') || rawName.startsWith('طاجن') || rawName.startsWith('ورقة') ||
        rawName.startsWith('حواوشي') || rawName === 'موزة ضاني بالأرز' || rawName === 'تورتة وافل' ||
        rawName.startsWith('فتة شاورما') || rawName === 'وجبة بروست'
    ) {
        return 'FIXED_COMMERCIAL';
    }

    // 6. TYPE C — PIECE / QTY_BASED (Sides, Rice dishes, Macaroni dishes, single pieces like pigeon, desserts)
    return 'PIECE_QTY_BASED';
}

/**
 * Returns the normalized variants list for an item.
 * For WEIGHT_BASED items, ensures 1 KG (at base price), ½ KG, ¼ KG, and ⅛ KG exist and are sorted.
 * 
 * @param {Object} item 
 * @returns {Array} Normalized variants array
 */
export function getNormalizedVariants(item) {
    if (!item) return [];

    const rawVariants = Array.isArray(item.variants || item.menu_item_variants) ? [...(item.variants || item.menu_item_variants)] : [];
    const commercialType = item.commercial_type || getCommercialItemType(item);

    if (commercialType === 'WEIGHT_BASED') {
        const baseKgPrice = parseFloat(item.price) || 0;
        const resultVariants = [];

        // Check if 1 KG variant already exists in DB
        const has1KgVariant = rawVariants.some(v => 
            v.name?.includes('1 كيلو') || v.name?.includes('1 كجم') || v.name === 'كيلو' || v.name === '1 كغ'
        );

        if (!has1KgVariant && baseKgPrice > 0) {
            resultVariants.push({
                id: `${item.id}-1kg`,
                name: '1 كجم (كيلو كامل)',
                price: baseKgPrice,
                weight_kg: 1.0,
                is_available: true,
                display_order: 1
            });
        }

        // Add remaining DB variants or map weight attributes
        rawVariants.forEach(v => {
            const vName = String(v.name || '').trim();
            let weightVal = 1.0;
            if (vName.includes('ثمن') || vName.includes('1/8') || vName.includes('⅛')) weightVal = 0.125;
            else if (vName.includes('ربع') || vName.includes('1/4') || vName.includes('¼')) weightVal = 0.25;
            else if (vName.includes('نصف') || vName.includes('1/2') || vName.includes('½')) weightVal = 0.5;
            else if (vName.includes('1') || vName.includes('كيلو')) weightVal = 1.0;

            resultVariants.push({
                id: v.id,
                name: v.name,
                price: parseFloat(v.price) || (baseKgPrice * weightVal),
                weight_kg: weightVal,
                is_available: v.is_available !== false,
                display_order: v.display_order || (weightVal === 1 ? 1 : weightVal === 0.5 ? 2 : weightVal === 0.25 ? 3 : 4)
            });
        });

        // Sort descending by weight (1 KG -> 0.5 KG -> 0.25 KG -> 0.125 KG)
        return resultVariants.sort((a, b) => (b.weight_kg || 0) - (a.weight_kg || 0));
    }

    return rawVariants
        .filter(v => v && v.is_available !== false)
        .map(v => ({
            id: v.id,
            name: String(v.name || '').trim(),
            price: parseFloat(v.price) || 0,
            is_available: v.is_available !== false,
            display_order: parseInt(v.display_order, 10) || 0
        }))
        .sort((a, b) => a.display_order - b.display_order);
}

/**
 * Calculates display price text and unit for Product Cards according to commercial rules.
 * 
 * Rules:
 * - WEIGHT_BASED: Exact base price per KG (e.g. "600 ج / كجم") — NEVER "من 80"
 * - FIXED_COMMERCIAL & PIECE_QTY_BASED: Exact price (e.g. "250 ج.م") — NEVER "من"
 * - VARIANT_BASED: "من X ج.م" if multiple variant prices exist
 * - PORTION_BASED: "من X ج.م" if multiple portion prices exist, else exact
 * 
 * @param {Object} item 
 * @returns {{ text: string|number, unit: string, prefix: string, displayFormatted: string }}
 */
export function getCommercialDisplayPrice(item) {
    if (!item) return { text: '0', unit: 'ج.م', prefix: '', displayFormatted: '0 ج.م' };

    const commercialType = item.commercial_type || getCommercialItemType(item);
    const itemPrice = parseFloat(item.price) || 0;
    const variants = getNormalizedVariants(item);

    switch (commercialType) {
        case 'WEIGHT_BASED': {
            // Must show the real 1 KG base price clearly
            return {
                text: `${itemPrice}`,
                unit: 'ج / كجم',
                prefix: '',
                displayFormatted: `${itemPrice} ج / كجم`
            };
        }

        case 'PORTION_BASED': {
            if (variants.length > 0) {
                const prices = variants.map(v => v.price).filter(p => p > 0);
                const minPrice = prices.length > 0 ? Math.min(...prices) : itemPrice;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : itemPrice;
                const hasMultiple = minPrice !== maxPrice;
                return {
                    text: `${minPrice}`,
                    unit: 'ج.م',
                    prefix: hasMultiple ? 'من ' : '',
                    displayFormatted: `${hasMultiple ? 'من ' : ''}${minPrice} ج.م`
                };
            }
            return {
                text: `${itemPrice}`,
                unit: 'ج.م',
                prefix: '',
                displayFormatted: `${itemPrice} ج.م`
            };
        }

        case 'VARIANT_BASED': {
            if (variants.length > 0) {
                const prices = variants.map(v => v.price).filter(p => p > 0);
                const minPrice = prices.length > 0 ? Math.min(...prices) : itemPrice;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : itemPrice;
                const hasMultiple = minPrice !== maxPrice;
                return {
                    text: `${minPrice}`,
                    unit: 'ج.م',
                    prefix: hasMultiple ? 'من ' : '',
                    displayFormatted: `${hasMultiple ? 'من ' : ''}${minPrice} ج.م`
                };
            }
            return {
                text: `${itemPrice}`,
                unit: 'ج.م',
                prefix: '',
                displayFormatted: `${itemPrice} ج.م`
            };
        }

        case 'FIXED_COMMERCIAL':
        case 'PIECE_QTY_BASED':
        case 'OPTION_BASED':
        default: {
            return {
                text: `${itemPrice}`,
                unit: 'ج.م',
                prefix: '',
                displayFormatted: `${itemPrice} ج.م`
            };
        }
    }
}

/**
 * Returns Arabic label for modal variant picker based on item type
 * @param {'WEIGHT_BASED' | 'PORTION_BASED' | 'VARIANT_BASED' | 'OPTION_BASED' | 'FIXED_COMMERCIAL' | 'PIECE_QTY_BASED'} commercialType 
 * @returns {string} Section label
 */
export function getVariantSectionLabel(commercialType) {
    switch (commercialType) {
        case 'WEIGHT_BASED':
            return 'اختر الوزن المطلوب';
        case 'PORTION_BASED':
            return 'اختر الجزء / الحجم المطلوب';
        case 'VARIANT_BASED':
            return 'اختر الحجم ونوع الخبز';
        default:
            return 'اختر الحجم / التخصيص';
    }
}

/**
 * Formats a clean commercial line name for receipts and order snapshots
 * 
 * @param {Object} item 
 * @param {Object|null} selectedVariant 
 * @param {Array} selectedOptions 
 * @returns {string} Formatted commercial item name
 */
export function formatCommercialItemName(item, selectedVariant = null, selectedOptions = []) {
    let baseName = String(item?.name || item?.product_name || 'صنف').trim();

    if (selectedVariant && selectedVariant.name) {
        baseName += ` (${selectedVariant.name})`;
    }

    if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
        const optNames = selectedOptions
            .map(opt => typeof opt === 'string' ? opt : (opt.option_name || opt.name))
            .filter(Boolean);
        if (optNames.length > 0) {
            baseName += ` + [${optNames.join(', ')}]`;
        }
    }

    return baseName;
}
