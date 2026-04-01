import React, { useState } from 'react';
import { X, MapPin, Bike, Store, Trash2, AlertCircle } from 'lucide-react';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';
import { n8nService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const CartDrawer = () => {
    const {
        cart, isCartOpen, setIsCartOpen, clearCart,
        orderType, setOrderType, location, setLocation,
        deliveryFee, removeFromCart, updateQuantity
    } = useCart();

    const [formData, setFormData] = useState({
        name: '',
        phone1: '',
        phone2: '',
        address: ''
    });

    // UI States
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({ gps: null, form: null });

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('instapay');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    React.useEffect(() => {
        let timer;
        if (isCartOpen && orderType === 'pickup') {
            setTimeLeft(600);
            timer = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isCartOpen, orderType]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!isCartOpen) return null;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Pickup Calculations
    const serviceFee = orderType === 'pickup' ? Math.ceil(subtotal / 500) * 10 : 0;
    const pickupTotal = subtotal + serviceFee;
    const requiredDeposit = orderType === 'pickup' ? pickupTotal / 2 : 0;
    const remainingDate = orderType === 'pickup' ? pickupTotal - requiredDeposit : 0;

    const total = orderType === 'delivery' ? (subtotal + deliveryFee) : pickupTotal;

    const handleLocationFetch = () => {
        setIsLocating(true);
        setErrors(prev => ({ ...prev, gps: null }));

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                    setIsLocating(false);
                },
                (error) => {
                    console.error("GPS Error", error);
                    setErrors(prev => ({
                        ...prev,
                        gps: 'تعذر تحديد موقعك. يرجى التأكد من تفعيل الـ GPS والسماح للمتصفح بالوصول للموقع.'
                    }));
                    setIsLocating(false);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            setErrors(prev => ({
                ...prev,
                gps: 'المتصفح الخاص بك لا يدعم خدمة تحديد الموقع.'
            }));
            setIsLocating(false);
        }
    };

    const validateForm = () => {
        if (orderType === 'delivery') {
            if (!location) return "يرجى تحديد موقعك أولاً";
            if (!formData.name.trim()) return "يرجى إدخال الاسم";
            if (!formData.phone1.trim()) return "يرجى إدخال رقم الهاتف";
            if (!formData.address.trim()) return "يرجى إدخال العنوان";
        }
        return null;
    };

    /**
     * 🔴 الدالة المسؤولة عن معالجة طلب العميل من السلة (Cart)
     * بتجمع البيانات وبتبعتها فوراً لـ n8n كطلب جديد (pending)
     */
    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setErrors({ gps: null, form: null });

        const formError = validateForm();
        if (formError) {
            setErrors(prev => ({ ...prev, form: formError }));
            return;
        }

        if (cart.length === 0) return;

        setIsSubmitting(true);

        // جلب آخر رقم طلب من التخزين المحلي لضمان التتابع التصاعدي (#1, #2, #3)
        const lastCount = parseInt(localStorage.getItem('order_sequence_num') || '0');
        const nextCount = lastCount + 1;
        const order_id = `#${nextCount}`;

        // 🎯 EXACT Required Payload Format
        const payload = {
            order_id: order_id,
            status: "pending",
            customer: {
                name: formData.name || "Unknown",
                phone: formData.phone1 || "Unknown",
                address: orderType === 'delivery' ? formData.address : 'استلام من المطعم'
            },
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity
            })),
            totals: {
                total: total,
                delivery_fee: orderType === 'delivery' ? deliveryFee : 0
            },
            created_at: new Date().toISOString()
        };

        try {
            const response = await fetch('https://restaurant1abukhater.app.n8n.cloud/webhook-test/submit-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Advance sequence on success
            localStorage.setItem('order_sequence_num', nextCount.toString());

            // Success UX
            alert(orderType === 'pickup'
                ? `تم تسجيل الطلب! يرجى تحويل مبلغ ${requiredDeposit} جنيه عبر ${paymentMethod === 'instapay' ? 'إنستا باي' : 'فودافون كاش'} خلال ${formatTime(timeLeft)}`
                : 'تم إرسال الطلب بنجاح!');
            clearCart();
            setIsCartOpen(false);
        } catch (err) {
            console.error(err);
            setErrors(prev => ({ ...prev, form: 'حدث خطأ غير متوقع أثناء إرسال الطلب. حاول مرة أخرى.' }));
        } finally {
            setIsSubmitting(false); // Unlock button
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="bg-dark-950 w-full max-w-lg h-[95vh] sm:h-[85vh] rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-dark-950/90 backdrop-blur-xl p-5 border-b border-white/5 flex items-center justify-between sticky top-0 z-20">
                    <h2 className="text-xl font-black text-white display-font">سلة الطلبات</h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2.5 bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white rounded-full transition-all active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 space-y-4">
                            <div className="w-20 h-20 bg-dark-900 rounded-full flex items-center justify-center">
                                <Bike size={32} className="opacity-50" />
                            </div>
                            <p className="font-bold">السلة فارغة</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Items List */}
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-dark-900 p-3 rounded-[1.25rem] border border-white/5 flex gap-4 shadow-sm">
                                        <img 
                                            src={item.image || '/logo.jpg'} 
                                            alt={item.name} 
                                            className="w-[4.5rem] h-[4.5rem] rounded-[1rem] object-cover bg-dark-800"
                                            onError={(e) => e.target.src = '/logo.jpg'} 
                                        />
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-200 text-sm leading-tight pr-2">{item.name}</h4>
                                                <span className="font-black text-white text-sm">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center gap-1 bg-dark-950 rounded-xl p-1 border border-white/5 shadow-inner">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-dark-800 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 active:scale-95 transition-all"><Minus size={14} /></button>
                                                    <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-dark-800 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 active:scale-95 transition-all"><Plus size={14} /></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-2 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors active:scale-95">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Type Toggle */}
                            <div className="bg-dark-900 p-1.5 rounded-2xl border border-white/5 flex shadow-sm">
                                <button
                                    onClick={() => setOrderType('delivery')}
                                    className={`flex-1 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${orderType === 'delivery' ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <Bike size={16} className={orderType === 'delivery' ? 'opacity-100' : 'opacity-70'} />
                                    <span>توصيل</span>
                                </button>
                                <button
                                    onClick={() => setOrderType('pickup')}
                                    className={`flex-1 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${orderType === 'pickup' ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <Store size={16} className={orderType === 'pickup' ? 'opacity-100' : 'opacity-70'} />
                                    <span>استلام (نصف المبلغ)</span>
                                </button>
                            </div>

                            {/* Pickup Specific UI */}
                            {orderType === 'pickup' && (
                                <div className="space-y-4 bg-dark-900 p-5 rounded-[1.5rem] border border-white/5 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between text-yellow-500 bg-yellow-500/10 p-3.5 rounded-xl border border-yellow-500/20">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={18} />
                                            <span className="font-bold text-xs">مهلة الدفع</span>
                                        </div>
                                        <span className="font-mono font-black text-lg">{formatTime(timeLeft)}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-300 text-xs">طريقة دفع المقدم (50%)</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentMethod('instapay')}
                                                className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 active:scale-95 ${paymentMethod === 'instapay'
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-dark-800 bg-dark-950 text-slate-400 hover:border-dark-700'
                                                    }`}
                                            >
                                                <span className="font-bold text-sm">InstaPay</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('vodafone_cash')}
                                                className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 active:scale-95 ${paymentMethod === 'vodafone_cash'
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-dark-800 bg-dark-950 text-slate-400 hover:border-dark-700'
                                                    }`}
                                            >
                                                <span className="font-bold text-sm">Vodafone Cash</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <input
                                            required
                                            placeholder="الاسم بالكامل"
                                            className="w-full p-4 bg-dark-950 rounded-xl border border-white/5 text-white placeholder-slate-600 focus:border-primary outline-none transition-all text-sm font-bold"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <input
                                            required
                                            type="tel"
                                            placeholder="رقم الهاتف"
                                            className="w-full p-4 bg-dark-950 rounded-xl border border-white/5 text-white placeholder-slate-600 focus:border-primary outline-none transition-all text-sm font-bold ltr"
                                            value={formData.phone1}
                                            onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Delivery Details */}
                            {orderType === 'delivery' && (
                                <div className="space-y-4 bg-dark-900 p-5 rounded-[1.5rem] border border-white/5 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                    <div className="space-y-3">
                                        {/* Location Button */}
                                        <button
                                            type="button"
                                            onClick={handleLocationFetch}
                                            disabled={isLocating}
                                            className={`w-full border-2 border-dashed py-4 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] ${errors.gps
                                                ? 'border-red-500/50 bg-red-500/10 text-red-500'
                                                : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50'
                                                }`}
                                        >
                                            {isLocating ? (
                                                <>
                                                    <LoadingSpinner size={20} color="text-primary" />
                                                    <span className="text-sm">جاري تحديد الموقع...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin size={20} />
                                                    <span className="text-sm">{location ? 'تم تحديد الموقع (تحديث)' : 'تحديد موقعي (مطلوب)'}</span>
                                                </>
                                            )}
                                        </button>

                                        {/* GPS Error Message */}
                                        {errors.gps && (
                                            <div className="flex items-start gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                                <p>{errors.gps}</p>
                                            </div>
                                        )}

                                        {location && !errors.gps && (
                                            <p className="text-[11px] text-center text-emerald-500 font-bold px-2 bg-emerald-500/10 py-1.5 rounded-md">
                                                ✓ تم تحديد الإحداثيات بنجاح
                                            </p>
                                        )}

                                        <div className="space-y-3 pt-2">
                                            <input
                                                required
                                                placeholder="الاسم بالكامل"
                                                className="w-full p-4 bg-dark-950 rounded-xl border border-white/5 text-white placeholder-slate-600 focus:border-primary outline-none transition-all text-sm font-bold"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                            <input
                                                required
                                                type="tel"
                                                placeholder="رقم الهاتف"
                                                className="w-full p-4 bg-dark-950 rounded-xl border border-white/5 text-white placeholder-slate-600 focus:border-primary outline-none transition-all text-sm font-bold ltr"
                                                value={formData.phone1}
                                                onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                                            />
                                            <input
                                                type="tel"
                                                placeholder="رقم هاتف إضافي (اختياري)"
                                                className="w-full p-4 bg-dark-950 rounded-xl border border-white/5 text-white placeholder-slate-600 focus:border-primary outline-none transition-all text-sm font-bold ltr"
                                                value={formData.phone2}
                                                onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                                            />
                                            <textarea
                                                required
                                                placeholder="العنوان بالتفصيل (الشارع، رقم العمارة، الشقة)"
                                                className="w-full p-4 bg-dark-950 rounded-xl border border-white/5 text-white placeholder-slate-600 focus:border-primary outline-none transition-all text-sm font-bold min-h-[100px] resize-none"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="bg-dark-950/90 backdrop-blur-xl p-4 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 pb-safe">
                        {/* Form Validation Error Message */}
                        {errors.form && (
                            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20 mb-3 animate-pulse">
                                <AlertCircle size={16} />
                                <p>{errors.form}</p>
                            </div>
                        )}

                        <div className="space-y-1 text-xs font-bold bg-dark-900 p-3 md:p-4 rounded-[1.25rem] border border-white/5 mb-3">
                            <div className="flex justify-between items-center text-slate-400">
                                <span>المجموع الفرعي</span>
                                <span className="text-white">{formatCurrency(subtotal)}</span>
                            </div>

                            {orderType === 'delivery' && (
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>رسوم التوصيل</span>
                                    <span className="text-white">{formatCurrency(deliveryFee)}</span>
                                </div>
                            )}

                            {orderType === 'pickup' && (
                                <>
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span>رسوم خدمة</span>
                                        <span className="text-white">{formatCurrency(serviceFee)}</span>
                                    </div>
                                    <div className="my-2 border-t border-white/5"></div>
                                    <div className="flex justify-between items-center text-slate-200">
                                        <span>إجمالي الطلب</span>
                                        <span>{formatCurrency(pickupTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg mt-1">
                                        <span>المطلوب دفعه الآن (50%)</span>
                                        <span>{formatCurrency(requiredDeposit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500 text-[10px] px-1 mt-0.5 opacity-80">
                                        <span>المتبقي (عند الاستلام)</span>
                                        <span>{formatCurrency(remainingDate)}</span>
                                    </div>
                                </>
                            )}

                            {orderType === 'delivery' && (
                                <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-white/5 mt-2">
                                    <span>الإجمالي</span>
                                    <span className="text-primary display-font lg:text-lg">{formatCurrency(total)}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCreateOrder}
                            disabled={isSubmitting}
                            className="w-full h-14 bg-gradient-to-r from-primary to-orange-500 text-white rounded-[1.25rem] font-black text-[15px] shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner size={22} color="text-white" />
                                    <span>جاري المعالجة...</span>
                                </>
                            ) : (
                                orderType === 'pickup'
                                    ? `تأكيد ودفع ${formatCurrency(requiredDeposit)}`
                                    : `إتمام الطلب • ${formatCurrency(total)}`
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
