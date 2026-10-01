import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    X,
    Search,
    Clock,
    Bike,
    ChefHat,
    CheckCircle2,
    XCircle,
    Phone,
    MapPin,
    AlertCircle,
    RotateCcw,
    Receipt,
    Wallet,
    Sparkles,
    ChevronLeft,
    ShoppingBag,
    ArrowRight,
    Utensils,
    History
} from 'lucide-react';
import { orderService } from '../../services/api';
import { supabase } from '../../services/supabase/supabaseClient';
import { formatCurrency } from '../../core/utils/formatters';
import TurnstileWidget from '../../components/common/TurnstileWidget';

const STATUS_STEPS = [
    { key: 'pending', label: 'تم استلام الطلب', desc: 'تم استلام طلبك ومراجعته في النظام', icon: Clock },
    { key: 'preparing', label: 'جاري التحضير', desc: 'يتم تجهيز وجباتك طازجة في المطبخ', icon: ChefHat },
    { key: 'ready', label: 'الطلب جاهز', desc: 'تم تجهيز الوجبة وجاهزة للخروج مع المندوب', icon: CheckCircle2 },
    { key: 'out_for_delivery', label: 'في الطريق إليك', desc: 'الطلب مع مندوب التوصيل في طريقه لعنوانك', icon: Bike },
    { key: 'delivered', label: 'تم التسليم بنجاح', desc: 'بالهناء والشفاء! نتمنى لك تجربة ممتعة', icon: Sparkles }
];

const getStepIndex = (status) => {
    switch (status) {
        case 'pending':
        case 'pending_timer':
        case 'waiting_driver':
            return 0;
        case 'preparing':
            return 1;
        case 'ready':
            return 2;
        case 'driver_assigned':
        case 'out_for_delivery':
            return 3;
        case 'delivered':
        case 'completed':
            return 4;
        default:
            return 0;
    }
};

const formatOrderDate = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('ar-EG', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(date);
    } catch {
        return '';
    }
};

