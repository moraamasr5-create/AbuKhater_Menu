import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { calculateDistance, getDeliveryFee, calculateServiceFee } from '../utils/calculations';
import { RESTAURANT_LOCATION, MAX_DELIVERY_DISTANCE } from '../constants';
import { settingsService } from '../../services/api';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useLocalStorage('restaurant-cart', []);
    const [orderType, setOrderType] = useState('delivery'); // 'delivery' أو 'pickup'
    const [location, setLocation] = useState(null);
    const [locationMethod, setLocationMethod] = useState('gps'); // 'gps', 'fixed', 'map'
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [distanceKm, setDistanceKm] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Dynamic settings & zones from Supabase (SSOT)
    const [restaurantSettings, setRestaurantSettings] = useState({});
    const [deliveryZones, setDeliveryZones] = useState([]);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // Customer Data Persistence
    const [customerData, setCustomerData] = useState({
        name: '',
        phone1: '',
        phone2: '',
        address: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('instapay');

    // 🔴 جلب الإعدادات ومناطق التوصيل من Supabase مع الاشتراك اللحظي
    const loadSettingsAndZones = useCallback(async () => {
        try {
            const [settings, zones] = await Promise.all([
                settingsService.fetchRestaurantSettings().catch(err => {
                    console.warn('⚠️ Could not fetch settings:', err);
                    return {};
                }),
                settingsService.fetchDeliveryZones().catch(err => {
                    console.warn('⚠️ Could not fetch zones:', err);
                    return [];
                })
            ]);
            setRestaurantSettings(settings);
            setDeliveryZones(zones);
        } catch (error) {
            console.error('❌ Failed to load initial settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    }, []);

    useEffect(() => {
        loadSettingsAndZones();

        const channel = settingsService.subscribeToSettings(
            () => {
                settingsService.fetchRestaurantSettings().then(setRestaurantSettings).catch(console.error);
            },
            () => {
                settingsService.fetchDeliveryZones().then(setDeliveryZones).catch(console.error);
            }
        );

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [loadSettingsAndZones]);

    // Restaurant coords & max distance derived from live settings
    const restLat = parseFloat(restaurantSettings.restaurant_lat) || RESTAURANT_LOCATION.lat;
    const restLng = parseFloat(restaurantSettings.restaurant_lng) || RESTAURANT_LOCATION.lon;
    const maxDistance = parseFloat(restaurantSettings.max_delivery_distance_km) || MAX_DELIVERY_DISTANCE;
    const isRestaurantOpen = restaurantSettings.is_restaurant_open !== 'false';
    const isDeliveryEnabled = restaurantSettings.delivery_enabled !== 'false';

    // 🔴 مراقبة أي تغيير في الموقع أو طريقة الاستلام لحساب التوصيل فوراً طبقاً لبيانات Supabase
    useEffect(() => {
        if (orderType !== 'delivery') {
            setDeliveryFee(0);
            return;
        }

        if ((locationMethod === 'gps' || locationMethod === 'map') && location) {
            const dist = calculateDistance(
                restLat,
                restLng,
                location.lat,
                location.lon
            );

            if (dist > maxDistance) {
                setDistanceKm(dist);
                setDeliveryFee(0); // Flag for out of range
            } else {
                setDistanceKm(dist);
                const exactFee = getDeliveryFee(dist, restaurantSettings);
                setDeliveryFee(exactFee);
            }
        } else if (locationMethod === 'fixed' && selectedAreaId) {
            const zone = deliveryZones.find(z => z.id === selectedAreaId || z.name === selectedAreaId);
            setDeliveryFee(zone ? parseFloat(zone.fee) : 0);
            setDistanceKm(0);
        } else {
            setDeliveryFee(0);
            setDistanceKm(0);
        }
    }, [location, locationMethod, selectedAreaId, orderType, restaurantSettings, deliveryZones, restLat, restLng, maxDistance]);

    const addToCart = useCallback((item) => {
        if (!item || !item.id) return;
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    }, [setCart]);

    const removeFromCart = useCallback((itemId) => {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
    }, [setCart]);

    const updateQuantity = useCallback((itemId, delta) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.id === itemId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    }, [setCart]);

    const clearCart = useCallback(() => setCart([]), [setCart]);

    const value = useMemo(() => ({
        cart,
        orderType,
        location,
        locationMethod,
        setLocationMethod,
        selectedAreaId,
        setSelectedAreaId,
        distanceKm,
        deliveryFee,
        isCartOpen,
        setIsCartOpen,
        setOrderType,
        setLocation,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        customerData,
        setCustomerData,
        paymentMethod,
        setPaymentMethod,
        restaurantSettings,
        deliveryZones,
        isLoadingSettings,
        isRestaurantOpen,
        isDeliveryEnabled,
        maxDistance
    }), [
        cart,
        orderType,
        location,
        locationMethod,
        selectedAreaId,
        distanceKm,
        deliveryFee,
        isCartOpen,
        customerData,
        paymentMethod,
        restaurantSettings,
        deliveryZones,
        isLoadingSettings,
        isRestaurantOpen,
        isDeliveryEnabled,
        maxDistance,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
    ]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
