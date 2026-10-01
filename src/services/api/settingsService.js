import { supabase } from '../supabase/supabaseClient';

export const settingsService = {
    /**
     * Fetch all authoritative restaurant settings from Supabase
     * @returns {Promise<Object>} key-value map of settings
     */
    async fetchRestaurantSettings() {
        try {
            const { data, error } = await supabase
                .from('restaurant_settings')
                .select('key, value');

            if (error) throw error;

            const map = {};
            (data || []).forEach(row => {
                map[row.key] = row.value;
            });

            return map;
        } catch (error) {
            console.error('❌ Failed to fetch restaurant_settings from Supabase:', error);
            throw error;
        }
    },

    /**
     * Fetch all active delivery zones from Supabase
     * @returns {Promise<Array>} list of active delivery zones
     */
    async fetchDeliveryZones() {
        try {
            const { data, error } = await supabase
                .from('delivery_zones')
                .select('*')
                .eq('is_active', true)
                .order('zone_number', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Failed to fetch delivery_zones from Supabase:', error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time changes on restaurant_settings and delivery_zones
     */
    subscribeToSettings(onSettingsChange, onZonesChange) {
        const channel = supabase
            .channel(`settings-realtime-${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'restaurant_settings' },
                () => {
                    if (onSettingsChange) onSettingsChange();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'delivery_zones' },
                () => {
                    if (onZonesChange) onZonesChange();
                }
            )
            .subscribe();

        return channel;
    }
};

export default settingsService;