const OrderTrackingModal = ({ isOpen, onClose, initialOrderNumber, initialPhone }) => {
    const [phone, setPhone] = useState(initialPhone || '');
    const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
    const [showOrderNumInput, setShowOrderNumInput] = useState(Boolean(initialOrderNumber));
    const [recentOrders, setRecentOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState(null);

    // Fetch up to 3 recent orders by phone (and optional order number)
    const performSearch = useCallback(async (ph, num, autoSelectId = null, tokenOverride = null) => {
        const cleanPh = (ph || '').trim();
        const cleanNum = (num || '').trim();

        if (!cleanPh && !cleanNum) {
            setError('يرجى إدخال رقم الهاتف المسجل به الطلب للاستعلام.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Save phone to localStorage for convenient auto-fill
            if (cleanPh) {
                try {
                    localStorage.setItem('customer_tracking_phone', cleanPh);
                } catch {
                    // ignore storage errors
                }
            }

            const result = await orderService.fetchRecentOrders({
                phone: cleanPh || null,
                orderNumber: cleanNum || null,
                limit: 3,
                turnstileToken: tokenOverride || turnstileToken
            });

            setHasSearched(true);

            if (!result || !result.success || !result.orders || result.orders.length === 0) {
                setRecentOrders([]);
                setSelectedOrder(null);
                setError(result?.message || 'لم يتم العثور على أي طلبات مسجلة بهذا الرقم.');
            } else {
                const orders = result.orders;
                setRecentOrders(orders);
                setError(null);

                // Auto-select logic:
                // 1. If explicit autoSelectId provided, pick that one
                // 2. Else if an orderNumber was searched, pick that specific order
                // 3. Else if there's only 1 order or an active order, pick it
                // 4. Otherwise stay on the list view for customer selection
                if (autoSelectId) {
                    const matched = orders.find(o => o.order_id === autoSelectId);
                    if (matched) setSelectedOrder(matched);
                } else if (cleanNum) {
                    const matched = orders.find(o => 
                        String(o.order_number).replace(/[^0-9]/g, '') === cleanNum.replace(/[^0-9]/g, '') ||
                        o.order_id === cleanNum
                    );
                    setSelectedOrder(matched || orders[0]);
                } else if (orders.length === 1) {
                    setSelectedOrder(orders[0]);
                } else if (result.active_order_id) {
                    const active = orders.find(o => o.order_id === result.active_order_id);
                    if (active) setSelectedOrder(active);
                }
            }
        } catch (err) {
            console.error('Customer recent orders fetch error:', err);
            setError('تعذر الاستعلام عن الطلبات حالياً. يرجى التأكد من اتصال الإنترنت والمحاولة ثانية.');
            setRecentOrders([]);
            setSelectedOrder(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial search when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let targetPhone = initialPhone || '';
        let targetNum = initialOrderNumber || '';

        // If props are missing, check localStorage for last phone or successful order
        if (!targetPhone && !targetNum) {
            try {
                const savedPhone = localStorage.getItem('customer_tracking_phone');
                if (savedPhone) {
                    targetPhone = savedPhone;
                } else {
                    const stored = localStorage.getItem('lastSuccessfulOrder');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        targetNum = parsed?.order?.order_number || '';
                        targetPhone = parsed?.order?.customer?.phone1 || parsed?.order?.customer?.phone || '';
                    }
                }
            } catch {
                // ignore
            }
        }

        if (targetPhone) setPhone(targetPhone);
        if (targetNum) {
            setOrderNumber(targetNum);
            setShowOrderNumInput(true);
        }

        if (targetPhone || targetNum) {
            performSearch(targetPhone, targetNum);
        }
    }, [isOpen, initialOrderNumber, initialPhone, performSearch]);

    // Live Realtime updates when viewing an ACTIVE order
    useEffect(() => {
        if (!selectedOrder?.order_id || !selectedOrder?.is_active) return;

        const channel = supabase
            .channel(`live-track-${selectedOrder.order_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${selectedOrder.order_id}`
                },
                async (payload) => {
                    console.log('⚡ Live Order Status Update Received:', payload.new);
                    // Re-fetch authoritative tracking payload for this order
                    try {
                        const updated = await orderService.trackOrder({ orderId: selectedOrder.order_id });
                        if (updated && updated.found) {
                            setSelectedOrder(prev => ({
                                ...prev,
                                ...updated
                            }));
                            // Also refresh recent orders list in background
                            if (phone) {
                                orderService.fetchRecentOrders({ phone, limit: 3 })
                                    .then(res => {
                                        if (res?.orders) setRecentOrders(res.orders);
                                    })
                                    .catch(() => {});
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to refresh live tracking order:', e);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedOrder?.order_id, selectedOrder?.is_active, phone]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isDelivered = selectedOrder && ['delivered', 'completed'].includes(selectedOrder.status);
    const isCancelled = selectedOrder && ['cancelled', 'failed_delivery'].includes(selectedOrder.status);
    const isActive = selectedOrder && selectedOrder.is_active && !isDelivered && !isCancelled;
    const currentStepIndex = selectedOrder ? getStepIndex(selectedOrder.status) : -1;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracking-modal-title"
            dir="rtl"
            className="fixed inset-0 z-[200] bg-dark-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-lg bg-dark-900 border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-dark-950/70">
                    <div className="flex items-center gap-2.5">
                        {selectedOrder ? (
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
                                title="العودة لقائمة الطلبات"
                            >
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Bike size={20} />
                            </div>
                        )}
                        <div>
                            <h2 id="tracking-modal-title" className="text-lg sm:text-xl font-black text-white">
                                {selectedOrder ? `تفاصيل ${selectedOrder.order_number}` : 'متابعة وتتبع الطلبات'}
                            </h2>
                            <p className="text-[11px] text-slate-400 font-bold">
                                {selectedOrder
                                    ? (isActive ? '🔴 تتبع مباشر وحي لحالة طلبك' : (isDelivered ? '✅ طلب مكتمل ومغلق' : 'طلب ملغي'))
                                    : 'أدخل رقم هاتفك لعرض ومتابعة آخر طلباتك'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
                        aria-label="إغلاق"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Container */}
                <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                    {/* Search Form (Always accessible or when no order selected) */}
                    {!selectedOrder && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                performSearch(phone, orderNumber);
                            }}
                            className="space-y-3.5 bg-dark-950/60 p-4 rounded-3xl border border-white/5"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                    <Phone size={14} className="text-primary" />
                                    <span>رقم هاتف العميل (نقطة البحث الأساسية)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        placeholder="مثال: 01012345678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-dark-900 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-primary focus:outline-none text-right font-mono"
                                        dir="ltr"
                                    />
                                    {phone && (
                                        <button
                                            type="button"
                                            onClick={() => setPhone('')}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Optional Order Number toggle */}
                            <div>
                                {!showOrderNumInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowOrderNumInput(true)}
                                        className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                                    >
                                        + البحث برقم طلب محدد (اختياري)
                                    </button>
                                ) : (
                                    <div className="animate-in fade-in duration-200">
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                            رقم الطلب (اختياري)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="مثال: 1042 أو #1042"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:border-primary focus:outline-none text-center font-mono"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Cloudflare Turnstile Verification */}
                            <TurnstileWidget
                                onVerify={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken(null)}
                            />

                            <button
                                type="submit"
                                disabled={loading || (!phone && !orderNumber)}
                                className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/25"
                            >
                                {loading ? (
                                    <RotateCcw size={18} className="animate-spin" />
                                ) : (
                                    <Search size={18} />
                                )}
                                <span>عرض ومتابعة طلباتي</span>
                            </button>
                        </form>
                    )}

                    {/* Error Notice */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs animate-in shake">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="font-bold leading-relaxed">{error}</span>
                        </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* VIEW 1: RECENT ORDERS LIST (Phone Search Result)             */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    {!selectedOrder && hasSearched && recentOrders.length > 0 && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <History size={14} className="text-primary" />
                                    <span>آخر الطلبات المسجلة ({recentOrders.length})</span>
                                </h3>
                                <span className="text-[10px] text-slate-500 font-bold">اضغط على أي طلب للتفاصيل</span>
                            </div>

                            <div className="space-y-2.5">
                                {recentOrders.map((ord) => {
                                    const ordDelivered = ['delivered', 'completed'].includes(ord.status);
                                    const ordCancelled = ['cancelled', 'failed_delivery'].includes(ord.status);
                                    const ordActive = ord.is_active && !ordDelivered && !ordCancelled;

                                    return (
                                        <div
                                            key={ord.order_id}
                                            onClick={() => setSelectedOrder(ord)}
                                            className={`p-4 rounded-3xl border transition-all cursor-pointer text-right flex flex-col gap-3 group active:scale-[0.99] ${
                                                ordActive
                                                    ? 'bg-primary/5 border-primary/40 hover:border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                                                    : 'bg-dark-950/70 border-white/5 hover:border-white/15'
                                            }`}
                                        >
                                            {/* Card Top: Order Number & Status Badge */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono font-black text-base">
                                                        {ord.order_number}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        ({ord.order_type === 'delivery' ? 'توصيل' : 'استلام'})
                                                    </span>
                                                </div>

                                                {/* Status Badge */}
                                                <div>
                                                    {ordActive ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                            {ord.status_label_ar} (نشط)
                                                        </span>
                                                    ) : ordDelivered ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                            <CheckCircle2 size={12} />
                                                            <span>مكتمل</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                                                            <XCircle size={12} />
                                                            <span>ملغي</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Middle: Price, Time & Item Count */}
                                            <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2.5">
                                                <div className="text-slate-400 text-[11px] flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>{formatOrderDate(ord.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 text-[11px]">
                                                        {ord.items_count > 0 ? `${ord.items_count} أصناف` : ''}
                                                    </span>
                                                    <span className="text-primary font-black font-mono text-sm">
                                                        {formatCurrency(ord.total_amount)}
                                                    </span>
                                                    <ChevronLeft size={16} className="text-slate-500 group-hover:text-primary transition-colors -mr-1" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* VIEW 2: ORDER DETAIL & LIFECYCLE TIMELINE                    */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    {selectedOrder && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {/* Return to List Button (if multiple orders exist) */}
                            {recentOrders.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-xs text-primary hover:text-orange-400 font-bold flex items-center gap-1 transition-colors py-1"
                                >
                                    <ArrowRight size={14} />
                                    <span>الرجوع لجميع طلباتي ({recentOrders.length})</span>
                                </button>
                            )}

                            {/* 1. If COMPLETED/DELIVERED: Clear Final Conclusion Banner */}
                            {isDelivered && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 text-center space-y-2.5 shadow-lg shadow-emerald-500/5 animate-in zoom-in-95 duration-300">
                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-emerald-400">
                                        تم تسليم الطلب بنجاح! 🎉
                                    </h3>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm mx-auto">
                                        بالهناء والشفاء من أسرة <strong className="text-white">مطعم وكافيه أبو خاطر</strong>. نتمنى لك تجربة ممتعة!
                                    </p>
                                    <div className="pt-2 text-[11px] text-emerald-300/70 font-bold border-t border-emerald-500/20">
                                        هذا الطلب مغلق ومكتمل كسجل سابق.
                                    </div>
                                </div>
                            )}

                            {/* 2. If CANCELLED: Clear Cancellation Banner */}
                            {isCancelled && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-3.5 text-red-400">
                                    <XCircle size={28} className="shrink-0" />
                                    <div>
                                        <h4 className="font-black text-sm">تم إلغاء هذا الطلب</h4>
                                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            {selectedOrder.cancellation_reason
                                                ? `سبب الإلغاء: ${selectedOrder.cancellation_reason}`
                                                : 'يرجى التواصل مع إدارة المطعم للاستفسار أو لإعادة الطلب.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Summary Card */}
                            <div className="bg-dark-950/70 rounded-3xl p-4 sm:p-5 border border-white/5 space-y-3.5">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">طلب رقم</span>
                                        <span className="text-white font-mono font-black text-lg sm:text-xl">{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">المبلغ الإجمالي</span>
                                        <span className="text-primary font-black text-lg sm:text-xl font-mono">{formatCurrency(selectedOrder.total_amount)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Receipt size={14} />
                                        <span>النوع:</span>
                                        <strong className="text-white font-bold">
                                            {selectedOrder.order_type === 'delivery' ? 'توصيل منزلي' : 'استلام من المطعم'}
                                        </strong>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-left justify-end">
                                        <Wallet size={14} className="text-slate-400" />
                                        <span className="text-slate-400">الدفع:</span>
                                        <span className="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            {selectedOrder.payment_status_label_ar || 'تم'}
                                        </span>
                                    </div>
                                </div>

                                {selectedOrder.delivery_address && (
                                    <div className="flex items-start gap-2 text-xs text-slate-400 bg-dark-900/60 p-2.5 rounded-xl border border-white/5">
                                        <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                                        <span className="text-slate-300 font-medium leading-relaxed">{selectedOrder.delivery_address}</span>
                                    </div>
                                )}

                                {selectedOrder.pilot_name && (
                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                                                <Bike size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold block">مندوب التوصيل</span>
                                                <span className="text-white font-bold text-xs">{selectedOrder.pilot_name}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-primary font-black bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                                            في طريقه إليك
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Status Timeline (Shown prominently for active and closed orders) */}
                            {!isCancelled && (
                                <div className="bg-dark-950/40 rounded-3xl p-5 border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                            مراحل دورة الطلب
                                        </h3>
                                        {isActive && (
                                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse border border-primary/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                مباشر
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative space-y-6 before:absolute before:right-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-dark-800">
                                        {STATUS_STEPS.map((step, idx) => {
                                            const isDone = idx < currentStepIndex || isDelivered;
                                            const isCurrent = idx === currentStepIndex && !isDelivered;
                                            const StepIcon = step.icon;

                                            return (
                                                <div key={step.key} className="relative flex items-start gap-4">
                                                    <div
                                                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                            isDone
                                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/20'
                                                                : isCurrent
                                                                ? 'bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20 animate-pulse'
                                                                : 'bg-dark-800 text-slate-600 border border-white/5'
                                                        }`}
                                                    >
                                                        {isDone ? (
                                                            <CheckCircle2 size={16} />
                                                        ) : (
                                                            <StepIcon size={15} />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <div className="flex items-center justify-between">
                                                            <h4
                                                                className={`text-sm font-bold leading-none ${
                                                                    isCurrent
                                                                        ? 'text-primary font-black'
                                                                        : isDone
                                                                        ? 'text-white'
                                                                        : 'text-slate-500'
                                                                }`}
                                                            >
                                                                {step.label}
                                                            </h4>
                                                            {isCurrent && (
                                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse border border-primary/20">
                                                                    الآن
                                                                </span>
                                                            )}
                                                            {isDone && idx === STATUS_STEPS.length - 1 && (
                                                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                                    اكتمل
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                                            {step.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-1">
                                {isDelivered && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
                                    >
                                        <Utensils size={16} />
                                        <span>تصفح المنيو لطلب وجبة جديدة</span>
                                    </button>
                                )}

                                <a
                                    href="tel:01038035884"
                                    className="w-full py-3 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-white/5 transition-all"
                                >
                                    <Phone size={14} className="text-primary" />
                                    <span>الاتصال بإدارة المطعم للمساعدة</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

OrderTrackingModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    initialOrderNumber: PropTypes.string,
    initialPhone: PropTypes.string
};

export default OrderTrackingModal;
