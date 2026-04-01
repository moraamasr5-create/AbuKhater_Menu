import { createContext, useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { calculateDistance, getDeliveryFee } from '../utils/calculations';
import { RESTAURANT_LOCATION, FIXED_AREAS, DEFAULT_DELIVERY_FEE, MAX_DELIVERY_DISTANCE } from '../utils/constants';

export const CartContext = createContext(null);

/**
 * 🔴 مزود البيانات (Provider) لإدارة السلة وكل ما يتعلق بالطلب
 * بيتحكم في حالة المنتجات، الموقع، وطريقة الدفع في كل صفحات التطبيق
 */
export const CartProvider = ({ children }) => {
    const [cart, setCart] = useLocalStorage('restaurant-cart', []);
    const [orderType, setOrderType] = useState('delivery'); // 'delivery' للتوصيل أو 'pickup' للاستلام من الفرع
    const [location, setLocation] = useState(null);
    const [locationMethod, setLocationMethod] = useState('gps'); // 'gps', 'fixed', 'map'
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [distanceKm, setDistanceKm] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Customer Data Persistence
    const [customerData, setCustomerData] = useState({
        name: '',
        phone1: '',
        phone2: '',
        address: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('instapay');

    // 🔴 مراقبة أي تغيير في الموقع أو طريقة الاستلام عشان نحسب التوصيل فوراً
    // الحسبة دي بتتم في الخلفية وبتحمي السيستم من الأخطاء في مناطق التغطية
    useEffect(() => {
        if (orderType !== 'delivery') {
            setDeliveryFee(0);
            return;
        }

        if ((locationMethod === 'gps' || locationMethod === 'map') && location) {
            const dist = calculateDistance(
                RESTAURANT_LOCATION.lat,
                RESTAURANT_LOCATION.lon,
                location.lat,
                location.lon
            );

            if (dist > MAX_DELIVERY_DISTANCE) {
                setDistanceKm(dist);
                setDeliveryFee(0); // Flag for out of range
            } else {
                setDistanceKm(dist);
                setDeliveryFee(getDeliveryFee(dist));
            }
        } else if (locationMethod === 'fixed' && selectedAreaId) {
            const area = FIXED_AREAS.find(a => a.id === selectedAreaId);
            setDeliveryFee(area ? area.fee : 0);
            setDistanceKm(0);
        } else {
            setDeliveryFee(0);
            setDistanceKm(0);
        }
    }, [location, locationMethod, selectedAreaId, orderType]);

    const addToCart = (item) => {
        if (!item || !item.id) return; // 🛡️ حماية من إضافة عناصر غير صالحة
        // العميل طلب إن السلة متفتحش أوتوماتيك أول ما يضيف صنف
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
    };

    const updateQuantity = (itemId, delta) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.id === itemId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null; // Remove if 0
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    };

    const clearCart = () => setCart([]);

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
        setPaymentMethod
    }), [cart, orderType, location, locationMethod, selectedAreaId, distanceKm, deliveryFee, isCartOpen, customerData, paymentMethod]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
