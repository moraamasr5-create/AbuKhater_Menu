import { supabase } from '../supabase/supabaseClient';
import { isValidRawMenuItem, resolveItemCategory } from '../../core/utils/menuItem';
import { normalizeGoogleDriveImageUrl } from '../../core/utils/googleDrive';

export const menuService = {
    /**
     * Fetch menu items directly from Supabase (Single Source of Truth)
     */
    async fetchMenu() {
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

            return { items: mapped, dataSource: 'supabase' };
        } catch (error) {
            console.error('❌ Failed to fetch menu from Supabase:', error);
            return {
                items: [],
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
            originalItem: item
        };
    }
};

export default menuService;
