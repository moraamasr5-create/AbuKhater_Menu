import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowRight,
    Search,
    Clock,
    Bike,
    ChefHat,
    CheckCircle2,
    XCircle,
    Phone,
    Receipt,
    Wallet,
    Sparkles,
    RotateCcw,
    AlertCircle,
    Home
} from 'lucide-react';
import { orderService } from '../services/api';
import { supabase } from '../services/supabase/supabaseClient';
import { formatCurrency } from '../core/utils/formatters';

const STATUS_STEPS = [
    { key: 'pending', label: 'تم استلام الطلب', desc: 'تم استلام طلبك وبانتظار بدء التحضير', icon: Clock },
    { key: 'preparing', label: 'جاري التحضير', desc: 'يتم تجهيز وجباتك طازجة في المطبخ', icon: ChefHat },
    { key: 'ready', label: 'الطلب جاهز', desc: 'تم تجهيز الوجبة وجاهزة للتسليم', icon: CheckCircle2 },
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

const TrackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paramOrderNumber = searchParams.get('order') || searchParams.get('orderNumber') || '';
    const paramPhone = searchParams.get('phone') || '';

    const [orderNumber, setOrderNumber] = useState(paramOrderNumber);
    const [phone, setPhone] = useState(paramPhone);
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        if (paramOrderNumber || paramPhone) {
            performTrack(paramOrderNumber, paramPhone);
        } else {
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
    }, [paramOrderNumber, paramPhone, performTrack]);

    // Realtime subscription
    useEffect(() => {
        if (!orderData?.order_id) return;

        const channel = supabase
            .channel(`page-track-order-${orderData.order_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderData.order_id}`
                },
                () => {
                    performTrack(orderData.order_number, phone);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderData?.order_id, orderData?.order_number, phone, performTrack]);

    const currentStepIndex = orderData ? getStepIndex(orderData.status) : -1;
    const isCancelled = orderData && ['cancelled', 'failed_delivery'].includes(orderData.status);

    return (
        <div className="min-h-screen bg-dark-950 pb-20 font-sans" dir="rtl">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                        aria-label="الرجوع لقائمة الطعام"
                    >
                        <ArrowRight size={20} />
                        <span className="font-bold text-sm">العودة للمنيو</span>
                    </button>
                    <h1 className="text-base font-black text-white">متابعة الطلب الحية</h1>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-9 h-9 rounded-xl bg-dark-800 text-slate-300 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        aria-label="الرئيسية"
                    >
                        <Home size={18} />
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
                {/* Search Form Card */}
                <div className="bg-dark-900 border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="text-center space-y-1">
                        <h2 className="text-lg font-black text-white">استعلام عن حالة الطلب</h2>
                        <p className="text-xs text-slate-400">أدخل رقم الطلب أو رقم الهاتف المسجل به الطلب</p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            performTrack(orderNumber, phone);
                        }}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الطلب</label>
                                <input
                                    type="text"
                                    placeholder="مثال: #1042"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    className="w-full px-4 py-3 bg-dark-950/70 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:border-primary focus:outline-none text-center font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    placeholder="010XXXXXXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 bg-dark-950/70 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:border-primary focus:outline-none text-center font-mono"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (!orderNumber && !phone)}
                            className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <RotateCcw size={18} className="animate-spin" />
                            ) : (
                                <Search size={18} />
                            )}
                            <span>تتبع الطلب الآن</span>
                        </button>
                    </form>

                    {error && (
                        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="font-bold leading-relaxed">{error}</span>
                        </div>
                    )}
                </div>

                {/* Tracking Data Presentation */}
                {orderData && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {/* Order Summary Pill */}
                        <div className="bg-dark-900 border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">طلب رقم</span>
                                    <span className="text-white font-mono font-black text-xl">{orderData.order_number}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">المبلغ الإجمالي</span>
                                    <span className="text-primary font-black text-xl">{formatCurrency(orderData.total_amount)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-dark-950/60 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold mb-0.5">نوع الطلب</span>
                                    <span className="text-white font-bold">
                                        {orderData.order_type === 'delivery' ? 'توصيل منزلي' : 'استلام من المطعم'}
                                    </span>
                                </div>
                                <div className="p-3 bg-dark-950/60 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold mb-0.5">حالة السداد</span>
                                    <span className="text-emerald-400 font-bold">
                                        {orderData.payment_status_label_ar || 'تم'}
                                    </span>
                                </div>
                            </div>

                            {orderData.pilot_name && (
                                <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                                            <Bike size={18} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">المندوب المسؤول</span>
                                            <span className="text-white font-bold text-sm">{orderData.pilot_name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-primary font-bold bg-primary/15 px-2.5 py-1 rounded-full border border-primary/30">
                                        في الطريق
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Order Steps */}
                        {!isCancelled ? (
                            <div className="bg-dark-900 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">مراحل التنفيذ</h3>
                                <div className="relative space-y-7 before:absolute before:right-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-dark-800">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const isDone = idx < currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const StepIcon = step.icon;

                                        return (
                                            <div key={step.key} className="relative flex items-start gap-4">
                                                <div
                                                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                                        isDone
                                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                            : isCurrent
                                                            ? 'bg-primary text-white shadow-xl shadow-primary/40 ring-4 ring-primary/20 animate-pulse'
                                                            : 'bg-dark-800 text-slate-600 border border-white/5'
                                                    }`}
                                                >
                                                    {isDone ? (
                                                        <CheckCircle2 size={18} />
                                                    ) : (
                                                        <StepIcon size={17} />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <h4
                                                            className={`text-sm font-bold ${
                                                                isCurrent
                                                                    ? 'text-primary font-black text-base'
                                                                    : isDone
                                                                    ? 'text-white'
                                                                    : 'text-slate-500'
                                                            }`}
                                                        >
                                                            {step.label}
                                                        </h4>
                                                        {isCurrent && (
                                                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full animate-pulse border border-primary/20">
                                                                جاري الآن
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center gap-3.5 text-red-400">
                                <XCircle size={28} className="shrink-0" />
                                <div>
                                    <h4 className="font-black text-base">تم إلغاء الطلب</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        تم إلغاء هذا الطلب من قبل إدارة المطعم. يرجى التواصل هاتفياً لمزيد من التفاصيل.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Quick Action Contact Button */}
                        <a
                            href="tel:01038035884"
                            className="w-full py-4 bg-dark-900 hover:bg-dark-800 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all shadow-md active:scale-[0.99]"
                        >
                            <Phone size={16} className="text-primary" />
                            <span>الاتصال بإدارة المطعم (01038035884)</span>
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TrackPage;
