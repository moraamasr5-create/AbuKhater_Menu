import { orderService } from '../../services/api';

const DEVICE_ORDERS_KEY = 'customer_device_orders';
const LEGACY_ORDER_KEY = 'lastSuccessfulOrder';

/**
 * Get or create a persistent device identifier
 */
export const getDeviceIdentifier = () => {
    try {
        let deviceId = localStorage.getItem('device_user_id');
        if (!deviceId) {
            deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem('device_user_id', deviceId);
        }
        return deviceId;
    } catch {
        return 'default_device';
    }
};

/**
 * Check if an order is recent (within 24 hours or currently active)
 */
export const isOrderRecent = (createdAt, status) => {
    // If order is actively progressing in kitchen/delivery pipeline, always show it
    const activeStatuses = ['pending', 'pending_timer', 'preparing', 'ready', 'driver_assigned', 'out_for_delivery', 'waiting_driver'];
    if (status && activeStatuses.includes(status)) return true;

    if (!createdAt) return true;
    const orderTime = new Date(createdAt).getTime();
    if (isNaN(orderTime)) return true;

    // 24 hours maximum threshold for finished/cancelled orders
    const maxAgeMs = 24 * 60 * 60 * 1000;
    return (Date.now() - orderTime) <= maxAgeMs;
};

/**
 * Retrieve saved order descriptors for this device
 */
export const getStoredDeviceOrders = () => {
    try {
        const stored = localStorage.getItem(DEVICE_ORDERS_KEY);
        let orders = stored ? JSON.parse(stored) : [];

        if (!Array.isArray(orders)) orders = [];

        // Backward compatibility: import legacy single lastSuccessfulOrder if not already present
        const legacy = localStorage.getItem(LEGACY_ORDER_KEY);
        if (legacy) {
            try {
                const parsedLegacy = JSON.parse(legacy);
                const legacyOrder = parsedLegacy?.order || parsedLegacy?.data;
                if (legacyOrder) {
                    const legacyId = legacyOrder.order_id || legacyOrder.id || null;
                    const legacyNum = legacyOrder.order_number || legacyOrder.orderNumber || null;
                    const legacyPhone = legacyOrder.customer?.phone_1 || legacyOrder.customer?.phone1 || legacyOrder.customer_phone || null;
                    const legacyTime = parsedLegacy.timestamp || legacyOrder.created_at || null;

                    if (legacyId || legacyNum) {
                        const exists = orders.some(o =>
                            (legacyId && o.id === legacyId) ||
                            (legacyNum && o.order_number === legacyNum)
                        );
                        if (!exists) {
                            orders.unshift({
                                id: legacyId,
                                order_number: legacyNum,
                                phone: legacyPhone,
                                created_at: legacyTime || new Date().toISOString()
                            });
                        }
                    }
                }
            } catch {
                // ignore legacy parse errors
            }
        }

        // Deduplicate by id or order_number and preserve newest order
        const unique = [];
        const seen = new Set();
        for (const item of orders) {
            const key = item.id || item.order_number;
            if (key && !seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }

        return unique.slice(0, 10);
    } catch (e) {
        console.error('Failed to read device orders:', e);
        return [];
    }
};

/**
 * Save a newly placed order to this device's local record
 */
export const saveDeviceOrder = (orderInfo) => {
    if (!orderInfo) return;
    try {
        const id = orderInfo.id || orderInfo.order_id || orderInfo.supabaseId || null;
        const orderNumber = orderInfo.order_number || orderInfo.orderNumber || orderInfo.orderId || null;
        const phone = orderInfo.phone || orderInfo.customerPhone || orderInfo.customer?.phone_1 || orderInfo.customer?.phone1 || null;
        const createdAt = orderInfo.created_at || orderInfo.timestamp || new Date().toISOString();

        if (!id && !orderNumber) return;

        const existing = getStoredDeviceOrders();
        const filtered = existing.filter(o => {
            if (id && o.id === id) return false;
            if (orderNumber && o.order_number === orderNumber) return false;
            return true;
        });

        const updated = [{ id, order_number: orderNumber, phone, created_at: createdAt }, ...filtered].slice(0, 10);
        localStorage.setItem(DEVICE_ORDERS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save device order:', e);
    }
};

/**
 * Fetch authoritative live status for the last 2 orders of this device from Supabase
 */
export const fetchDeviceRecentOrders = async () => {
    const stored = getStoredDeviceOrders();
    if (!stored || stored.length === 0) {
        return [];
    }

    // Target the last 2 orders stored on this device
    const targetOrders = stored.slice(0, 2);

    const promises = targetOrders.map(async (item) => {
        try {
            const res = await orderService.trackOrder({
                orderId: item.id || null,
                orderNumber: item.order_number || null,
                phone: item.phone || null
            });

            if (res && res.found) {
                // Ensure order meets the recency requirement
                if (isOrderRecent(res.created_at || item.created_at, res.status)) {
                    return res;
                }
            }
            return null;
        } catch (err) {
            console.warn('Failed to fetch order tracking for item:', item, err);
            return null;
        }
    });

    const results = await Promise.allSettled(promises);
    const validOrders = [];

    results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
            validOrders.push(r.value);
        }
    });

    // Sort by created_at descending (newest first)
    validOrders.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
    });

    return validOrders.slice(0, 2);
};

export default {
    getDeviceIdentifier,
    isOrderRecent,
    getStoredDeviceOrders,
    saveDeviceOrder,
    fetchDeviceRecentOrders
};
