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
import {
    GENERIC_NOT_FOUND_MESSAGE,
    maskPhoneNumber,
    getLockoutRemainingSeconds,
    setLockoutDuration,
    recordAndCheckPhoneActivity,
    recordSearchFailure,
    recordSearchSuccess
} from '../../core/utils/trackingSecurity';

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
    const [cooldownSeconds, setCooldownSeconds] = useState(getLockoutRemainingSeconds());
    const [isSuspiciousLocked, setIsSuspiciousLocked] = useState(false);

    // Cooldown countdown interval
    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setCooldownSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsSuspiciousLocked(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownSeconds]);

    // Fetch up to 3 recent orders by phone (and optional order number)
    const performSearch = useCallback(async (ph, num, autoSelectId = null, tokenOverride = null) => {
        const cleanPh = (ph || '').trim();
        const cleanNum = (num || '').trim();

        if (!cleanPh && !cleanNum) {
            setError('يرجى إدخال رقم الهاتف المسجل به الطلب للاستعلام.');
            return;
        }

        // Check active rate limit / cooldown lockout
        const activeLockout = getLockoutRemainingSeconds();
        if (activeLockout > 0) {
            setCooldownSeconds(activeLockout);
            setError(`تم إيقاف البحث مؤقتاً لحماية البيانات. يرجى الانتظار (${activeLockout} ثانية).`);
            return;
        }

        // Check suspicious multi-phone hopping activity
        if (cleanPh) {
            const activity = recordAndCheckPhoneActivity(cleanPh);
            if (activity.isSuspicious) {
                setLockoutDuration(120);
                setCooldownSeconds(120);
                setIsSuspiciousLocked(true);
                setError('⚠️ تم رصد محاولات بحث متعددة بأرقام مختلفة. لأسباب أمنية، تم تجميد البحث مؤقتاً لمدة دقيقتين.');
                return;
            }
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
                const { cooldownSec } = recordSearchFailure();
                if (cooldownSec > 0) {
                    setCooldownSeconds(cooldownSec);
                }
                setError(GENERIC_NOT_FOUND_MESSAGE);
            } else {
                recordSearchSuccess();
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
            const { cooldownSec } = recordSearchFailure();
            if (cooldownSec > 0) {
                setCooldownSeconds(cooldownSec);
            }
            setError(GENERIC_NOT_FOUND_MESSAGE);
            setRecentOrders([]);
            setSelectedOrder(null);
        } finally {
            setLoading(false);
        }
    }, [turnstileToken]);

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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-lg bg-dark-900 border border-white/[0.08] rounded-[1.75rem] sm:rounded-[2.25rem] shadow-2xl overflow-hidden flex flex-col max-h-[min(90dvh,720px)] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-white/[0.06] flex items-center justify-between bg-dark-800/30 shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {selectedOrder ? (
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-dark-800/80 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
                                title="العودة لقائمة الطلبات"
                            >
                                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                            </button>
                        ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <Bike size={18} className="sm:w-5 sm:h-5" />
                            </div>
                        )}
                        <div>
                            <h2 id="tracking-modal-title" className="text-base sm:text-lg font-black text-white leading-tight">
                                {selectedOrder ? `تفاصيل ${selectedOrder.order_number}` : 'متابعة وتتبع الطلبات'}
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-0.5">
                                {selectedOrder
                                    ? (isActive ? '🔴 تتبع مباشر وحي لحالة طلبك' : (isDelivered ? '✅ طلب مكتمل ومغلق' : 'طلب ملغي'))
                                    : 'أدخل رقم هاتفك لعرض ومتابعة آخر طلباتك'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-dark-800/80 border border-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all active:scale-95 shrink-0"
                        aria-label="إغلاق"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar overscroll-contain">
                    {/* Search Form (Always accessible or when no order selected) */}
                    {!selectedOrder && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                performSearch(phone, orderNumber);
                            }}
                            className="space-y-3.5 sm:space-y-4 bg-dark-950/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/[0.08]"
                        >
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                    <Phone size={14} className="text-primary shrink-0" />
                                    <span>رقم هاتف العميل (نقطة البحث الأساسية)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        placeholder="مثال: 01012345678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 sm:py-3.5 bg-dark-900 border border-white/[0.08] focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none transition-all text-right font-mono"
                                        dir="ltr"
                                    />
                                    {phone && (
                                        <button
                                            type="button"
                                            onClick={() => setPhone('')}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
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
                                        className="text-[11px] sm:text-xs text-primary hover:underline font-bold flex items-center gap-1 transition-all"
                                    >
                                        + البحث برقم طلب محدد (اختياري)
                                    </button>
                                ) : (
                                    <div className="space-y-1.5 sm:space-y-2 animate-in fade-in duration-200">
                                        <label className="text-[11px] sm:text-xs font-bold text-slate-400 pr-1 select-none">
                                            رقم الطلب (اختياري)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="مثال: 1042 أو #1042"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                            className="w-full px-4 py-2.5 sm:py-3 bg-dark-900 border border-white/[0.08] focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none text-center font-mono transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Cloudflare Turnstile Verification */}
                            <TurnstileWidget
                                onVerify={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken(null)}
                                theme="dark"
                            />

                            {/* Cooldown / Lockout Notice */}
                            {cooldownSeconds > 0 && (
                                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl sm:rounded-2xl flex items-center gap-2.5 text-amber-300 text-xs font-bold animate-in fade-in">
                                    <Clock size={16} className="text-amber-400 shrink-0 animate-pulse" />
                                    <span>
                                        {isSuspiciousLocked
                                            ? `تم إيقاف البحث مؤقتاً بسبب نشاط غير اعتيادي (${cooldownSeconds} ثانية).`
                                            : `تم إيقاف البحث مؤقتاً لحماية البيانات. يرجى الانتظار (${cooldownSeconds} ثانية)...`}
                                    </span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || cooldownSeconds > 0 || (!phone && !orderNumber)}
                                className="w-full py-3.5 sm:py-4 bg-primary hover:bg-orange-600 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {cooldownSeconds > 0 ? (
                                    <>
                                        <Clock size={18} className="animate-pulse text-white/80" />
                                        <span>يرجى الانتظار ({cooldownSeconds} ثانية)...</span>
                                    </>
                                ) : loading ? (
                                    <>
                                        <RotateCcw size={18} className="animate-spin" />
                                        <span>جاري التحقق والاستعلام...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search size={18} />
                                        <span>عرض ومتابعة طلباتي</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Error Notice */}
                    {error && (
                        <div className="p-3.5 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex items-center gap-3 text-red-400 text-xs sm:text-sm animate-in fade-in">
                            <AlertCircle size={18} className="shrink-0" />
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
                                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold">اضغط على أي طلب للتفاصيل</span>
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
                                            className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer text-right flex flex-col gap-2.5 sm:gap-3 group active:scale-[0.99] ${
                                                ordActive
                                                    ? 'bg-primary/5 border-primary/40 hover:border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                                                    : 'bg-dark-950/70 border-white/5 hover:border-white/15'
                                            }`}
                                        >
                                            {/* Card Top: Order Number & Status Badge */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono font-black text-sm sm:text-base">
                                                        {ord.order_number}
                                                    </span>
                                                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                                        ({ord.order_type === 'delivery' ? 'توصيل' : 'استلام'})
                                                    </span>
                                                </div>

                                                {/* Status Badge */}
                                                <div>
                                                    {ordActive ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-amber-400 bg-amber-500/10 px-2.5 sm:px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                            {ord.status_label_ar} (نشط)
                                                        </span>
                                                    ) : ordDelivered ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                            <CheckCircle2 size={12} />
                                                            <span>مكتمل</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                                                            <XCircle size={12} />
                                                            <span>ملغي</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Middle: Price, Time & Item Count */}
                                            <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2 sm:pt-2.5">
                                                <div className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>{formatOrderDate(ord.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 sm:gap-3">
                                                    <span className="text-slate-400 text-[10px] sm:text-[11px]">
                                                        {ord.items_count > 0 ? `${ord.items_count} أصناف` : ''}
                                                    </span>
                                                    <span className="text-primary font-black font-mono text-xs sm:text-sm">
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
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center space-y-2 shadow-lg shadow-emerald-500/5 animate-in zoom-in-95 duration-300">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <CheckCircle2 size={24} className="sm:w-7 sm:h-7" />
                                    </div>
                                    <h3 className="text-sm sm:text-base md:text-lg font-black text-emerald-400">
                                        تم تسليم الطلب بنجاح! 🎉
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed max-w-sm mx-auto">
                                        بالهناء والشفاء من أسرة <strong className="text-white">مطعم وكافيه أبو خاطر</strong>. نتمنى لك تجربة ممتعة!
                                    </p>
                                    <div className="pt-2 text-[10px] sm:text-[11px] text-emerald-300/70 font-bold border-t border-emerald-500/20">
                                        هذا الطلب مغلق ومكتمل كسجل سابق.
                                    </div>
                                </div>
                            )}

                            {/* 2. If CANCELLED: Clear Cancellation Banner */}
                            {isCancelled && (
                                <div className="p-3.5 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-2xl sm:rounded-3xl flex items-center gap-3 text-red-400">
                                    <XCircle size={24} className="shrink-0" />
                                    <div>
                                        <h4 className="font-black text-xs sm:text-sm">تم إلغاء هذا الطلب</h4>
                                        <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            {selectedOrder.cancellation_reason
                                                ? `سبب الإلغاء: ${selectedOrder.cancellation_reason}`
                                                : 'يرجى التواصل مع إدارة المطعم للاستفسار أو لإعادة الطلب.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Summary Card */}
                            <div className="bg-dark-950/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/5 space-y-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2.5 sm:pb-3">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">طلب رقم</span>
                                        <span className="text-white font-mono font-black text-base sm:text-lg">{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">المبلغ الإجمالي</span>
                                        <span className="text-primary font-black text-base sm:text-lg font-mono">{formatCurrency(selectedOrder.total_amount)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Receipt size={14} className="shrink-0" />
                                        <span>النوع:</span>
                                        <strong className="text-white font-bold">
                                            {selectedOrder.order_type === 'delivery' ? 'توصيل منزلي' : 'استلام من المطعم'}
                                        </strong>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-left justify-end">
                                        <Wallet size={14} className="text-slate-400 shrink-0" />
                                        <span className="text-slate-400">الدفع:</span>
                                        <span className="text-emerald-400 font-bold text-[10px] sm:text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl sm:rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-primary text-white flex items-center justify-center">
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
                                <div className="bg-dark-950/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/5 space-y-3.5 sm:space-y-4">
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

                                    <div className="relative space-y-5 sm:space-y-6 before:absolute before:right-3.5 sm:before:right-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-dark-800">
                                        {STATUS_STEPS.map((step, idx) => {
                                            const isDone = idx < currentStepIndex || isDelivered;
                                            const isCurrent = idx === currentStepIndex && !isDelivered;
                                            const StepIcon = step.icon;

                                            return (
                                                <div key={step.key} className="relative flex items-start gap-3.5 sm:gap-4">
                                                    <div
                                                        className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                                            isDone
                                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/20'
                                                                : isCurrent
                                                                ? 'bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20 animate-pulse'
                                                                : 'bg-dark-800 text-slate-600 border border-white/5'
                                                        }`}
                                                    >
                                                        {isDone ? (
                                                            <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                                                        ) : (
                                                            <StepIcon size={13} className="sm:w-3.5 sm:h-3.5" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <div className="flex items-center justify-between">
                                                            <h4
                                                                className={`text-xs sm:text-sm font-bold leading-none ${
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
                                                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 leading-relaxed">
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
                                        className="w-full py-3.5 sm:py-4 bg-primary hover:bg-orange-600 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
                                    >
                                        <Utensils size={16} />
                                        <span>تصفح المنيو لطلب وجبة جديدة</span>
                                    </button>
                                )}

                                <a
                                    href="tel:01038035884"
                                    className="w-full py-3 sm:py-3.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/5 transition-all active:scale-[0.98]"
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
