import React, { useState, useEffect, useRef } from 'react';
import { n8nService } from '../services/api';
import useCart from '../hooks/useCart';
import StickyCartBar from '../components/cart/StickyCartBar';
import ProgressSteps from '../components/checkout/ProgressSteps';
import ReservationModal from '../components/reservation/ReservationModal';
import {
    UtensilsCrossed,
    Search,
    RefreshCcw,
    AlertCircle,
    Flame,
    Inbox,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar
} from 'lucide-react';
import restaurantLogo from '../assets/logo.jpg';
import restaurantBanner from '../assets/banner.jpg';

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

    // Monitoring scroll for header effects
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadMenu = async () => {
        try {
            setLoading(true);
            const items = await n8nService.fetchMenu();
            if (!items || items.length === 0) throw new Error('لا توجد عناصر حالياً');

            setMenuItems(items);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('تعذر تحديث المنيو المباشر. جاري استخدام القائمة المخزنة.');
            const fallback = n8nService.getFallbackMenu();
            setMenuItems(fallback);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    /**
     * 🔴 تحديث قائمة التصنيفات بشكل ديناميكي بناءً على البيانات
     */
    useEffect(() => {
        if (menuItems.length > 0) {
            const uniqueCategories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];
            setCategories(uniqueCategories);
        }
    }, [menuItems]);

    /**
     * 🔴 تصفية المنتجات بناءً على التصنيف المختار (Categories) 
     * أو بناءً على كلمة البحث (الاسم والوصف)
     */
    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchesSearch = 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const categoryData = {
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

    return (
        <div className="min-h-screen bg-dark-950 pb-32">
            <ProgressSteps />

            {/* Banner Section */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                <div className="absolute top-6 right-6 z-30">
                    <button
                        onClick={() => setShowReservation(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-9 py-3 rounded-full font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-emerald-400/30"
                    >
                        <Calendar size={18} className="animate-pulse" />
                        <span>أحجز الآن : مطعم / كافية </span>
                    </button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-dark-950 z-10"></div>
                <img
                    src={restaurantBanner}
                    className="w-full h-full object-cover object-center"
                    alt="Restaurant Banner"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 mt-10">
                    <div className="mb-4 animate-float">
                        <img
                            src={restaurantLogo}
                            className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                            alt="مطعم أبو خاطر"
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-2xl">مطعم أبو خاطر</h1>
                    <p className="text-slate-300 font-medium tracking-wide">  </p>
                </div>
            </div>

            {/* Floating Interaction Bar */}
            <div className="sticky top-4 z-40 px-4 transition-all duration-500">
                <div className={`max-w-3xl mx-auto bg-dark-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 space-y-4 transition-all duration-300 ${isScrolled ? 'scale-95 shadow-primary/10' : 'scale-100'}`}>
                    {/* Search & Actions */}
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="ابحث عن وجبتك المفضلة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-dark-950/50 border border-white/5 text-white pr-10 pl-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm"
                            />
                        </div>

                        <button
                            onClick={loadMenu}
                            className="bg-dark-800 p-2.5 rounded-2xl border border-white/5 text-slate-400 hover:text-primary transition-all active:scale-90"
                            title="تحديث"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setShowReservation(true)}
                            className="bg-emerald-600/10 p-2.5 rounded-2xl border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all active:scale-90 flex items-center gap-2"
                            title="حجز طاولة"
                        >
                            <Calendar size={18} />
                            <span className="text-xs font-black hidden sm:block">حجز</span>
                        </button>
                    </div>

                    {/* Categories Scrollable Bar with Navigation */}
                    <div className="relative flex items-center gap-1">
                        <button
                            onClick={() => {
                                const container = document.getElementById('categories-scroll');
                                if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-dark-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-primary transition-all active:scale-90"
                        >
                            <ChevronRight size={16} />
                        </button>

                        <div id="categories-scroll" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade pr-1 flex-1 scroll-smooth" dir="rtl">
                            {categories.map((catId) => {
                                const data = categoryData[catId] || { label: catId, icon: '🍽️' };
                                const count = catId === 'all' 
                                    ? menuItems.length 
                                    : menuItems.filter(i => i.category === catId).length;

                                return (
                                    <button
                                        key={catId}
                                        onClick={() => setActiveCategory(catId)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border shrink-0 ${activeCategory === catId
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-dark-800/50 border-white/5 text-slate-500 hover:bg-dark-800'}`}
                                    >
                                        <span>{data.icon}</span>
                                        <span>{data.label}</span>
                                        <span className={`text-[8px] px-1 rounded-md ${activeCategory === catId ? 'bg-white/20' : 'bg-dark-700/50'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => {
                                const container = document.getElementById('categories-scroll');
                                if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-dark-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-primary transition-all active:scale-90"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="max-w-6xl mx-auto px-4 mt-4">
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-3 text-orange-400 text-sm">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <main className="max-w-6xl mx-auto px-4 mt-8">
                {loading && menuItems.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-dark-900/50 rounded-3xl h-80 shimmer border border-white/5"></div>
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map((item) => {
                            const cartItem = cart.find(i => i.id === item.id);
                            const qty = cartItem ? cartItem.quantity : 0;
                            const isAvailable = item.status === 'available';

                            return (
                                <div
                                    key={item.id}
                                    className={`group glass-card rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                                >
                                    {/* Image Section */}
                                    <div className="relative h-56 overflow-hidden">
                                        <img
                                            src={item.image || restaurantLogo}
                                            alt={item.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => e.target.src = restaurantLogo}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60"></div>

                                        {!isAvailable && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                                <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">غير متاح</span>
                                            </div>
                                        )}

                                        <div className="absolute bottom-4 right-4 bg-primary px-3 py-1 rounded-full shadow-xl">
                                            <span className="text-white font-black text-lg">{item.price} <small className="text-[10px] font-bold opacity-80 uppercase">ج.م</small></span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 flex flex-col h-[calc(100%-14rem)]">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                                            <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed h-10">
                                                {item.description || 'لم يتم إضافة وصف لهذا الصنف بعد.'}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-white/5">
                                            {isAvailable ? (
                                                qty > 0 ? (
                                                    <div className="flex items-center justify-between bg-dark-800/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-dark-700/50 hover:bg-dark-600 text-white rounded-xl transition-all active:scale-90"
                                                        >
                                                            <span className="text-xl font-bold">−</span>
                                                        </button>
                                                        <span className="text-lg font-black text-white w-12 text-center">{qty}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-90"
                                                        >
                                                            <span className="text-xl font-bold">+</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="w-full bg-dark-800/80 hover:bg-primary text-slate-100 hover:text-white py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 border border-white/10 hover:border-primary active:scale-95 shadow-lg group-hover:shadow-primary/20"
                                                    >
                                                        <Flame size={20} className="text-primary group-hover:text-white" />
                                                        <span>إضافة للطلب</span>
                                                    </button>
                                                )
                                            ) : (
                                                <button disabled className="w-full bg-dark-800/50 text-slate-500 py-3.5 rounded-2xl font-bold cursor-not-allowed border border-white/5 opacity-50">
                                                    نفذت الكمية
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="bg-dark-900/50 p-10 rounded-full mb-6 border border-white/5 shadow-2xl">
                            <Inbox size={64} className="text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 mb-2">لا يوجد نتائج</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">لم نجد أي وجبة تطابق بحثك حالياً، جرب كلمة بحث أخرى أو تصنيف مختلف.</p>
                        <button
                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                            className="mt-8 text-primary font-bold hover:underline"
                        >
                            عرض المنيو بالكامل
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-4 mt-20 pb-20 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
                    <div className="text-center md:text-right">
                        <h4 className="text-white font-black mb-4"> للتواصل </h4>
                        <p className="text-slate-400 text-sm">اتصل بنا: 01080804069</p>
                        <p className="text-slate-400 text-sm">واتساب: 01144423700</p>
                        <h4 className="text-white font-black mb-4">رقم الشكاوي والمقترحات</h4>
                        <p className="text-slate-400 text-sm">اتصل بنا: 01140449940</p>
                    </div>
                    <div className="text-center">
                        <h4 className="text-white font-black mb-4">ساعات العمل</h4>
                        <p className="text-slate-400 text-sm">خدمة التوصيل : كل يوم من 8 صباحآ حتا 4 فجرآ</p>
                        <div className="inline-block mt-4 bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                            نحن نعمل الآن : المطعم يعمل علي مدار 24 ساعة
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-white font-black mb-4">تابعنا</h4>
                        <div className="flex justify-center md:justify-end gap-4">
                            <span className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">FaceBook</span>
                            <b> | </b>
                            <span className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">Instagram</span>
                            <b> | </b>
                            <span className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">Whatsapp</span>
                        </div>
                    </div>
                </div>
                <div className="mt-12 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
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
