import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { n8nService } from '../services/api';
import useCart from '../hooks/useCart';
import StickyCartBar from '../components/cart/StickyCartBar';
import ProgressSteps from '../components/checkout/ProgressSteps';
import ReservationModal from '../components/reservation/ReservationModal';
import {
    Search,
    RefreshCcw,
    AlertCircle,
    Flame,
    Inbox,
    ChevronLeft,
    ChevronRight,
    Calendar,
    X
} from 'lucide-react';
import restaurantLogo from '../assets/logo.jpg';
import restaurantBanner from '../assets/banner.jpg';

const CATEGORY_DATA = {
    all: { label: 'الكل', icon: '🍽️' },
    grills: { label: 'المشويات', icon: '🔥' },
    trays: { label: 'الصواني', icon: '🍱' },
    meals: { label: 'الوجبات', icon: '🍛' },
    casseroles: { label: 'الطواجن', icon: '🥘' },
    crepes: { label: 'كريب', icon: '🥞' },
    sandwiches: { label: 'ساندوتشات', icon: '🥪' },
    additions: { label: 'إضافات', icon: '➕' },
    drinks: { label: 'مشروبات', icon: '🥤' },
    sides: { label: 'مقبلات', icon: '🍟' },
    combos: { label: 'عروض', icon: '🎁' }
};

