import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { menuService } from '../services/api';
import { supabase } from '../services/supabase/supabaseClient';
import useCart from '../hooks/useCart';
import StickyCartBar from '../features/cart/StickyCartBar';
import ProgressSteps from '../features/checkout/ProgressSteps';
import ReservationModal from '../features/reservation/ReservationModal';
import FeedbackModal from '../features/feedback/FeedbackModal';
import DishDetailModal from '../features/menu/DishDetailModal';
import OrderTrackingModal from '../features/tracking/OrderTrackingModal';
import {
    Search,
    RefreshCcw,
    AlertCircle,
    Flame,
    Inbox,
    ChevronLeft,
    ChevronRight,
    Calendar,
    MessageSquare,
    X,
    Bike,
    Sparkles,
    Layers,
    Utensils,
    UtensilsCrossed,
    Coffee,
    Salad,
    Gift,
    ChefHat,
    LayoutGrid,
    ZoomIn
} from 'lucide-react';
import restaurantLogo from '../assets/logo.png';
import restaurantBanner from '../assets/banner.png';
import { normalizeCategoryKey } from '../core/utils/menuItem';

const CATEGORY_MAP = {
    all: { label: 'الكل', icon: LayoutGrid },
    grills: { label: 'المشويات', icon: Flame },
    'مشويات': { label: 'المشويات', icon: Flame },
    'مشويـات': { label: 'المشويات', icon: Flame },
    trays: { label: 'الصواني', icon: Layers },
    'صواني': { label: 'الصواني', icon: Layers },
    'صـوانـي': { label: 'الصواني', icon: Layers },
    meals: { label: 'الوجبات', icon: Utensils },
    'وجبات': { label: 'الوجبات', icon: Utensils },
    'وجـبات': { label: 'الوجبات', icon: Utensils },
    casseroles: { label: 'الطواجن', icon: ChefHat },
    'طواجن': { label: 'الطواجن', icon: ChefHat },
    'طـواجـن': { label: 'الطواجن', icon: ChefHat },
    crepes: { label: 'كريب', icon: Layers },
    'كريب': { label: 'كريب', icon: Layers },
    'كـريب': { label: 'كريب', icon: Layers },
    sandwiches: { label: 'ساندوتشات', icon: UtensilsCrossed },
    'سندوتشات': { label: 'ساندوتشات', icon: UtensilsCrossed },
    'ساندوتشات': { label: 'ساندوتشات', icon: UtensilsCrossed },
    rise: { label: 'الأرز', icon: Sparkles },
    'الرز': { label: 'الأرز', icon: Sparkles },
    'الـرز': { label: 'الأرز', icon: Sparkles },
    cass: { label: 'المكرونات', icon: Utensils },
    'مكرونات': { label: 'المكرونات', icon: Utensils },
    drinks: { label: 'مشروبات', icon: Coffee },
    'مشروبات': { label: 'مشروبات', icon: Coffee },
    sides: { label: 'مقبلات', icon: Salad },
    'مقبلات': { label: 'مقبلات', icon: Salad },
    combos: { label: 'عروض', icon: Gift },
    'عروض': { label: 'عروض', icon: Gift },
    top: { label: 'عروض خاصة', icon: Sparkles }
};

