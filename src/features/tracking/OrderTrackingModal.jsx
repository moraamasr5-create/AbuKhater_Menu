import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    X,
    Clock,
    Bike,
    ChefHat,
    CheckCircle2,
    XCircle,
    Phone,
    RotateCcw,
    ShoppingBag,
    Utensils,
    Sparkles,
    Layers,
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../../services/supabase/supabaseClient';
import { formatCurrency } from '../../core/utils/formatters';
import { orderService } from '../../services/api';
import PhoneOtpModal from '../../components/common/PhoneOtpModal';

const STATUS_STEPS = [
    { key: 'pending', label: 'تم استلام الطلب', desc: 'تم استلام طلبك ومراجعته في النظام', icon: Clock },
    { key: 'preparing', label: 'جاري التحضير', desc: 'يتم تجهيز وجباتك طازجة في المطبخ', icon: ChefHat },
    { key: 'ready', label: 'الطلب جاهز', desc: 'تم تجهيز الوجبة وجاهزة للخروج مع المندوب', icon: CheckCircle2 },
    { key: 'out_for_delivery', label: 'في الطريق إليك', desc: 'الطلب مع مندوب التوصيل في طريقه لعنوانك', icon: Bike },
    { key: 'delivered', label: 'تم التسليم بنجاح', desc: 'بالهناء والشفاء! نتمنى لك وجبة شهية', icon: Sparkles }
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

const formatOrderTime = (isoString) => {
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

const OrderTrackingModal = ({ isOpen, onClose, initialPhone = '' }) => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    const loadOrders = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        else setLoading(true);

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser || null);

            if (!authUser) {
                setOrders([]);
                return;
            }

            const res = await orderService.fetchRecentOrders({ limit: 2 });
            if (res?.found && Array.isArray(res.orders)) {
                setOrders(res.orders);
            } else {
                setOrders([]);
            }
            setSelectedIdx(0);
        } catch (err) {
            console.error('Error fetching authenticated user orders in modal:', err);
            setOrders([]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadOrders();
        }
    }, [isOpen, loadOrders]);

    // Realtime subscription for active orders
    useEffect(() => {
        if (!isOpen) return;

        const activeIds = orders
            .map((o) => o.order_id)
            .filter(Boolean);

        if (activeIds.length === 0) return;

        const channels = activeIds.map((orderId) => {
            return supabase
                .channel(`modal-track-order-${orderId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `id=eq.${orderId}`
                    },
                    () => {
                        console.log(`⚡ Realtime update for modal order ${orderId}`);
                        loadOrders(true);
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    }, [isOpen, orders, loadOrders]);

    if (!isOpen) return null;

    const currentOrder = orders[selectedIdx] || null;
    const currentStepIndex = currentOrder ? getStepIndex(currentOrder.status) : -1;
    const isCancelled = currentOrder && ['cancelled', 'failed_delivery'].includes(currentOrder.status);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracking-modal-title"
        >
            <div
                className="bg-dark-900 border border-white/10 rounded-[1.75rem] sm:rounded-[2.5rem] w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200"
                dir="rtl"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-dark-800/30">
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-dark-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all"
                        aria-label="إغلاق"
                    >
                        <X size={19} />
                    </button>

                    <h2 id="tracking-modal-title" className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <span>متابعة الطلب الحية</span>
                        <Bike className="text-primary" size={20} />
                    </h2>

                    <button
                        type="button"
                        onClick={() => loadOrders(true)}
                        disabled={loading || isRefreshing}
                        className="p-2.5 bg-dark-800/80 text-slate-300 hover:text-white rounded-xl hover:bg-dark-700 transition-all disabled:opacity-50"
                        title="تحديث البيانات"
                        aria-label="تحديث"
                    >
                        <RotateCcw size={16} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-4">
                    {/* OTP Modal */}
                    <PhoneOtpModal
                        isOpen={showOtpModal}
                        onClose={() => setShowOtpModal(false)}
                        onSuccess={() => {
                            setShowOtpModal(false);
                            loadOrders(true);
                        }}
                        initialPhone={initialPhone}
                        title="تسجيل الدخول بالهاتف"
                        description="أدخل رقم هاتفك لعرض أحدث طلباتك ومتابعتها مباشرة"
                    />

                    {/* Loading State */}
                    {loading && (
                        <div className="py-12 text-center space-y-4">
                            <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                <RotateCcw size={26} className="animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-white">جاري مزامنة بيانات طلبك...</h3>
                                <p className="text-xs text-slate-400">نستعرض أحدث الطلبات الخاصة بحسابك</p>
                            </div>
                        </div>
                    )}

                    {/* Unauthenticated State: Prompt Phone OTP */}
                    {!loading && !user && (
                        <div className="py-8 text-center space-y-5">
                            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                <ShieldCheck size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-white">تسجيل الدخول لمتابعة طلباتك</h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                                    سجل دخولك برقم هاتفك المسجل لعرض حالة ومراحل تجهيز آخر طلبين لك فوراً وبشكل حي.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowOtpModal(true)}
                                className="w-full py-3.5 bg-gradient-to-r from-primary to-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Phone size={16} />
                                <span>تسجيل الدخول برمز OTP</span>
                            </button>
                        </div>
                    )}

                    {/* Empty State: Authenticated but No Recent Orders */}
                    {!loading && user && orders.length === 0 && (
                        <div className="py-8 text-center space-y-5">
                            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                <ShoppingBag size={30} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-white">لا توجد طلبات جارية حالياً</h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                                    حسابك ({user.phone || 'الهاتف'}) لا يحتوي على طلبات نشطة حالياً. عند تأكيد أي طلب جديد ستظهر مراحله مباشرة هنا.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Utensils size={16} />
                                <span>تصفح المنيو واطلب الآن</span>
                            </button>
                        </div>
                    )}

                    {/* Order Details View */}
                    {!loading && user && orders.length > 0 && currentOrder && (
                        <div className="space-y-4">
                            {/* Two-Order Switcher Tabs if 2 orders exist */}
                            {orders.length > 1 && (
                                <div className="bg-dark-950/80 p-1.5 rounded-2xl border border-white/10 grid grid-cols-2 gap-1.5 shadow-md">
                                    {orders.map((ord, idx) => {
                                        const isSelected = selectedIdx === idx;
                                        return (
                                            <button
                                                key={ord.order_id || idx}
                                                type="button"
                                                onClick={() => setSelectedIdx(idx)}
                                                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${isSelected
                                                        ? 'bg-primary text-white shadow-md shadow-primary/30 scale-[1.01]'
                                                        : 'text-slate-400 hover:text-white hover:bg-dark-800'
                                                    }`}
                                            >
                                                <span className="font-black text-xs flex items-center gap-1">
                                                    <Layers size={12} />
                                                    {idx === 0 ? 'الطلب الأحدث' : 'الطلب السابق'} ({ord.order_number})
                                                </span>
                                                <span className={`text-[10px] truncate max-w-full ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                                                    {ord.status_label_ar || 'قيد المعالجة'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Summary Card */}
                            <div className="bg-dark-950/60 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">طلب رقم</span>
                                            <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 font-mono">
                                                {currentOrder.order_number}
                                            </span>
                                        </div>
                                        <span className="text-white font-mono font-black text-xl block">
                                            {currentOrder.order_number}
                                        </span>
                                        {currentOrder.created_at && (
                                            <span className="text-[10px] text-slate-400 block">
                                                {formatOrderTime(currentOrder.created_at)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-left space-y-0.5">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">الإجمالي</span>
                                        <span className="text-emerald-400 font-black text-xl block">
                                            {formatCurrency(currentOrder.total_amount)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium block">
                                            {currentOrder.payment_status_label_ar || 'الدفع عند الاستلام'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2.5 bg-dark-900 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-500 block font-bold mb-0.5">نوع الطلب</span>
                                        <span className="text-white font-bold">
                                            {currentOrder.order_type === 'delivery' ? 'توصيل منزلي 🛵' : 'استلام من المطعم 🥡'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-dark-900 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-500 block font-bold mb-0.5">عدد الوجبات</span>
                                        <span className="text-white font-bold font-mono">
                                            {currentOrder.items_count ? `${currentOrder.items_count} صنف` : 'وجبات مختارة'}
                                        </span>
                                    </div>
                                </div>

                                {currentOrder.pilot_name && (
                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                                                <Bike size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold block">المندوب المسؤول</span>
                                                <span className="text-white font-bold text-xs">{currentOrder.pilot_name}</span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-primary font-bold bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                                            في الطريق إليك
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Execution Steps */}
                            {!isCancelled ? (
                                <div className="bg-dark-950/60 border border-white/5 rounded-2xl p-5 space-y-5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-primary" />
                                            <span>مراحل تجهيز وتوصيل الطلب</span>
                                        </h4>
                                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            مباشر
                                        </span>
                                    </div>

                                    <div className="relative space-y-6 before:absolute before:right-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-800">
                                        {STATUS_STEPS.map((step, idx) => {
                                            const isDone = idx < currentStepIndex;
                                            const isCurrent = idx === currentStepIndex;
                                            const StepIcon = step.icon;

                                            return (
                                                <div key={step.key} className="relative flex items-start gap-3.5">
                                                    <div
                                                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDone
                                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
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
                                                            <h5
                                                                className={`text-xs font-bold ${isCurrent
                                                                        ? 'text-primary font-black text-sm'
                                                                        : isDone
                                                                            ? 'text-white'
                                                                            : 'text-slate-500'
                                                                    }`}
                                                            >
                                                                {step.label}
                                                            </h5>
                                                            {isCurrent && (
                                                                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse border border-primary/20">
                                                                    جاري الآن
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                                            {step.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
                                    <XCircle size={24} className="shrink-0" />
                                    <div>
                                        <h5 className="font-black text-sm">تم إلغاء الطلب</h5>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            تم إلغاء هذا الطلب من قبل إدارة المطعم. يرجى التواصل هاتفياً لمزيد من التفاصيل.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Direct Contact Button */}
                            <a
                                href="tel:01038035884"
                                className="w-full py-3.5 bg-dark-950 hover:bg-dark-800 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all shadow-md active:scale-[0.99]"
                            >
                                <Phone size={15} className="text-primary" />
                                <span>الاتصال بإدارة المطعم (01144423700)</span>
                            </a>
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
    initialPhone: PropTypes.string
};

export default OrderTrackingModal;
