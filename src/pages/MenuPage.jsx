import React, { useState, useEffect, useRef, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { menuService } from '../services/api';
import { supabase } from '../services/supabase/supabaseClient';
import useCart from '../hooks/useCart';
import StickyCartBar from '../features/cart/StickyCartBar';
import ProgressSteps from '../features/checkout/ProgressSteps';
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
import restaurantBanner from '../assets/banner2.png';
import { normalizeCategoryKey } from '../core/utils/menuItem';
import { getCommercialDisplayPrice } from '../core/utils/pricingEngine';

// Lazy loaded modals to keep initial bundle ultra-light
const ReservationModal = lazy(() => import('../features/reservation/ReservationModal'));
const FeedbackModal = lazy(() => import('../features/feedback/FeedbackModal'));
const DishDetailModal = lazy(() => import('../features/menu/DishDetailModal'));
const OrderTrackingModal = lazy(() => import('../features/tracking/OrderTrackingModal'));

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
    crepes: { label: 'الصواريخ', icon: Layers },
    'كريب': { label: 'الصواريخ', icon: Layers },
    'كـريب': { label: 'الصواريخ', icon: Layers },
    'الصواريخ': { label: 'الصواريخ', icon: Layers },
    'صواريخ': { label: 'الصواريخ', icon: Layers },
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
    const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
    const hasOptionGroups = Array.isArray(item.option_groups) && item.option_groups.length > 0;
    const hasConfig = item.has_configuration || hasVariants || hasOptionGroups;
    
    const priceDisplay = getCommercialDisplayPrice(item);

    const handleAdd = (e) => {
        e.stopPropagation();
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
        if (hasConfig) {
            onOpenDetail(item);
        } else {
            addToCart(item);
        }
    };

    const handleUpdateQty = (e, delta) => {
        e.stopPropagation();
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
        if (hasConfig) {
            onOpenDetail(item);
        } else {
            updateQuantity(item.id, delta);
        }
    };

    return (
        <div
            className={`group card-interactive-3d rounded-2xl md:rounded-3xl overflow-hidden flex flex-row md:flex-col h-[132px] sm:h-[140px] md:h-[430px] lg:h-[440px] w-full transition-all ${!isAvailable ? 'opacity-60 grayscale-[35%]' : ''}`}
        >
            {/* Image / Thumbnail Container - Fixed Dimensions across all viewports */}
            <div
                onClick={() => onOpenDetail(item)}
                className="relative w-28 sm:w-32 md:w-full h-full md:h-52 shrink-0 overflow-hidden bg-dark-950 cursor-pointer select-none"
            >
                {hasRealImage ? (
                    <>
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
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
                            className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-dark-950/80 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center border border-white/15 hover:bg-primary transition-all active:scale-90 shadow-sm"
                            title="تكبير الصورة والتفاصيل"
                            aria-label={`عرض تفاصيل ${item.name}`}
                        >
                            <ZoomIn size={13} />
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-900 via-dark-850 to-dark-800 p-2 text-center select-none border-b border-white/5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-inner">
                            <Utensils size={18} />
                        </div>
                        <span className="text-[10px] md:text-[11px] text-slate-400 font-bold truncate max-w-full px-1">
                            {item.category || 'أبو خاطر'}
                        </span>
                    </div>
                )}

                {/* Desktop Top Gradient */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent pointer-events-none" />

                {/* Unavailable Overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-[2px] z-10">
                        <span className={`text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider ${isOutOfStock ? 'bg-red-600/90' : 'bg-amber-600/90'}`}>
                            {statusLabel}
                        </span>
                    </div>
                )}

                {/* Popular Badge - Floating cleanly on image */}
                {item.is_popular && isAvailable && (
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 pointer-events-none">
                        <span className="bg-amber-500/95 text-dark-950 text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-full shadow-sm flex items-center gap-1">
                            ⭐ مميز
                        </span>
                    </div>
                )}

                {/* Desktop Price Badge on Image */}
                <div className="hidden md:block absolute bottom-3 right-3 z-10 badge-soft-3d bg-gradient-to-r from-primary to-orange-600 px-3 py-1 rounded-full border border-white/20 pointer-events-none">
                    <span className="text-white font-black text-sm lg:text-base tabular-nums">
                        {priceDisplay.prefix}{priceDisplay.text} <small className="text-[10px] font-bold opacity-90">{priceDisplay.unit}</small>
                    </span>
                </div>
            </div>

            {/* Content Details Container - Uniform Slot Layout */}
            <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-5 flex flex-col justify-between h-full min-w-0">
                {/* Title & Description Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Title Row */}
                    <div className="h-6 md:h-7 flex items-center mb-1 overflow-hidden">
                        <h3
                            onClick={() => onOpenDetail(item)}
                            title={item.name}
                            className="text-[14px] sm:text-[15px] md:text-base lg:text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-tight line-clamp-1 truncate cursor-pointer w-full"
                        >
                            {item.name}
                        </h3>
                    </div>

                    {/* Description Row */}
                    <div className="h-8 sm:h-9 md:h-10 lg:h-11 overflow-hidden">
                        <p className="text-slate-400 text-[11px] sm:text-xs md:text-[13px] line-clamp-2 leading-relaxed">
                            {item.description || 'صنف طازج ومميز محضّر يومياً بأجود المكونات في مطعم أبو خاطر.'}
                        </p>
                    </div>
                </div>

                {/* Bottom Action / Price Row */}
                <div className="pt-1.5 md:pt-3 md:border-t md:border-white/[0.06] flex items-center justify-between gap-2 h-9 md:h-11 shrink-0 mt-auto">
                    {/* Mobile Price */}
                    <span className="md:hidden text-amber-400 font-black text-sm sm:text-base tabular-nums shrink-0">
                        {priceDisplay.prefix}{priceDisplay.text} <small className="text-[9px] font-bold opacity-85">{priceDisplay.unit}</small>
                    </span>

                    {/* Action Button / Stepper */}
                    <div className="shrink-0 md:w-full h-8 sm:h-8.5 md:h-10 flex items-center justify-end md:justify-center">
                        {isAvailable ? (
                            qty > 0 ? (
                                <div className="stepper-container-3d p-0.5 md:p-1 rounded-xl md:rounded-2xl flex items-center justify-between w-[92px] sm:w-[98px] md:w-full h-full">
                                    <button
                                        type="button"
                                        onClick={(e) => handleUpdateQty(e, -1)}
                                        className="btn-soft-3d-dark w-7 h-7 sm:w-7.5 sm:h-7.5 md:w-8 md:h-8 flex items-center justify-center text-white rounded-lg md:rounded-xl transition-all"
                                        aria-label={`تقليل كمية ${item.name}`}
                                    >
                                        <span className="text-sm md:text-base font-bold" aria-hidden>−</span>
                                    </button>
                                    <span className="text-xs sm:text-sm md:text-base font-black text-white text-center tabular-nums flex-1" aria-live="polite">{qty}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => handleUpdateQty(e, 1)}
                                        className="btn-soft-3d-primary w-7 h-7 sm:w-7.5 sm:h-7.5 md:w-8 md:h-8 flex items-center justify-center text-white rounded-lg md:rounded-xl transition-all"
                                        aria-label={`زيادة كمية ${item.name}`}
                                    >
                                        <span className="text-sm md:text-base font-bold" aria-hidden>+</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    className="btn-soft-3d-dark hover:btn-soft-3d-primary h-full px-2.5 sm:px-3 md:w-full text-slate-100 hover:text-white rounded-xl md:rounded-2xl font-black transition-all flex items-center justify-center gap-1.5 text-[11px] sm:text-xs md:text-sm shadow-sm"
                                    aria-label={`أضف ${item.name} إلى السلة`}
                                >
                                    <Flame size={13} className="text-primary group-hover:text-white shrink-0 transition-colors" aria-hidden />
                                    <span>{hasConfig ? 'تخصيص' : '+ إضافة'}</span>
                                </button>
                            )
                        ) : (
                            <button type="button" disabled className="h-full px-2 md:w-full bg-dark-800/40 text-slate-500 rounded-xl md:rounded-2xl font-bold cursor-not-allowed border border-white/[0.04] opacity-60 flex items-center justify-center text-[10px] md:text-xs">
                                <span>{statusLabel}</span>
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [showReservation, setShowReservation] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const [showTracking, setShowTracking] = useState(false);
    const [showLogoModal, setShowLogoModal] = useState(false);
    const [logoTouchStartY, setLogoTouchStartY] = useState(null);
    const [logoTouchMoveY, setLogoTouchMoveY] = useState(0);
    const menuProductsRef = useRef(null);

    useEffect(() => {
        if (!showLogoModal) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setShowLogoModal(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLogoModal]);

    const handleLogoTouchStart = (e) => {
        setLogoTouchStartY(e.touches[0].clientY);
        setLogoTouchMoveY(0);
    };

    const handleLogoTouchMove = (e) => {
        if (logoTouchStartY === null) return;
        const currentY = e.touches[0].clientY;
        setLogoTouchMoveY(currentY - logoTouchStartY);
    };

    const handleLogoTouchEnd = () => {
        if (Math.abs(logoTouchMoveY) > 60) {
            setShowLogoModal(false);
        }
        setLogoTouchStartY(null);
        setLogoTouchMoveY(0);
    };

    // Synchronously derive categories from menu items without extra render cycle
    const categories = useMemo(() => {
        if (!menuItems || menuItems.length === 0) return ['all'];
        const categoryMap = new Map();
        for (let i = 0; i < menuItems.length; i++) {
            const item = menuItems[i];
            const catKey = normalizeCategoryKey(item.category_slug || item.category);
            if (catKey && !categoryMap.has(catKey)) {
                categoryMap.set(catKey, {
                    order: item.category_order ?? 999,
                    label: item.category
                });
            }
        }
        const sorted = Array.from(categoryMap.entries())
            .sort((a, b) => a[1].order - b[1].order)
            .map(entry => entry[0]);
        return ['all', ...sorted];
    }, [menuItems]);

    // Metadata map for category labels and icons
    const categoryMeta = useMemo(() => {
        const meta = new Map();
        if (!menuItems) return meta;
        for (let i = 0; i < menuItems.length; i++) {
            const item = menuItems[i];
            const catKey = normalizeCategoryKey(item.category_slug || item.category);
            if (catKey && !meta.has(catKey)) {
                const mapped = CATEGORY_MAP[catKey] || CATEGORY_MAP[normalizeCategoryKey(catKey)];
                const rawName = item.originalItem?.categories?.name || item.category;
                const label = mapped?.label || rawName || catKey;
                const IconComp = typeof mapped?.icon === 'function' || typeof mapped?.icon === 'object' ? mapped.icon : Utensils;
                meta.set(catKey, { label, IconComp });
            }
        }
        return meta;
    }, [menuItems]);

    // Pre-calculate category counts once to replace O(C * N) filtering on every render
    const categoryCounts = useMemo(() => {
        const counts = { all: menuItems.length };
        for (let i = 0; i < menuItems.length; i++) {
            const item = menuItems[i];
            const catKey = normalizeCategoryKey(item.category_slug || item.category);
            if (catKey) {
                counts[catKey] = (counts[catKey] || 0) + 1;
            }
        }
        return counts;
    }, [menuItems]);

    const hasScrolledCategoriesRef = useRef(false);
    const sectionRefs = useRef({});
    const isManualScrollingRef = useRef(false);
    const manualScrollTimerRef = useRef(null);

    useEffect(() => {
        if (categories.length > 2 && !hasScrolledCategoriesRef.current) {
            hasScrolledCategoriesRef.current = true;
            
            const timer = setTimeout(() => {
                const container = document.getElementById('categories-scroll');
                const firstTab = document.getElementById('tab-cat-all');
                
                if (container && firstTab) {
                    const isRTL = container.dir === 'rtl' || getComputedStyle(container).direction === 'rtl';
                    const initialOffset = isRTL ? -200 : 200;
                    container.scrollLeft = initialOffset;

                    setTimeout(() => {
                        firstTab.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                    }, 350);
                }
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [categories]);

    // Smooth scroll navigation to category or top
    const scrollToCategory = useCallback((catId) => {
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        
        setActiveCategory(catId);
        isManualScrollingRef.current = true;
        if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);

        if (catId === 'all') {
            menuProductsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            const el = sectionRefs.current[catId] || document.getElementById(`section-${catId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Center active tab pill in horizontal category bar
        const activeTab = document.getElementById(`tab-cat-${catId}`);
        activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

        manualScrollTimerRef.current = setTimeout(() => {
            isManualScrollingRef.current = false;
        }, 850);
    }, []);

    // Throttled scroll listener: only trigger state update when crossing 100px boundary
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.scrollY > 100;
                    setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadMenu = useCallback(async (force = false) => {
        try {
            setLoading(true);
            setError(null);
            const { items, error: remoteError } = await menuService.fetchMenu({ force });

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
                    loadMenu(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadMenu]);

    const searchLower = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

    // Group items into category sections, filtering by search query if present
    const groupedSections = useMemo(() => {
        if (!menuItems || menuItems.length === 0) return [];
        const hasSearch = searchLower.length > 0;

        const validItems = menuItems.filter((item) => {
            const nameOk = item?.name != null && String(item.name).trim() !== '';
            const idRaw = item?.id;
            const idOk = idRaw != null && String(idRaw).trim() !== '';
            if (!nameOk || !idOk) return false;

            if (hasSearch) {
                const nameMatches = item.name.toLowerCase().includes(searchLower);
                if (nameMatches) return true;
                return item.description ? item.description.toLowerCase().includes(searchLower) : false;
            }
            return true;
        });

        const sections = [];
        const nonAllCategories = categories.filter(c => c !== 'all');

        for (const catId of nonAllCategories) {
            const itemsInCat = validItems.filter(item => {
                const itemCatKey = normalizeCategoryKey(item.category_slug || item.category);
                return itemCatKey === catId;
            });

            if (itemsInCat.length > 0) {
                const meta = categoryMeta.get(catId) || { label: catId, IconComp: Utensils };
                sections.push({
                    catId,
                    label: meta.label,
                    IconComp: meta.IconComp,
                    items: itemsInCat
                });
            }
        }

        // Safety fallback for items without matching categorized section
        const accountedIds = new Set(sections.flatMap(s => s.items.map(i => i.id)));
        const orphanItems = validItems.filter(i => !accountedIds.has(i.id));
        if (orphanItems.length > 0) {
            sections.push({
                catId: 'other',
                label: 'أصناف أخرى',
                IconComp: Utensils,
                items: orphanItems
            });
        }

        return sections;
    }, [menuItems, categories, categoryMeta, searchLower]);

    // Dynamic ScrollSpy: track scroll position and update active category tab
    useEffect(() => {
        let ticking = false;

        const handleScrollSpy = () => {
            if (isManualScrollingRef.current) return;
            if (groupedSections.length === 0) return;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const productsEl = menuProductsRef.current;
                    const productsTop = productsEl ? productsEl.getBoundingClientRect().top + scrollY : 0;
                    
                    // Floating bar height offset (~180px)
                    const headerOffset = 180;

                    // If scroll is above the products section (e.g. at the hero banner or buttons)
                    if (scrollY < productsTop - 120) {
                        setActiveCategory(prev => {
                            if (prev !== 'all') {
                                const activeTab = document.getElementById('tab-cat-all');
                                activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                return 'all';
                            }
                            return prev;
                        });
                        ticking = false;
                        return;
                    }

                    // Bottom of page check
                    const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);
                    if (isAtBottom && groupedSections.length > 0) {
                        const lastSec = groupedSections[groupedSections.length - 1];
                        setActiveCategory(prev => {
                            if (prev !== lastSec.catId) {
                                const activeTab = document.getElementById(`tab-cat-${lastSec.catId}`);
                                activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                return lastSec.catId;
                            }
                            return prev;
                        });
                        ticking = false;
                        return;
                    }

                    // Find which section is currently active
                    let currentActive = null;
                    for (let i = 0; i < groupedSections.length; i++) {
                        const sec = groupedSections[i];
                        const el = sectionRefs.current[sec.catId] || document.getElementById(`section-${sec.catId}`);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            if (rect.top <= headerOffset && rect.bottom > headerOffset) {
                                currentActive = sec.catId;
                                break;
                            }
                        }
                    }

                    if (!currentActive && groupedSections.length > 0) {
                        let minDistance = Infinity;
                        for (let i = 0; i < groupedSections.length; i++) {
                            const sec = groupedSections[i];
                            const el = sectionRefs.current[sec.catId] || document.getElementById(`section-${sec.catId}`);
                            if (el) {
                                const rect = el.getBoundingClientRect();
                                const dist = Math.abs(rect.top - headerOffset);
                                if (dist < minDistance) {
                                    minDistance = dist;
                                    currentActive = sec.catId;
                                }
                            }
                        }
                    }

                    if (currentActive) {
                        setActiveCategory(prev => {
                            if (prev !== currentActive) {
                                const activeTab = document.getElementById(`tab-cat-${currentActive}`);
                                activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                return currentActive;
                            }
                            return prev;
                        });
                    }

                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScrollSpy, { passive: true });
        return () => window.removeEventListener('scroll', handleScrollSpy);
    }, [groupedSections]);

    const qtyByItemId = useMemo(() => {
        const m = new Map();
        for (let i = 0; i < cart.length; i++) {
            const pid = cart[i].product_id || cart[i].id;
            m.set(pid, (m.get(pid) || 0) + (cart[i].quantity || 0));
        }
        return m;
    }, [cart]);

    return (
        <div className="min-h-screen bg-dark-950 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:pb-[max(8rem,env(safe-area-inset-bottom,0px))]">
            <ProgressSteps />

            {/* Banner Section */}
            <div className="relative min-h-[160px] h-[22vh] sm:h-[25vh] md:min-h-[220px] md:h-[28vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/60 to-dark-950 z-10" />
                <img
                    src={restaurantBanner}
                    className="w-full h-full object-cover object-center"
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 py-4 sm:py-6">
                    <div className="mb-2 sm:mb-3 relative flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => setShowLogoModal(true)}
                            className="group relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border border-white/20 shadow-xl overflow-hidden bg-dark-950/80 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
                            aria-label="تكبير شعار المطعم"
                        >
                            <img
                                src={restaurantLogo}
                                className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                                alt="مطعم أبو خاطر"
                                decoding="async"
                            />
                            {/* Zoom hint overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <ZoomIn className="text-white drop-shadow-md" size={18} />
                            </div>
                        </button>
                    </div>
                    <div className="relative group cursor-default">
                        <h1 className="relative text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-md">
                            <span className="bg-gradient-to-r from-amber-100 via-orange-400 to-amber-200 bg-clip-text text-transparent inline-block font-black select-none">
                                مطاعـم أبـو خـاطـر
                            </span>
                        </h1>
                    </div>

                    {/* Slogan Badge */}
                    <div className="mt-1 sm:mt-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full bg-dark-950/70 backdrop-blur-md border border-white/10 shadow-md">
                            <span className="text-slate-200 font-bold text-[10px] sm:text-xs tracking-wide">
                                ولا علـ البــال ولا علـ الخـاطـر
                            </span>
                            <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                            <span className="text-amber-400 font-black text-[10px] sm:text-xs tracking-wide">
                                كـله عنـد أبـو خــاطـر
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Utility Action Buttons Container */}
            <div className="max-w-xl mx-auto px-3 sm:px-4 mt-2.5 sm:mt-3.5 mb-1 z-30 relative grid grid-cols-3 gap-2 sm:gap-2.5">
                <button
                    type="button"
                    onClick={() => setShowReservation(true)}
                    className="btn-soft-3d-primary group relative overflow-hidden text-white py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 touch-manipulation"
                    aria-label="فتح نموذج حجز طاولة في المطعم أو الكافيه"
                >
                    <Calendar size={15} className="shrink-0 relative z-10 group-hover:scale-105 transition-transform" />
                    <span className="leading-tight truncate relative z-10">حجز طاولة</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowTracking(true)}
                    className="btn-soft-3d-primary group relative overflow-hidden text-white py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 touch-manipulation"
                    aria-label="تتبع حالة طلبك"
                >
                    <Bike size={15} className="shrink-0 relative z-10 group-hover:scale-105 transition-transform" />
                    <span className="leading-tight truncate relative z-10">تتبع طلبك</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowFeedback(true)}
                    className="btn-soft-3d-dark group relative overflow-hidden text-slate-200 hover:text-white py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 touch-manipulation"
                    aria-label="إرسال شكوى أو مقترح للمطعم"
                >
                    <MessageSquare size={15} className="shrink-0 relative z-10 text-primary group-hover:text-white transition-all" />
                    <span className="leading-tight truncate relative z-10">الشكاوى</span>
                </button>
            </div>

            {/* Floating Interaction Bar */}
            <div className="sticky top-3 sm:top-4 z-40 px-3 sm:px-4 transition-all duration-500">
                <div className={`max-w-3xl mx-auto surface-float-3d rounded-[1.75rem] sm:rounded-[2rem] p-3.5 sm:p-5 space-y-3 sm:space-y-4 transition-all duration-300 ${isScrolled ? 'scale-[0.98]' : 'scale-100'}`}>
                    {/* Search & Actions */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} aria-hidden />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن وجبتك المفضلة..."
                                    aria-label="البحث في قائمة الطعام"
                                    className="w-full surface-recessed-3d text-white text-xs sm:text-sm pr-10 sm:pr-11 pl-9 sm:pl-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
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
                                className="btn-soft-3d-dark shrink-0 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-slate-400 hover:text-white transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                                title="تحديث القائمة من الخادم"
                                aria-label={loading ? 'جاري تحديث القائمة' : 'تحديث القائمة من الخادم'}
                            >
                                <RefreshCcw size={18} className={loading ? 'animate-spin text-primary' : ''} aria-hidden />
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
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full btn-soft-3d-dark text-slate-400 hover:text-white transition-all"
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
                                const count = categoryCounts[catId] || 0;
                                const isActive = activeCategory === catId;

                                return (
                                    <button
                                        key={catId}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        id={`tab-cat-${catId}`}
                                        onClick={() => scrollToCategory(catId)}
                                        className={`category-pill shrink-0 snap-start min-h-[40px] ${isActive ? 'active' : ''}`}
                                    >
                                        <IconComp size={15} className={`shrink-0 ${isActive ? 'text-white' : 'text-primary'}`} />
                                        <span>{mapped.label}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${isActive ? 'bg-white/25 text-white' : 'bg-dark-800/80 text-slate-400'}`} aria-label={`${count} صنف`}>
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
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full btn-soft-3d-dark text-slate-400 hover:text-white transition-all"
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
                            onClick={() => loadMenu(true)}
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
                            <div key={n} className="glass-card rounded-2xl md:rounded-3xl overflow-hidden flex flex-row md:flex-col border border-white/5 h-[132px] sm:h-[140px] md:h-[430px] lg:h-[440px]">
                                <div className="w-28 sm:w-32 md:w-full h-full md:h-52 bg-dark-800 shimmer shrink-0" />
                                <div className="p-3 sm:p-3.5 md:p-5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="h-4 sm:h-5 bg-dark-800 rounded-md w-3/4 shimmer" />
                                        <div className="h-3 sm:h-3.5 bg-dark-800/60 rounded-md w-full shimmer" />
                                        <div className="h-3 sm:h-3.5 bg-dark-800/60 rounded-md w-2/3 shimmer" />
                                    </div>
                                    <div className="h-8 md:h-10 bg-dark-800/80 rounded-xl w-full shimmer mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : groupedSections.length > 0 ? (
                    <div className="space-y-10 sm:space-y-14">
                        {groupedSections.map((section) => (
                            <section
                                key={section.catId}
                                id={`section-${section.catId}`}
                                ref={(el) => { sectionRefs.current[section.catId] = el; }}
                                data-category-id={section.catId}
                                className="category-section scroll-mt-36 sm:scroll-mt-44 md:scroll-mt-48"
                            >
                                {/* Section Header with subtle elegant separator */}
                                <div className="relative mb-4 sm:mb-6">
                                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                                        <div className="flex items-center gap-2.5 sm:gap-3.5">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
                                                <section.IconComp size={18} className="sm:w-5 sm:h-5 text-primary" />
                                            </div>
                                            <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide">
                                                {section.label}
                                            </h2>
                                        </div>
                                        
                                        <span className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg bg-dark-850/80 text-slate-400 border border-white/[0.06] tabular-nums">
                                            {section.items.length} {section.items.length === 1 ? 'صنف' : 'أصناف'}
                                        </span>
                                    </div>
                                    
                                    {/* Accent line on divider */}
                                    <div className="absolute -bottom-[1px] right-0 w-20 sm:w-28 h-[2px] bg-gradient-to-l from-transparent via-primary/60 to-primary rounded-full pointer-events-none" />
                                </div>

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                    {section.items.map((item) => (
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
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 sm:py-20 px-4 bg-dark-900/30 rounded-3xl border border-white/[0.04] mt-4 space-y-3">
                        <Inbox size={48} className="mx-auto text-slate-600 mb-1" />
                        <h3 className="text-base sm:text-lg font-bold text-slate-300">لا توجد نتائج مطابقة</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">لم نتمكن من العثور على أي أصناف مطابقة لبحثك.</p>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    scrollToCategory('all');
                                }}
                                className="mt-2 px-4 py-2 bg-dark-800 hover:bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                                مسح نص البحث وعرض القائمة كاملة
                            </button>
                        )}
                    </div>
                )}
            </main>

            <StickyCartBar />

            <Suspense fallback={null}>
                {showReservation && (
                    <ReservationModal isOpen={showReservation} onClose={() => setShowReservation(false)} />
                )}

                {showFeedback && (
                    <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
                )}

                {selectedDish && (
                    <DishDetailModal
                        key={selectedDish.id}
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
            </Suspense>

            {/* Enlarged Logo Lightbox */}
            {showLogoModal && (
                <div
                    onClick={() => setShowLogoModal(false)}
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none touch-pan-y"
                    role="dialog"
                    aria-modal="true"
                    aria-label="عرض شعار المطعم بالحجم الكامل"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleLogoTouchStart}
                        onTouchMove={handleLogoTouchMove}
                        onTouchEnd={handleLogoTouchEnd}
                        style={{
                            transform: logoTouchMoveY ? `translateY(${logoTouchMoveY}px)` : undefined,
                            transition: logoTouchMoveY ? 'none' : 'transform 0.25s ease'
                        }}
                        className="relative flex flex-col items-center max-w-sm sm:max-w-md w-full animate-in zoom-in-95 duration-200"
                    >
                        {/* Close button X directly at top of the image */}
                        <button
                            type="button"
                            onClick={() => setShowLogoModal(false)}
                            aria-label="إغلاق"
                            className="absolute -top-12 sm:-top-14 right-2 sm:right-0 p-2.5 bg-dark-800/90 hover:bg-red-500/30 text-white rounded-full border border-white/20 backdrop-blur-md transition-all shadow-xl active:scale-90"
                        >
                            <X size={20} />
                        </button>

                        {/* Enlarged Image */}
                        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-4 border-primary/40 shadow-[0_0_60px_rgba(234,88,12,0.35)] overflow-hidden bg-dark-950 flex items-center justify-center">
                            <img
                                src={restaurantLogo}
                                alt="مطعم أبو خاطر"
                                className="w-full h-full object-cover select-none pointer-events-none"
                            />
                        </div>

                        {/* Swipe / Click hint for phones */}
                        <p className="text-slate-400 text-xs font-medium mt-4 text-center select-none pointer-events-none opacity-80">
                            فرخـتنـا المشـويـة رقـم واحـد فـ الجمهوريـة
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
