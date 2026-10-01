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
    Sparkles
} from 'lucide-react';
import { orderService } from '../../services/api';
import { supabase } from '../../services/supabase/supabaseClient';
import { formatCurrency } from '../../core/utils/formatters';

const STATUS_STEPS = [
    { key: 'pending', label: 'تم استلام الطلب', desc: 'تم استلام طلبك وبانتظار بدء التحضير', icon: Clock },
    { key: 'preparing', label: 'جاري التحضير', desc: 'يتم تجهيز وجباتك طازجة في المطبخ', icon: ChefHat },
    { key: 'ready', label: 'الطلب جاهز', desc: 'تم تجهيز الوجبة وجاهزة للخروج', icon: CheckCircle2 },
    { key: 'out_for_delivery', label: 'في الطريق إليك', desc: 'الطلب مع مندوب التوصيل', icon: Bike },
    { key: 'delivered', label: 'تم التسليم', desc: 'بالهناء والشفاء! نتمنى لك وجبة شهية', icon: Sparkles }
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
            return 4;
        default:
            return 0;
    }
};

const OrderTrackingModal = ({ isOpen, onClose, initialOrderNumber, initialPhone }) => {
    const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
    const [phone, setPhone] = useState(initialPhone || '');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load tracking
    const performTrack = useCallback(async (num, ph) => {
        const cleanNum = (num || '').trim();
        const cleanPh = (ph || '').trim();

        if (!cleanNum && !cleanPh) {
            setError('يرجى إدخال رقم الطلب أو رقم الهاتف للاستعلام.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await orderService.trackOrder({
                orderNumber: cleanNum || null,
                phone: cleanPh || null
            });

            if (!result || !result.found) {
                setError(result?.message || 'لم يتم العثور على أي طلب مطابق للبيانات المدخلة.');
                setOrderData(null);
            } else {
                setOrderData(result);
                setError(null);
            }
        } catch (err) {
            console.error('Tracking query error:', err);
            setError('تعذر الاستعلام عن الطلب حالياً. يرجى التأكد من اتصال الإنترنت.');
            setOrderData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial search if props provided or stored in localStorage
    useEffect(() => {
        if (!isOpen) return;

        if (initialOrderNumber || initialPhone) {
            setOrderNumber(initialOrderNumber || '');
            setPhone(initialPhone || '');
            performTrack(initialOrderNumber, initialPhone);
        } else {
            // Check localStorage for lastSuccessfulOrder
            try {
                const stored = localStorage.getItem('lastSuccessfulOrder');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const lastNum = parsed?.order?.order_number;
                    const lastPhone = parsed?.order?.customer?.phone1;
                    if (lastNum) {
                        setOrderNumber(lastNum);
                        if (lastPhone) setPhone(lastPhone);
                        performTrack(lastNum, lastPhone);
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    }, [isOpen, initialOrderNumber, initialPhone, performTrack]);

    // Supabase Realtime subscription for instant status update
    useEffect(() => {
        if (!orderData?.order_id) return;

        const channel = supabase
            .channel(`track-order-${orderData.order_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderData.order_id}`
                },
                (payload) => {
                    console.log('⚡ Live Order Status Update Received:', payload.new);
                    // Re-fetch authoritative tracking payload
                    performTrack(orderData.order_number, phone);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderData?.order_id, orderData?.order_number, phone, performTrack]);

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

    const currentStepIndex = orderData ? getStepIndex(orderData.status) : -1;
    const isCancelled = orderData && ['cancelled', 'failed_delivery'].includes(orderData.status);

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
                <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-dark-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Bike size={20} />
                        </div>
                        <div>
                            <h2 id="tracking-modal-title" className="text-lg sm:text-xl font-black text-white">
                                تتبع حالة الطلب
                            </h2>
                            <p className="text-[11px] text-slate-400 font-bold">متابعة فورية ومباشرة لطلبك</p>
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

                {/* Search Bar / Input */}
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            performTrack(orderNumber, phone);
                        }}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                    رقم الطلب (Order #)
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثال: 1042 أو #1042"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    className="w-full px-4 py-3 bg-dark-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:border-primary focus:outline-none text-center font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                    رقم الهاتف (اختياري)
                                </label>
                                <input
                                    type="tel"
                                    placeholder="010XXXXXXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 bg-dark-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:border-primary focus:outline-none text-center font-mono"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (!orderNumber && !phone)}
                            className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/20"
                        >
                            {loading ? (
                                <RotateCcw size={16} className="animate-spin" />
                            ) : (
                                <Search size={16} />
                            )}
                            <span>استعلام عن الطلب</span>
                        </button>
                    </form>

                    {/* Error State */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs animate-in shake">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="font-bold leading-relaxed">{error}</span>
                        </div>
                    )}

                    {/* Order Tracking Result View */}
                    {orderData && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Summary Card */}
                            <div className="bg-dark-950/70 rounded-2xl p-4 border border-white/5 space-y-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">طلب رقم</span>
                                        <span className="text-white font-mono font-black text-lg">{orderData.order_number}</span>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">المبلغ الكلي</span>
                                        <span className="text-primary font-black text-lg">{formatCurrency(orderData.total_amount)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Receipt size={14} />
                                        <span>نوع الطلب:</span>
                                        <strong className="text-white">
                                            {orderData.order_type === 'delivery' ? 'توصيل منزلي' : 'استلام من المطعم'}
                                        </strong>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Wallet size={14} className="text-slate-400" />
                                        <span className="text-slate-400">حالة الدفع:</span>
                                        <span className="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            {orderData.payment_status_label_ar || 'تم'}
                                        </span>
                                    </div>
                                </div>

                                {orderData.pilot_name && (
                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bike size={18} className="text-primary" />
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold block">مندوب التوصيل</span>
                                                <span className="text-white font-bold text-xs">{orderData.pilot_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Timeline */}
                            {!isCancelled ? (
                                <div className="bg-dark-950/40 rounded-2xl p-5 border border-white/5 space-y-5">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">مراحل الطلب</h3>
                                    <div className="relative space-y-6 before:absolute before:right-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-dark-800">
                                        {STATUS_STEPS.map((step, idx) => {
                                            const isDone = idx < currentStepIndex;
                                            const isCurrent = idx === currentStepIndex;
                                            const isPending = idx > currentStepIndex;
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
                            ) : (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                                    <XCircle size={24} className="shrink-0" />
                                    <div>
                                        <h4 className="font-black text-sm">تم إلغاء الطلب</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">يرجى التواصل مع إدارة المطعم للمساعدة.</p>
                                    </div>
                                </div>
                            )}

                            {/* Contact Restaurant Direct Button */}
                            <a
                                href="tel:01038035884"
                                className="w-full py-3 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/5 transition-all"
                            >
                                <Phone size={14} className="text-primary" />
                                <span>الاتصال بالمطعم للاستفسار</span>
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
    initialOrderNumber: PropTypes.string,
    initialPhone: PropTypes.string
};

export default OrderTrackingModal;
