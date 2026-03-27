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

        // Prepare n8n Payload with Arabic Keys
        const payload = {
            العميل: {
                الاسم_الكامل: formData.name,
                الهاتف_1: formData.phone1,
                الهاتف_2: formData.phone2,
                طريقة_الدفع: orderType === 'pickup' ? paymentMethod : 'cash_on_delivery',
                العنوان: orderType === 'delivery' ? formData.address : 'استلام من المطعم'
            },
            الطلب: {
                السعر_الإجمالي: total,
                المبلغ_المدفوع: orderType === 'pickup' ? requiredDeposit : 0,
                الباقي: orderType === 'pickup' ? remainingDate : total,
                رسوم_الخدمة: serviceFee,
                نوع_الطلب: orderType,
                مدة_التجهيز: "30 دقيقة", // Default estimation
                تاريخ_الطلب: new Date().toISOString(),
                العناصر: cart.map(item => ({
                    اسم_المنتج: item.name,
                    الكمية: item.quantity,
                    السعر: item.price,
                    الإجمالي: item.price * item.quantity
                }))
            },
            location: location
        };

        try {
            await n8nService.submitOrder(payload);
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
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="bg-slate-900 w-full max-w-lg h-[95vh] sm:h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black border border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-100">سلة الطلبات</h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {cart.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <p>السلة فارغة</p>
                        </div>
                    ) : (
                        <>
                            {/* Items List */}
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex gap-3 shadow-md">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-700" />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-slate-100 text-sm">{item.name}</h4>
                                                <span className="font-bold text-primary text-sm">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-slate-700">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded text-slate-300 hover:text-white">-</button>
                                                    <span className="text-sm font-bold w-4 text-center text-slate-100">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded text-slate-300 hover:text-white">+</button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1 hover:bg-slate-700 rounded transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Type Toggle */}
                            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex shadow-sm">
                                <button
                                    onClick={() => setOrderType('delivery')}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${orderType === 'delivery' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                                >
                                    <Bike size={18} />
                                    <span>توصيل</span>
                                </button>
                                <button
                                    onClick={() => setOrderType('pickup')}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${orderType === 'pickup' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                                >
                                    <Store size={18} />
                                    <span>استلام (نصف المبلغ)</span>
                                </button>
                            </div>

                            {/* Pickup Specific UI */}
                            {orderType === 'pickup' && (
                                <div className="space-y-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={18} />
                                            <span className="font-bold text-sm">مهلة الدفع</span>
                                        </div>
                                        <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-200 text-sm">طريقة دفع المقدم (50%)</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentMethod('instapay')}
                                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'instapay'
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                <span className="font-bold">InstaPay</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('vodafone_cash')}
                                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'vodafone_cash'
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                <span className="font-bold">Vodafone Cash</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <input
                                            required
                                            placeholder="الاسم بالكامل"
                                            className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <input
                                            required
                                            type="tel"
                                            placeholder="رقم الهاتف"
                                            className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            value={formData.phone1}
                                            onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Delivery Details */}
                            {orderType === 'delivery' && (
                                <div className="space-y-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                    <div className="space-y-3">
                                        {/* Location Button */}
                                        <button
                                            type="button"
                                            onClick={handleLocationFetch}
                                            disabled={isLocating}
                                            className={`w-full border-2 border-dashed py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${errors.gps
                                                ? 'border-red-500/50 bg-red-900/10 text-red-400'
                                                : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                                                }`}
                                        >
                                            {isLocating ? (
                                                <>
                                                    <LoadingSpinner size={20} color="text-primary" />
                                                    <span>جاري تحديد الموقع...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin size={20} />
                                                    <span>{location ? 'تم تحديد الموقع (تحديث)' : 'تحديد موقعي (مطلوب)'}</span>
                                                </>
                                            )}
                                        </button>

                                        {/* GPS Error Message */}
                                        {errors.gps && (
                                            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                                <p>{errors.gps}</p>
                                            </div>
                                        )}

                                        {location && !errors.gps && (
                                            <p className="text-xs text-center text-green-400 font-semibold px-2">
                                                ✓ تم تحديد الإحداثيات بنجاح
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                required
                                                placeholder="الاسم بالكامل"
                                                className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                            <input
                                                required
                                                type="tel"
                                                placeholder="رقم الهاتف"
                                                className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                value={formData.phone1}
                                                onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                                            />
                                            <input
                                                type="tel"
                                                placeholder="رقم هاتف إضافي (اختياري)"
                                                className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                value={formData.phone2}
                                                onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                                            />
                                            <textarea
                                                required
                                                placeholder="العنوان بالتفصيل (الشارع، رقم العمارة، الشقة)"
                                                className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[80px]"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="bg-slate-900 p-4 border-t border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] space-y-3">
                        {/* Form Validation Error Message */}
                        {errors.form && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/30 animate-pulse">
                                <AlertCircle size={16} />
                                <p>{errors.form}</p>
                            </div>
                        )}

                        <div className="space-y-1 text-sm bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex justify-between text-slate-400">
                                <span>المجموع الفرعي</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            {orderType === 'delivery' && (
                                <div className="flex justify-between text-slate-400">
                                    <span>رسوم التوصيل</span>
                                    <span>{formatCurrency(deliveryFee)}</span>
                                </div>
                            )}

                            {orderType === 'pickup' && (
                                <>
                                    <div className="flex justify-between text-slate-400">
                                        <span>رسوم خدمة</span>
                                        <span>{formatCurrency(serviceFee)}</span>
                                    </div>
                                    <div className="my-2 border-t border-slate-700"></div>
                                    <div className="flex justify-between text-slate-200 font-bold">
                                        <span>إجمالي الطلب</span>
                                        <span>{formatCurrency(pickupTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-primary font-bold bg-primary/10 p-2 rounded">
                                        <span>المطلوب دفعه الآن (50%)</span>
                                        <span>{formatCurrency(requiredDeposit)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400 text-xs px-2">
                                        <span>المتبقي (عند الاستلام)</span>
                                        <span>{formatCurrency(remainingDate)}</span>
                                    </div>
                                </>
                            )}

                            {orderType === 'delivery' && (
                                <div className="flex justify-between font-bold text-lg text-slate-100 pt-2 border-t border-slate-700 mt-2">
                                    <span>الإجمالي</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCreateOrder}
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner size={24} color="text-white" />
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
