import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Clock,
    Bike,
    ChefHat,
    CheckCircle2,
    XCircle,
    Phone,
    Sparkles,
    RotateCcw,
    Home,
    ShoppingBag,
    Utensils,
    Layers,
    LogOut,
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../services/supabase/supabaseClient';
import { formatCurrency } from '../core/utils/formatters';
import { orderService } from '../services/api';
import PhoneOtpModal from '../components/common/PhoneOtpModal';

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

const TrackPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    // Load authenticated user and their 2 recent orders
    const loadUserOrders = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser || null);

            if (!authUser) {
                setOrders([]);
                return;
            }

            // Fetch up to 2 recent orders strictly for this authenticated user (auth.uid)
            const result = await orderService.fetchRecentOrders({ limit: 2 });
            if (result?.found && Array.isArray(result.orders)) {
                setOrders(result.orders);
            } else {
                setOrders([]);
            }
            setSelectedIdx(0);
        } catch (err) {
            console.error('Error loading authenticated user recent orders:', err);
            setOrders([]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadUserOrders();

        // Listen for auth state changes (e.g. login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                loadUserOrders(true);
            } else {
                setOrders([]);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [loadUserOrders]);

    // Supabase Realtime Subscription for active user orders
    useEffect(() => {
        const activeIds = orders
            .map((o) => o.order_id)
            .filter(Boolean);

        if (activeIds.length === 0) return;

        const channels = activeIds.map((orderId) => {
            return supabase
                .channel(`track-page-order-${orderId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `id=eq.${orderId}`
                    },
                    () => {
                        console.log(`⚡ Realtime update received for order ${orderId}`);
                        loadUserOrders(true);
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    }, [orders, loadUserOrders]);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setOrders([]);
        } catch (err) {
            console.error('Error signing out:', err);
        }
    };

    const currentOrder = orders[selectedIdx] || null;
    const currentStepIndex = currentOrder ? getStepIndex(currentOrder.status) : -1;
    const isCancelled = currentOrder && ['cancelled', 'failed_delivery'].includes(currentOrder.status);

    return (
        <div className="min-h-screen bg-dark-950 pb-20 font-sans" dir="rtl">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-dark-950/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
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

                    <h1 className="text-base font-black text-white flex items-center gap-2">
                        <span>متابعة الطلبات</span>
                        <Bike size={18} className="text-primary" />
                    </h1>

                    <div className="flex items-center gap-1.5">
                        {user && (
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-9 h-9 rounded-xl bg-dark-800 text-slate-400 hover:text-red-400 flex items-center justify-center hover:bg-dark-700 transition-all"
                                aria-label="تسجيل الخروج"
                                title="تسجيل الخروج"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => loadUserOrders(true)}
                            disabled={loading || isRefreshing}
                            className="w-9 h-9 rounded-xl bg-dark-800 text-slate-300 hover:text-white flex items-center justify-center hover:bg-dark-700 transition-all disabled:opacity-50"
                            aria-label="تحديث الحالة"
                            title="تحديث البيانات"
                        >
                            <RotateCcw size={16} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-9 h-9 rounded-xl bg-dark-800 text-slate-300 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                            aria-label="الرئيسية"
                            title="الرئيسية"
                        >
                            <Home size={17} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 pt-6 space-y-5">
                {/* OTP Modal */}
                <PhoneOtpModal
                    isOpen={showOtpModal}
                    onClose={() => setShowOtpModal(false)}
                    onSuccess={() => {
                        setShowOtpModal(false);
                        loadUserOrders(true);
                    }}
                    title="تسجيل الدخول بالهاتف"
                    description="أدخل رقم هاتفك لعرض أحدث طلباتك ومتابعة حالتها مباشرة"
                />

                {/* Loading Skeleton */}
                {loading && (
                    <div className="bg-dark-900 border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-xl animate-pulse">
                        <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                            <RotateCcw size={26} className="animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-base font-bold text-white">جاري مزامنة بيانات طلباتك...</h2>
                            <p className="text-xs text-slate-400">نستعرض أحدث الطلبات المسجلة لحسابك من النظام</p>
                        </div>
                    </div>
                )}

                {/* Unauthenticated State: Prompt Phone OTP Login */}
                {!loading && !user && (
                    <div className="bg-dark-900 border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary shadow-inner">
                            <ShieldCheck size={36} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-black text-white">تسجيل الدخول لمتابعة طلباتك</h2>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                                أدخل رقم هاتفك المسجل برمز التحقق (OTP) للاطلاع على تفاصيل ومراحل تحضير وتوصيل آخر طلبين لك فوراً.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowOtpModal(true)}
                                className="w-full py-4 bg-gradient-to-r from-primary to-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-primary/25 hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Phone size={18} />
                                <span>تسجيل الدخول برمز OTP</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full py-3.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-2xl font-bold text-xs transition-all border border-white/5"
                            >
                                تصفح المنيو
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State: Authenticated but No Recent Orders */}
                {!loading && user && orders.length === 0 && (
                    <div className="bg-dark-900 border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary shadow-inner">
                            <ShoppingBag size={34} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-black text-white">لا توجد طلبات جارية حالياً</h2>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                                حسابك الموثق ({user.phone || 'هاتفك'}) لا يحتوي على طلبات نشطة حالياً. عند إتمام أي طلب جديد ستظهر مراحله مباشرة هنا.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Utensils size={18} />
                            <span>تصفح المنيو واطلب الآن</span>
                        </button>
                    </div>
                )}

                {/* Orders Content for Authenticated User */}
                {!loading && user && orders.length > 0 && currentOrder && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {/* Two-Order Switcher Tabs if 2 recent orders exist */}
                        {orders.length > 1 && (
                            <div className="bg-dark-900/90 p-1.5 rounded-2xl border border-white/10 grid grid-cols-2 gap-1.5 shadow-lg">
                                {orders.map((ord, idx) => {
                                    const isSelected = selectedIdx === idx;
                                    return (
                                        <button
                                            key={ord.order_id || idx}
                                            type="button"
                                            onClick={() => setSelectedIdx(idx)}
                                            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                                                isSelected
                                                    ? 'bg-primary text-white shadow-md shadow-primary/30 scale-[1.01]'
                                                    : 'text-slate-400 hover:text-white hover:bg-dark-800'
                                            }`}
                                        >
                                            <span className="font-black text-xs flex items-center gap-1.5">
                                                <Layers size={13} />
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

                        {/* Order Summary Card */}
                        <div className="bg-dark-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                            <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">طلب رقم</span>
                                        <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 font-mono">
                                            {currentOrder.order_number}
                                        </span>
                                    </div>
                                    <span className="text-white font-mono font-black text-2xl block">
                                        {currentOrder.order_number}
                                    </span>
                                    {currentOrder.created_at && (
                                        <span className="text-[11px] text-slate-400 block">
                                            {formatOrderTime(currentOrder.created_at)}
                                        </span>
                                    )}
                                </div>

                                <div className="text-left space-y-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">الإجمالي</span>
                                    <span className="text-emerald-400 font-black text-2xl block">
                                        {formatCurrency(currentOrder.total_amount)}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium block">
                                        {currentOrder.payment_status_label_ar || 'الدفع عند الاستلام'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs">
                                <div className="p-3 bg-dark-950/60 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold mb-0.5">نوع الطلب</span>
                                    <span className="text-white font-bold">
                                        {currentOrder.order_type === 'delivery' ? 'توصيل منزلي 🛵' : 'استلام من المطعم 🥡'}
                                    </span>
                                </div>
                                <div className="p-3 bg-dark-950/60 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold mb-0.5">عدد الوجبات</span>
                                    <span className="text-white font-bold font-mono">
                                        {currentOrder.items_count ? `${currentOrder.items_count} صنف` : 'وجبات مختارة'}
                                    </span>
                                </div>
                            </div>

                            {/* Assigned Pilot Banner */}
                            {currentOrder.pilot_name && (
                                <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                                            <Bike size={20} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">المندوب المسؤول</span>
                                            <span className="text-white font-bold text-sm">{currentOrder.pilot_name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-primary font-bold bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                                        في الطريق إليك
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Live Execution Timeline */}
                        {!isCancelled ? (
                            <div className="bg-dark-900 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles size={16} className="text-primary" />
                                        <span>مراحل تجهيز وتوصيل الطلب</span>
                                    </h3>
                                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                        تحديث فوري
                                    </span>
                                </div>

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
                            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center gap-3.5 text-red-400 shadow-xl">
                                <XCircle size={28} className="shrink-0" />
                                <div>
                                    <h4 className="font-black text-base">تم إلغاء الطلب</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        تم إلغاء هذا الطلب من قبل إدارة المطعم. يرجى التواصل هاتفياً لمزيد من التفاصيل.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Direct Contact Button */}
                        <div className="space-y-3 pt-2">
                            <a
                                href="tel:01038035884"
                                className="w-full py-4 bg-dark-900 hover:bg-dark-800 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all shadow-md active:scale-[0.99]"
                            >
                                <Phone size={16} className="text-primary" />
                                <span>الاتصال بإدارة المطعم (01038035884)</span>
                            </a>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TrackPage;