const MenuProductCard = memo(function MenuProductCard({ item, qty, fallbackImage, addToCart, updateQuantity }) {
    const isAvailable = item.status === 'available';
    return (
        <div
            className={`group glass-card rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-primary/12 hover:-translate-y-1 sm:hover:-translate-y-2 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
        >
            <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">
                <img
                    src={item.image || fallbackImage}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60" />

                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">غير متاح</span>
                    </div>
                )}

                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-primary/95 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1 rounded-full shadow-lg">
                    <span className="text-white font-black text-base sm:text-lg tabular-nums">{item.price} <small className="text-[10px] font-bold opacity-85 uppercase">ج.م</small></span>
                </div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col flex-1 min-h-0">
                <div className="mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2 group-hover:text-primary transition-colors leading-snug">{item.name}</h3>
                    <p className="text-slate-400/95 text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {item.description || 'لم يتم إضافة وصف لهذا الصنف بعد.'}
                    </p>
                </div>

                <div className="mt-auto pt-3 sm:pt-4 border-t border-white/[0.06]">
                    {isAvailable ? (
                        qty > 0 ? (
                            <div className="flex items-center justify-between bg-dark-800/55 p-1.5 rounded-xl sm:rounded-2xl border border-white/[0.06] shadow-inner gap-1">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 flex items-center justify-center bg-dark-700/60 hover:bg-dark-600 text-white rounded-lg sm:rounded-xl transition-all active:scale-90"
                                    aria-label={`تقليل كمية ${item.name}`}
                                >
                                    <span className="text-xl font-bold" aria-hidden>−</span>
                                </button>
                                <span className="text-lg font-black text-white w-10 sm:w-12 text-center tabular-nums" aria-live="polite">{qty}</span>
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 flex items-center justify-center bg-primary hover:bg-orange-600 text-white rounded-lg sm:rounded-xl shadow-md shadow-primary/25 transition-all active:scale-90"
                                    aria-label={`زيادة كمية ${item.name}`}
                                >
                                    <span className="text-xl font-bold" aria-hidden>+</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="w-full bg-dark-800/85 hover:bg-primary text-slate-100 hover:text-white py-3.5 min-h-[48px] rounded-xl sm:rounded-2xl font-black transition-all flex items-center justify-center gap-2 sm:gap-3 border border-white/[0.08] hover:border-primary active:scale-[0.98] shadow-md group-hover:shadow-primary/20 text-[15px] sm:text-base"
                                aria-label={`أضف ${item.name} إلى السلة`}
                            >
                                <Flame size={20} className="text-primary group-hover:text-white shrink-0" aria-hidden />
                                <span>إضافة للطلب</span>
                            </button>
                        )
                    ) : (
                        <button type="button" disabled className="w-full bg-dark-800/50 text-slate-500 py-3.5 rounded-xl sm:rounded-2xl font-bold cursor-not-allowed border border-white/[0.05] opacity-50 min-h-[48px]">
                            نفذت الكمية
                        </button>
                    )}
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
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [showReservation, setShowReservation] = useState(false);
    const menuProductsRef = useRef(null);
    const skipCategoryScrollRef = useRef(true);

    // بعد تغيير التصنيف: تمرير سلس لبداية شبكة المنتجات (تسهيل التصفح)
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

    // Monitoring scroll for header effects
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
            const { items, usedFallback, error: remoteError } = await n8nService.fetchMenu();
            if (!items || items.length === 0) {
                setMenuItems(n8nService.getFallbackMenu());
                setError('لا توجد عناصر حالياً في القائمة.');
                return;
            }

            setMenuItems(items);
            if (usedFallback && remoteError) {
                setError(`تعذر تحميل المنيو من الخادم. عُرضت القائمة المحلية. (${remoteError})`);
            } else if (usedFallback) {
                setError('تعذر تحديث المنيو المباشر. جاري استخدام القائمة المخزنة.');
            } else {
                setError(null);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('تعذر تحديث المنيو المباشر. جاري استخدام القائمة المخزنة.');
            setMenuItems(n8nService.getFallbackMenu());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    /**
     * 🔴 تحديث قائمة التصنيفات بشكل ديناميكي بناءً على البيانات
     */
    useEffect(() => {
        if (menuItems.length > 0) {
            const uniqueCategories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];
            setCategories(uniqueCategories);
        }
    }, [menuItems]);

    const searchLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery]);

    const filteredItems = useMemo(() => menuItems.filter((item) => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
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
                <div className="absolute top-20 right-3 sm:top-28 md:top-36 sm:right-8 md:right-10 z-30">
                    <button
                        type="button"
                        onClick={() => setShowReservation(true)}
                        className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full font-black text-xs sm:text-sm shadow-lg shadow-teal-900/40 flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-[1.02] active:scale-100 border border-teal-400/25"
                        aria-label="فتح نموذج حجز طاولة في المطعم أو الكافيه"
                    >
                        <Calendar size={20} className="sm:w-[22px] sm:h-[22px] shrink-0 animate-pulse" />
                        <span className="leading-tight">أحجز  : مطعم أو كافية </span>
                    </button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-dark-950 z-10"></div>
                <img
                    src={restaurantBanner}
                    className="w-full h-full object-cover object-center"
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 py-8 sm:p-6 sm:mt-8 md:mt-10">
                    <div className="mb-3 sm:mb-4 animate-float">
                        <img
                            src={restaurantLogo}
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.45)]"
                            alt="مطعم أبو خاطر"
                            decoding="async"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-1.5 sm:mb-2 drop-shadow-2xl leading-tight tracking-tight">مطعم أبو خاطر</h1>
                    <p className="text-slate-300/90 text-sm font-medium tracking-wide max-w-md mx-auto leading-relaxed">  </p>
                </div>
            </div>

            {/* Floating Interaction Bar */}
            <div className="sticky top-3 sm:top-4 z-40 px-3 sm:px-4 transition-all duration-500">
                <div className={`max-w-3xl mx-auto bg-dark-900/88 backdrop-blur-xl border border-white/[0.08] rounded-[1.75rem] sm:rounded-[2rem] shadow-[0_20px_56px_rgba(0,0,0,0.42)] p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 transition-all duration-300 ${isScrolled ? 'scale-[0.98] shadow-primary/10' : 'scale-100'}`}>
                    {/* Search & Actions */}
                    <div className="flex gap-2 sm:gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1 min-w-0">
                            <label htmlFor="menu-search" className="sr-only">البحث في قائمة الطعام</label>
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} aria-hidden />
                            <input
                                id="menu-search"
                                type="search"
                                enterKeyHint="search"
                                autoComplete="off"
                                placeholder="ابحث عن وجبتك المفضلة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full bg-dark-950/60 border border-white/[0.06] text-white pr-10 py-3 sm:py-2.5 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary/35 transition-all text-[15px] sm:text-sm placeholder:text-slate-600 ${searchQuery ? 'pl-9' : 'pl-3 sm:pl-4'}`}
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="مسح البحث"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            ) : null}
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

                        <button
                            type="button"
                            onClick={() => setShowReservation(true)}
                            className="bg-teal-600/12 shrink-0 p-2.5 sm:p-2.5 rounded-xl sm:rounded-2xl border border-teal-500/25 text-teal-400 hover:bg-teal-600 hover:text-white transition-all active:scale-90 flex items-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:w-auto sm:px-3"
                            title="حجز طاولة"
                            aria-label="حجز طاولة"
                        >
                            <Calendar size={18} />
                            <span className="text-xs font-black hidden sm:inline">حجز</span>
                        </button>
                    </div>

                    {/* Categories Scrollable Bar with Navigation */}
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
                                const data = CATEGORY_DATA[catId] || { label: catId, icon: '🍽️' };
                                const count = catId === 'all'
                                    ? menuItems.length
                                    : menuItems.filter(i => i.category === catId).length;

                                return (
                                    <button
                                        key={catId}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeCategory === catId}
                                        id={`tab-cat-${catId}`}
                                        onClick={() => setActiveCategory(catId)}
                                        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap border shrink-0 snap-start min-h-[40px] ${activeCategory === catId
                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/25'
                                            : 'bg-dark-800/55 border-white/[0.06] text-slate-500 hover:bg-dark-800 hover:text-slate-300'}`}
                                    >
                                        <span aria-hidden>{data.icon}</span>
                                        <span>{data.label}</span>
                                        <span className={`text-[8px] px-1 rounded-md tabular-nums ${activeCategory === catId ? 'bg-white/20' : 'bg-dark-700/50'}`} aria-label={`${count} صنف`}>
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
                    <p className="text-[11px] sm:text-xs text-center text-slate-500 mt-1.5 font-medium">يتم تحديث القائمة…</p>
                </div>
            ) : null}

            {/* Notifications */}
            {error && (
                <div className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 sm:mt-5">
                    <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-start gap-3 text-amber-200/95 text-sm leading-relaxed">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <main id="menu-products" ref={menuProductsRef} className="max-w-6xl mx-auto px-3 sm:px-4 mt-6 sm:mt-10 scroll-mt-28 sm:scroll-mt-32" tabIndex={-1}>
                {loading && menuItems.length === 0 ? (
                    <div role="status" aria-live="polite" aria-busy="true" aria-label="جاري تحميل قائمة الطعام">
                        <p className="text-center text-slate-400 text-sm font-medium mb-4 flex items-center justify-center gap-2">
                            <RefreshCcw size={16} className="animate-spin shrink-0 text-primary" aria-hidden />
                            جاري تحميل القائمة…
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-dark-900/50 rounded-2xl sm:rounded-3xl min-h-[280px] sm:h-80 shimmer border border-white/[0.06]" />
                            ))}
                        </div>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <>
                        <p className="text-slate-500 text-sm font-medium mb-4 text-center sm:text-start" role="status" aria-live="polite">
                            {activeCategory === 'all' && !searchQuery.trim()
                                ? `عرض ${filteredItems.length} ${filteredItems.length === 1 ? 'صنف' : 'أصناف'}`
                                : `بعد التصفية: ${filteredItems.length} ${filteredItems.length === 1 ? 'صنف' : 'أصناف'}`}
                        </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                        {filteredItems.map((item) => {
                            const qty = qtyByItemId.get(item.id) ?? 0;
                            return (
                                <MenuProductCard
                                    key={item.id}
                                    item={item}
                                    qty={qty}
                                    fallbackImage={restaurantLogo}
                                    addToCart={addToCart}
                                    updateQuantity={updateQuantity}
                                />
                            );
                        })}
                    </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4 text-center">
                        <div className="bg-dark-900/55 p-8 sm:p-10 rounded-full mb-5 sm:mb-6 border border-white/[0.06] shadow-xl">
                            <Inbox size={56} className="sm:w-16 sm:h-16 text-slate-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-400 mb-2 tracking-tight">لا يوجد نتائج</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">لم نجد أي وجبة تطابق بحثك حالياً، جرب كلمة بحث أخرى أو تصنيف مختلف.</p>
                        <button
                            type="button"
                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                            className="mt-6 sm:mt-8 text-primary font-bold hover:underline text-[15px] py-2 rounded-lg"
                            aria-label="إلغاء التصفية وعرض كل الأصناف"
                        >
                            عرض المنيو بالكامل
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-3 sm:px-4 mt-16 sm:mt-20 pb-16 sm:pb-20 border-t border-white/[0.06]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12 pt-10 sm:pt-12">
                    <div className="text-center md:text-right space-y-1">
                        <h4 className="text-white font-black mb-3 sm:mb-4 text-[15px] tracking-tight"> للتواصل </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            <a href="tel:+201080804069" className="hover:text-primary transition-colors">اتصل بنا: 01080804069</a>
                        </p>
                        <p className="text-slate-400 text-sm">
                            <a href="https://wa.me/201144423700" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">واتساب: 01144423700</a>
                        </p>
                        <h4 className="text-white font-black mb-3 sm:mb-4 mt-5 text-[15px] tracking-tight">رقم الشكاوي والمقترحات</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            <a href="tel:+201140449940" className="hover:text-primary transition-colors">اتصل بنا: 01140449940</a>
                        </p>
                    </div>
                    <div className="text-center space-y-2">
                        <h4 className="text-white font-black mb-3 text-[15px] tracking-tight">ساعات العمل</h4>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">خدمة التوصيل : كل يوم من 8 صباحآ حتا 4 فجرآ</p>
                        <div className="inline-block mt-3 sm:mt-4 bg-teal-500/10 text-teal-400 px-4 py-1.5 rounded-full text-xs font-bold border border-teal-500/25">
                            نحن نعمل الآن : المطعم يعمل علي مدار 24 ساعة
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-white font-black mb-3 sm:mb-4 text-[15px] tracking-tight">تابعنا</h4>
                        <div className="flex justify-center md:justify-end gap-3 sm:gap-4 flex-wrap">
                            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="min-w-[2.75rem] min-h-[2.75rem] w-11 h-11 sm:w-10 sm:h-10 bg-dark-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary transition-colors text-slate-300 text-[10px] font-bold text-center leading-tight px-1 border border-white/[0.05]">FaceBook</a>
                            <b className="text-slate-600 self-center hidden sm:inline"> | </b>
                            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="min-w-[2.75rem] min-h-[2.75rem] w-11 h-11 sm:w-10 sm:h-10 bg-dark-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary transition-colors text-slate-300 text-[10px] font-bold text-center leading-tight px-1 border border-white/[0.05]">Instagram</a>
                            <b className="text-slate-600 self-center hidden sm:inline"> | </b>
                            <a href="https://wa.me/201144423700" target="_blank" rel="noopener noreferrer" className="min-w-[2.75rem] min-h-[2.75rem] w-11 h-11 sm:w-10 sm:h-10 bg-dark-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary transition-colors text-slate-300 text-[10px] font-bold text-center leading-tight px-1 border border-white/[0.05]">Whatsapp</a>
                        </div>
                    </div>
                </div>
                <div className="mt-10 sm:mt-12 text-center text-slate-600 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
                    &copy; 2024 أبو خاطر . جميع الحقوق محفوظة
                </div>
            </footer>

            <StickyCartBar />

            <ReservationModal
                isOpen={showReservation}
                onClose={() => setShowReservation(false)}
            />
        </div>
    );
};

export default MenuPage;
