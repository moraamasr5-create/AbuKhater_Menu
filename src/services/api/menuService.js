import { supabase } from '../supabase/supabaseClient';
import { isValidRawMenuItem, resolveItemCategory } from '../../core/utils/menuItem';
import { normalizeGoogleDriveImageUrl } from '../../core/utils/googleDrive';

let _menuCache = null;
let _menuCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

export const menuService = {
    /**
     * Invalidate in-memory menu cache
     */
    invalidateCache() {
        _menuCache = null;
        _menuCacheTime = 0;
    },

    /**
     * Fetch menu items directly from Supabase (Single Source of Truth)
     */
    async fetchMenu(options = {}) {
        const force = options?.force === true;
        const now = Date.now();

        if (!force && _menuCache && (now - _menuCacheTime < CACHE_TTL_MS)) {
            return { items: _menuCache, dataSource: 'cache' };
        }

        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select(`
                    id,
                    category_id,
                    name,
                    description,
                    price,
                    image_url,
                    unit_type,
                    base_qty,
                    status,
                    is_popular,
                    display_order,
                    categories (
                        id,
                        name,
                        slug,
                        display_order
                    ),
                    menu_item_variants (
                        id,
                        name,
                        price,
                        is_available,
                        display_order
                    ),
                    menu_item_option_groups (
                        id,
                        name,
                        selection_type,
                        required,
                        min_selections,
                        max_selections,
                        display_order,
                        menu_item_options (
                            id,
                            name,
                            price_delta,
                            is_available,
                            display_order
                        )
                    )
                `)
                .neq('status', 'hidden')
                .order('display_order', { ascending: true });

            if (error) throw error;
            if (!data) return { items: [], dataSource: 'supabase' };

            const mapped = data
                .map((item) => {
                    const categoryName = item.categories?.name || item.categories?.slug || 'general';
                    return this._mapSingleItem(item, categoryName);
                })
                .filter(Boolean)
                .sort((a, b) => {
                    const catDiff = (a.category_order || 999) - (b.category_order || 999);
                    if (catDiff !== 0) return catDiff;
                    return (a.display_order || 0) - (b.display_order || 0);
                });

            _menuCache = mapped;
            _menuCacheTime = Date.now();

            return { items: mapped, dataSource: 'supabase' };
        } catch (error) {
            console.error('❌ Failed to fetch menu from Supabase:', error);
            return {
                items: _menuCache || [],
                dataSource: 'error',
                error: error.message || 'فشل تحميل قائمة الطعام من الخادم'
            };
        }
    },

    _mapSingleItem(item, bucketCategory) {
        if (!isValidRawMenuItem(item)) return null;

        let imageUrl = item.image_url || '';
        imageUrl = normalizeGoogleDriveImageUrl(imageUrl);

        const resolvedCategory = resolveItemCategory(item, bucketCategory);
        const rawStatus = String(item.status || 'available').trim().toLowerCase();

        // 1. Normalize and sort dynamic variants (if any)
        const rawVariants = Array.isArray(item.menu_item_variants) ? item.menu_item_variants : [];
        const variants = rawVariants
            .filter(v => v && v.is_available !== false)
            .map(v => ({
                id: v.id,
                name: String(v.name || '').trim(),
                price: parseFloat(v.price) || 0,
                is_available: v.is_available !== false,
                display_order: parseInt(v.display_order, 10) || 0
            }))
            .sort((a, b) => a.display_order - b.display_order);

        // 2. Normalize and sort dynamic option groups & options (if any)
        const rawGroups = Array.isArray(item.menu_item_option_groups) ? item.menu_item_option_groups : [];
        const optionGroups = rawGroups
            .map(g => {
                const rawOptions = Array.isArray(g.menu_item_options) ? g.menu_item_options : [];
                const options = rawOptions
                    .filter(opt => opt && opt.is_available !== false)
                    .map(opt => ({
                        id: opt.id,
                        name: String(opt.name || '').trim(),
                        price_delta: parseFloat(opt.price_delta) || 0,
                        is_available: opt.is_available !== false,
                        display_order: parseInt(opt.display_order, 10) || 0
                    }))
                    .sort((a, b) => a.display_order - b.display_order);

                return {
                    id: g.id,
                    name: String(g.name || '').trim(),
                    selection_type: g.selection_type === 'multiple' ? 'multiple' : 'single',
                    required: Boolean(g.required),
                    min_selections: parseInt(g.min_selections, 10) || 0,
                    max_selections: g.max_selections != null ? parseInt(g.max_selections, 10) : 1,
                    display_order: parseInt(g.display_order, 10) || 0,
                    options
                };
            })
            .filter(g => g && Array.isArray(g.options) && g.options.length > 0)
            .filter(g => {
                // If item already has variants (which represent sizes/bread), eliminate redundant bread option groups
                if (variants.length > 0 && (g.name.includes('نوع العيش') || g.name.includes('العيش') || g.name.includes('نوع الخبز'))) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => a.display_order - b.display_order);

        const hasVariants = variants.length > 0;
        const hasOptions = optionGroups.length > 0;
        const hasConfiguration = hasVariants || hasOptions;

        return {
            id: item.id,
            name: String(item.name).trim(),
            price: parseFloat(item.price) || 0,
            description: item.description || '',
            image: imageUrl || '/logo.jpg',
            category: resolvedCategory,
            category_id: item.category_id || null,
            category_slug: item.categories?.slug || null,
            unit_type: item.unit_type || 'qty',
            base_qty: parseInt(item.base_qty, 10) || 1,
            status: rawStatus, // 'available' | 'out_of_stock' | 'paused'
            is_popular: Boolean(item.is_popular),
            display_order: item.display_order || 0,
            category_order: item.categories?.display_order || 999,
            variants,
            has_variants: hasVariants,
            option_groups: optionGroups,
            has_options: hasOptions,
            has_configuration: hasVariants || hasOptions,
            originalItem: item
        };
    }
};

export default menuService;
