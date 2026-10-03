import { supabase } from '../supabase/supabaseClient';

let _settingsCache = null;
let _settingsCacheTime = 0;
let _zonesCache = null;
let _zonesCacheTime = 0;
const SETTINGS_TTL_MS = 60000; // 1 minute in-memory cache

export const settingsService = {
    invalidateCache() {
        _settingsCache = null;
        _settingsCacheTime = 0;
        _zonesCache = null;
        _zonesCacheTime = 0;
    },

    /**
     * Fetch all authoritative restaurant settings from Supabase
     * @returns {Promise<Object>} key-value map of settings
     */
    async fetchRestaurantSettings(options = {}) {
        const force = options?.force === true;
        const now = Date.now();
        if (!force && _settingsCache && (now - _settingsCacheTime < SETTINGS_TTL_MS)) {
            return _settingsCache;
        }

        try {
            const { data, error } = await supabase
                .from('restaurant_settings')
                .select('key, value');

            if (error) throw error;

            const map = {};
            (data || []).forEach(row => {
                map[row.key] = row.value;
            });

            _settingsCache = map;
            _settingsCacheTime = Date.now();
            return map;
        } catch (error) {
            console.error('❌ Failed to fetch restaurant_settings from Supabase:', error);
            if (_settingsCache) return _settingsCache;
            throw error;
        }
    },

    /**
     * Fetch all active delivery zones from Supabase
     * @returns {Promise<Array>} list of active delivery zones
     */
    async fetchDeliveryZones(options = {}) {
        const force = options?.force === true;
        const now = Date.now();
        if (!force && _zonesCache && (now - _zonesCacheTime < SETTINGS_TTL_MS)) {
            return _zonesCache;
        }

        try {
            const { data, error } = await supabase
                .from('delivery_zones')
                .select('*')
                .eq('is_active', true)
                .order('zone_number', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            const res = data || [];
            _zonesCache = res;
            _zonesCacheTime = Date.now();
            return res;
        } catch (error) {
            console.error('❌ Failed to fetch delivery_zones from Supabase:', error);
            if (_zonesCache) return _zonesCache;
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
                    _settingsCache = null;
                    if (onSettingsChange) onSettingsChange();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'delivery_zones' },
                () => {
                    _zonesCache = null;
                    if (onZonesChange) onZonesChange();
                }
            )
            .subscribe();

        return channel;
    }
};

export default settingsService;
