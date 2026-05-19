import { supabase } from '../supabase/supabaseClient';
import { isValidRawMenuItem, resolveItemCategory } from '../../core/utils/menuItem';
import { normalizeGoogleDriveImageUrl } from '../../core/utils/googleDrive';
import { menuItems as fallbackMenu } from '../../core/utils/data';

export const menuService = {
    /**
     * Fetch menu items directly from Supabase
     */
    async fetchMenu() {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select(`
                    *,
                    categories (
                        name,
                        slug,
                        display_order
                    )
                `);

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Supabase returned empty data');

            const mapped = data
                .map((item) => {
                    const categoryName = item.categories?.name || 'general';
                    return this._mapSingleItem(item, categoryName);
                })
                .filter(item => item && item.category !== 'general')
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

            return { items: mapped, dataSource: 'supabase' };
        } catch (error) {
            console.warn('⚠️ Supabase fetch failed, using local fallback...', error.message);
            return {
                items: this._getFallbackMenu(),
                dataSource: 'offline',
                error: error.message
            };
        }
    },

    _mapSingleItem(item, bucketCategory) {
        if (!isValidRawMenuItem(item)) return null;

        let imageUrl = item.image_url || item.image || item.img_url || '';
        imageUrl = normalizeGoogleDriveImageUrl(imageUrl);

        const resolvedCategory = resolveItemCategory(item, bucketCategory);
        const rawId = item.id ?? item.item_id;

        return {
            id: rawId,
            name: String(item.name).trim(),
            price: parseFloat(item.base_price || item.price || item.unit_price) || 0,
            description: item.comment || item.description || item.desc || '',
            image: imageUrl || '/logo.jpg',
            category: resolvedCategory,
            category_id: item.category_id || null,
            unit_type: item.unit_type || 'qty',
            base_qty: parseInt(item.base_qty) || 1,
            status: (item.status || 'available').toString().toLowerCase(),
            display_order: item.display_order || 0,
            category_order: item.categories?.display_order || 999,
            originalItem: item
        };
    },

    _getFallbackMenu() {
        return fallbackMenu
            .filter(isValidRawMenuItem)
            .map((item) => {
                const raw = item.image || '';
                const normalized = normalizeGoogleDriveImageUrl(raw);
                return {
                    ...item,
                    image: normalized || raw || '/logo.jpg',
                    status: 'available'
                };
            });
    }
};

export default menuService;