const MenuProductCard = memo(function MenuProductCard({ item, qty, fallbackImage, addToCart, updateQuantity, onOpenDetail }) {
    const isAvailable = item.status === 'available';
    const isOutOfStock = item.status === 'out_of_stock';
    const isPaused = item.status === 'paused';
    const statusLabel = isOutOfStock ? 'نفذت الكمية' : (isPaused ? 'غير متاح مؤقتاً' : 'غير متاح');

    const hasRealImage = Boolean(item.image && item.image !== '/logo.jpg');

    const handleAdd = (e) => {
        e.stopPropagation();
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
        addToCart(item);
    };

    const handleUpdateQty = (e, delta) => {
        e.stopPropagation();
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
        updateQuantity(item.id, delta);
    };

    return (
        <div
            className={`group glass-card rounded-xl md:rounded-3xl overflow-hidden flex flex-row md:flex-col transition-all duration-300 md:duration-500 md:hover:shadow-2xl md:hover:shadow-primary/12 md:hover:-translate-y-1.5 ${!isAvailable ? 'opacity-60 grayscale-[35%]' : ''}`}
        >
            {/* Image / Thumbnail Container */}
            <div 
                onClick={() => onOpenDetail(item)}
                className="relative w-[96px] shrink-0 self-stretch md:w-full md:h-52 overflow-hidden bg-dark-950 cursor-pointer"
            >
                {hasRealImage ? (
                    <>
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { e.currentTarget.src = fallbackImage; }}
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetail(item);
                            }}
                            className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-dark-950/75 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center border border-white/10 hover:bg-primary transition-all active:scale-90"
                            title="تكبير الصورة"
                            aria-label={`تكبير صورة ${item.name}`}
                        >
                            <ZoomIn size={13} />
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-900 via-dark-850 to-dark-800 p-2 text-center select-none border-b border-white/5">
                        <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-inner">
                            <Utensils size={18} />
                        </div>
                        <span className="text-[9px] md:text-[11px] text-slate-400 font-bold truncate max-w-full px-1">
                            {item.category || 'أبو خاطر'}
                        </span>
                    </div>
                )}

                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60 pointer-events-none" />

                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <span className={`text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest ${isOutOfStock ? 'bg-red-600/90' : 'bg-amber-600/90'}`}>
                            {statusLabel}
                        </span>
                    </div>
                )}

                <div className="hidden md:block absolute bottom-4 right-4 bg-primary/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg pointer-events-none">
                    <span className="text-white font-black text-lg tabular-nums">{item.price} <small className="text-[10px] font-bold opacity-85 uppercase">ج.م</small></span>
                </div>
            </div>

            {/* Content Details */}
            <div className="flex-1 p-3 md:p-6 flex flex-col min-w-0 min-h-0">
                <div className="mb-0 md:mb-4">
                    <div className="flex items-center justify-between gap-1 mb-1 md:mb-2">
                        <h3 
                            onClick={() => onOpenDetail(item)}
                            className="text-sm md:text-xl font-bold text-white group-hover:text-primary transition-colors leading-snug line-clamp-1 md:line-clamp-none cursor-pointer"
                        >
                            {item.name}
                        </h3>
                        {item.is_popular && (
                            <span className="hidden md:inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                ⭐ مميز
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400/90 text-xs md:text-sm line-clamp-1 md:line-clamp-2 leading-relaxed md:min-h-[2.5rem]">
                        {item.description || 'صنف طازج ومميز محضّر يومياً بأجود المكونات في مطعم أبو خاطر.'}
                    </p>
                </div>

                <div className="mt-auto pt-2 md:pt-4 md:border-t md:border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="md:hidden text-primary font-black text-sm tabular-nums shrink-0">
                        {item.price} <small className="text-[9px] font-bold opacity-85">ج.م</small>
                    </span>

                    <div className="shrink-0 md:w-full">
                        {isAvailable ? (
                            qty > 0 ? (
                                <div className="flex items-center bg-dark-800/80 p-0.5 md:p-1.5 rounded-lg md:rounded-2xl border border-white/[0.08] shadow-inner gap-0 md:gap-1 md:justify-between md:w-full">
                                    <button
                                        type="button"
                                        onClick={(e) => handleUpdateQty(e, -1)}
                                        className="w-8 h-8 md:min-w-[44px] md:min-h-[44px] flex items-center justify-center bg-dark-700/60 hover:bg-dark-600 text-white rounded-md md:rounded-xl transition-all active:scale-90"
                                        aria-label={`تقليل كمية ${item.name}`}
                                    >
                                        <span className="text-lg md:text-xl font-bold" aria-hidden>−</span>
                                    </button>
                                    <span className="text-sm md:text-lg font-black text-white w-7 md:w-12 text-center tabular-nums" aria-live="polite">{qty}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => handleUpdateQty(e, 1)}
                                        className="w-8 h-8 md:min-w-[44px] md:min-h-[44px] flex items-center justify-center bg-primary hover:bg-orange-600 text-white rounded-md md:rounded-xl shadow-md shadow-primary/25 transition-all active:scale-90"
                                        aria-label={`زيادة كمية ${item.name}`}
                                    >
                                        <span className="text-lg md:text-xl font-bold" aria-hidden>+</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    className="w-9 h-9 md:w-full md:min-h-[48px] md:py-3.5 bg-dark-800 hover:bg-primary text-slate-100 hover:text-white rounded-lg md:rounded-2xl font-black transition-all flex items-center justify-center gap-2 md:gap-3 border border-white/[0.08] hover:border-primary active:scale-[0.98] shadow-md md:group-hover:shadow-primary/20 text-[15px] md:text-base"
                                    aria-label={`أضف ${item.name} إلى السلة`}
                                >
                                    <span className="md:hidden text-xl font-bold leading-none" aria-hidden>+</span>
                                    <Flame size={20} className="hidden md:block text-primary group-hover:text-white shrink-0" aria-hidden />
                                    <span className="hidden md:inline">إضافة للطلب</span>
                                </button>
                            )
                        ) : (
                            <button type="button" disabled className="w-9 h-9 md:w-full bg-dark-800/50 text-slate-500 md:py-3.5 rounded-lg md:rounded-2xl font-bold cursor-not-allowed border border-white/[0.05] opacity-50 md:min-h-[48px] flex items-center justify-center">
                                <span className="md:hidden text-xs">×</span>
                                <span className="hidden md:inline">{statusLabel}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

const MenuPage = () => {
    const { cart, addToCart, updateQuantity } = useCart();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [categories, setCategories] = useState(['all']);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [showReservation, setShowReservation] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [showTracking, setShowTracking] = useState(false);
    const menuProductsRef = useRef(null);
    const skipCategoryScrollRef = useRef(true);

    useEffect(() => {
        if (skipCategoryScrollRef.current) {
            skipCategoryScrollRef.current = false;
            return;
        }
        const t = requestAnimationFrame(() => {
            menuProductsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return () => cancelAnimationFrame(t);
    }, [activeCategory]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadMenu = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { items, error: remoteError } = await menuService.fetchMenu();

            if (remoteError) {
                setError(remoteError);
                setMenuItems([]);
                return;
            }

            if (!items || items.length === 0) {
                setMenuItems([]);
                setError('لا توجد عناصر متاحة حالياً في قائمة الطعام.');
                return;
            }

            setMenuItems(items);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('تعذر تحميل قائمة الطعام من الخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMenu();

        // Subscribe to real-time changes in menu_items table
        const channel = supabase
            .channel(`menu-realtime-${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'menu_items'
                },
                () => {
                    loadMenu();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadMenu]);

    /**
     * 🔴 تحديث قائمة التصنيفات بشكل ديناميكي بناءً على بيانات Supabase
     */
    useEffect(() => {
        if (menuItems.length > 0) {
            const categoryMap = new Map();
            menuItems.forEach((item) => {
                const catKey = normalizeCategoryKey(item.category_slug || item.category);
                if (catKey) {
                    if (!categoryMap.has(catKey)) {
                        categoryMap.set(catKey, {
                            order: item.category_order ?? 999,
                            label: item.category
                        });
                    }
                }
            });

            const sortedCategories = Array.from(categoryMap.entries())
                .sort((a, b) => a[1].order - b[1].order)
                .map(entry => entry[0]);

            setCategories(['all', ...sortedCategories]);
        }
    }, [menuItems]);

    const searchLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery]);

    const filteredItems = useMemo(() => menuItems.filter((item) => {
        const nameOk = item?.name != null && String(item.name).trim() !== '';
        const idRaw = item?.id;
        const idOk = idRaw != null && String(idRaw).trim() !== '';
        if (!nameOk || !idOk) return false;

        const itemCatKey = normalizeCategoryKey(item.category_slug || item.category);
        const matchesCategory =
            activeCategory === 'all' ||
            itemCatKey === normalizeCategoryKey(activeCategory);

        const matchesSearch =
            item.name.toLowerCase().includes(searchLower) ||
            (item.description && item.description.toLowerCase().includes(searchLower));

        return matchesCategory && matchesSearch;
    }), [menuItems, activeCategory, searchLower]);

    const qtyByItemId = useMemo(() => {
        const m = new Map();
        cart.forEach((line) => m.set(line.id, line.quantity));
        return m;
    }, [cart]);

    return (
        <div className="min-h-screen bg-dark-950 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:pb-[max(8rem,env(safe-area-inset-bottom,0px))]">
            <ProgressSteps />

            {/* Banner Section */}
            <div className="relative min-h-[200px] h-[38vh] sm:h-[42vh] md:min-h-[280px] md:h-[min(46vh,400px)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-dark-950 z-10"></div>
                <img
                    src={restaurantBanner}
                    className="w-full h-full object-cover object-center"
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 py-8 sm:p-6 sm:mt-8 md:mt-10">
                    <div className="mb-4 sm:mb-6 animate-float relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-110 opacity-75"></div>
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-2 border-white/20 shadow-2xl overflow-hidden bg-dark-950/80 backdrop-blur-md flex items-center justify-center">
                            <img
                                src={restaurantLogo}
                                className="w-full h-full object-cover rounded-full drop-shadow-[0_0_20px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
                                alt="مطعم أبو خاطر"
                                decoding="async"
                            />
                        </div>
                    </div>
                    <div className="relative group cursor-default mb-1">
                        {/* Ambient Glow behind title */}
                        <div className="absolute -inset-x-8 -inset-y-3 bg-gradient-to-r from-primary/0 via-primary/35 to-amber-500/0 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <h1 className="relative text-3xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-[0_4px_30px_rgba(234,88,12,0.5)] transition-all duration-300 group-hover:scale-[1.02] active:scale-95 touch-manipulation">
                            <span className="bg-gradient-to-r from-amber-200 via-[#fa7814] to-orange-500 bg-clip-text text-transparent inline-block font-black select-none">
                                مطاعـم أبـو خـاطـر
                            </span>
                        </h1>
                    </div>

                    {/* Slogan Badge */}
                    <div className="mt-1.5 sm:mt-2">
                        <div className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-full bg-dark-950/60 backdrop-blur-md border border-white/10 shadow-lg shadow-black/40 hover:border-primary/40 transition-colors">
                            <span className="text-slate-200 font-bold text-[11px] sm:text-xs md:text-sm tracking-wide">
                                ولا علـ البــال ولا علـ الخـاطـر
                            </span>
                            <span className="w-1 h-1 rounded-full bg-primary/80 shrink-0" />
                            <span className="text-amber-400 font-black text-[11px] sm:text-xs md:text-sm tracking-wide">
                                كـله عنـد أبـو خــاطـر
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Container */}
            <div className="max-w-3xl mx-auto px-3 sm:px-4 mt-4 sm:mt-5 mb-2 z-30 relative grid grid-cols-3 gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={() => setShowReservation(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-[#fa6c14] to-[#ea580c] hover:brightness-110 text-white py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs shadow-lg shadow-orange-600/25 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] border border-white/20 touch-manipulation"
                    aria-label="فتح نموذج حجز طاولة في المطعم أو الكافيه"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20 pointer-events-none" />
                    <Calendar size={17} className="shrink-0 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="leading-tight truncate relative z-10 drop-shadow-sm">حجز طاولة</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowTracking(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-[#fa7814] to-[#f97316] hover:brightness-110 text-white py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] border border-white/20 touch-manipulation"
                    aria-label="تتبع حالة طلبك"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20 pointer-events-none" />
                    <Bike size={17} className="shrink-0 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="leading-tight truncate relative z-10 drop-shadow-sm">تتبع طلبك</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowFeedback(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-[#f97316] to-[#d97706] hover:brightness-110 text-white py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs shadow-lg shadow-amber-600/25 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] border border-white/20 touch-manipulation"
                    aria-label="إرسال شكوى أو مقترح للمطعم"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20 pointer-events-none" />
                    <MessageSquare size={17} className="shrink-0 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="leading-tight truncate relative z-10 drop-shadow-sm">الشكاوى</span>
                </button>
            </div>

            {/* Floating Interaction Bar */}
            <div className="sticky top-3 sm:top-4 z-40 px-3 sm:px-4 transition-all duration-500">
                <div className={`max-w-3xl mx-auto bg-dark-900/88 backdrop-blur-xl border border-white/[0.08] rounded-[1.75rem] sm:rounded-[2rem] shadow-[0_20px_56px_rgba(0,0,0,0.42)] p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 transition-all duration-300 ${isScrolled ? 'scale-[0.98] shadow-primary/10' : 'scale-100'}`}>
                    {/* Search & Actions */}
                    <div className="flex flex-col gap-3.5">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} aria-hidden />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن وجبتك المفضلة..."
                                    aria-label="البحث في قائمة الطعام"
                                    className="w-full bg-dark-800/90 text-white text-xs sm:text-sm pr-10 sm:pr-11 pl-9 sm:pl-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-white/[0.06] focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                                        aria-label="مسح نص البحث"
                                    >
                                        <X size={14} aria-hidden />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={loadMenu}
                                disabled={loading}
                                className="bg-dark-800 shrink-0 p-2.5 sm:p-2.5 rounded-xl sm:rounded-2xl border border-white/[0.06] text-slate-400 hover:text-primary hover:bg-dark-700/80 transition-all active:scale-90 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center disabled:opacity-60 disabled:pointer-events-none"
                                title="تحديث القائمة من الخادم"
                                aria-label={loading ? 'جاري تحديث القائمة' : 'تحديث القائمة من الخادم'}
                            >
                                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} aria-hidden />
                            </button>
                        </div>
                    </div>

                    {/* Categories Scrollable Bar */}
                    <div className="relative flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                const container = document.getElementById('categories-scroll');
                                if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-dark-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-primary transition-all active:scale-90"
                            aria-label="تمرير التصنيفات لليمين"
                        >
                            <ChevronRight size={16} aria-hidden />
                        </button>

                        <div
                            id="categories-scroll"
                            role="tablist"
                            aria-label="تصنيفات القائمة"
                            className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 -mx-0.5 px-0.5 scrollbar-hide mask-fade flex-1 scroll-smooth snap-x snap-mandatory"
                            dir="rtl"
                        >
                            {categories.map((catId) => {
                                const mapped = CATEGORY_MAP[catId] || CATEGORY_MAP[normalizeCategoryKey(catId)] || { label: catId, icon: Utensils };
                                const IconComp = typeof mapped.icon === 'function' || typeof mapped.icon === 'object' ? mapped.icon : Utensils;
                                const count = catId === 'all'
                                    ? menuItems.length
                                    : menuItems.filter(
                                        (i) => normalizeCategoryKey(i.category_slug || i.category) === normalizeCategoryKey(catId)
                                    ).length;

                                const isActive = activeCategory === catId;

                                return (
                                    <button
                                        key={catId}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        id={`tab-cat-${catId}`}
                                        onClick={() => {
                                            if (navigator.vibrate) navigator.vibrate(10);
                                            setActiveCategory(catId);
                                        }}
                                        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap border shrink-0 snap-start min-h-[40px] ${
                                            isActive
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                                                : 'bg-dark-800/60 border-white/[0.06] text-slate-400 hover:bg-dark-800 hover:text-slate-200'
                                        }`}
                                    >
                                        <IconComp size={15} className={`shrink-0 ${isActive ? 'text-white' : 'text-primary'}`} />
                                        <span>{mapped.label}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${isActive ? 'bg-white/20 text-white' : 'bg-dark-700/60 text-slate-400'}`} aria-label={`${count} صنف`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const container = document.getElementById('categories-scroll');
                                if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-dark-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-primary transition-all active:scale-90"
                            aria-label="تمرير التصنيفات لليسار"
                        >
                            <ChevronLeft size={16} aria-hidden />
                        </button>
                    </div>
                </div>
            </div>

            {loading && menuItems.length > 0 ? (
                <div className="max-w-3xl mx-auto px-3 sm:px-4 mt-2" role="status" aria-live="polite">
                    <div className="h-1 bg-dark-800 rounded-full overflow-hidden border border-white/[0.05]">
                        <div className="h-full w-2/5 bg-primary rounded-full animate-pulse motion-reduce:animate-none" />
                    </div>
                    <p className="text-[11px] sm:text-xs text-center text-slate-500 mt-1.5 font-medium">يتم تحديث القائمة من الخادم…</p>
                </div>
            ) : null}

            {/* Error Notification */}
            {error && (
                <div className="max-w-3xl mx-auto px-3 sm:px-4 mt-4" role="alert">
                    <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-between gap-3 text-red-400 text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={18} className="shrink-0" aria-hidden />
                            <span>{error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={loadMenu}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            )}

            {/* Products Grid Section */}
            <main ref={menuProductsRef} className="max-w-6xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8">
                {loading && menuItems.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="glass-card rounded-xl md:rounded-3xl overflow-hidden flex flex-row md:flex-col border border-white/5">
                                <div className="w-[96px] md:w-full h-28 md:h-52 bg-dark-800 shimmer shrink-0" />
                                <div className="p-3 md:p-6 flex-1 space-y-2.5">
                                    <div className="h-4 bg-dark-800 rounded-md w-3/4 shimmer" />
                                    <div className="h-3 bg-dark-800/60 rounded-md w-full shimmer" />
                                    <div className="h-3 bg-dark-800/60 rounded-md w-1/2 shimmer" />
                                    <div className="h-8 bg-dark-800/80 rounded-xl w-full shimmer mt-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {filteredItems.map((item) => (
                            <MenuProductCard
                                key={item.id}
                                item={item}
                                qty={qtyByItemId.get(item.id) || 0}
                                fallbackImage="/logo.jpg"
                                addToCart={addToCart}
                                updateQuantity={updateQuantity}
                                onOpenDetail={setSelectedDish}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 sm:py-20 px-4 bg-dark-900/30 rounded-3xl border border-white/[0.04] mt-4 space-y-3">
                        <Inbox size={48} className="mx-auto text-slate-600 mb-1" />
                        <h3 className="text-base sm:text-lg font-bold text-slate-300">لا توجد نتائج مطابقة</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">لم نتمكن من العثور على أي أصناف مطابقة لبحثك أو التصنيف المختار.</p>
                        {(searchQuery || activeCategory !== 'all') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('all');
                                }}
                                className="mt-2 px-4 py-2 bg-dark-800 hover:bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                                مسح الفلاتر وعرض القائمة كاملة
                            </button>
                        )}
                    </div>
                )}
            </main>

            <StickyCartBar />

            {showReservation && (
                <ReservationModal isOpen={showReservation} onClose={() => setShowReservation(false)} />
            )}

            {showFeedback && (
                <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
            )}

            {selectedDish && (
                <DishDetailModal
                    item={selectedDish}
                    isOpen={Boolean(selectedDish)}
                    onClose={() => setSelectedDish(null)}
                    currentQty={qtyByItemId.get(selectedDish.id) || 0}
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity}
                />
            )}

            {showTracking && (
                <OrderTrackingModal
                    isOpen={showTracking}
                    onClose={() => setShowTracking(false)}
                />
            )}
        </div>
    );
};

export default MenuPage;
