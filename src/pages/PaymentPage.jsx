import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle,
    Copy,
    AlertCircle,
    Receipt,
    CreditCard,
    Clock,
    Info,
    Upload,
    X,
    Image as ImageIcon
} from 'lucide-react';
import useCart from '../hooks/useCart';
import ProgressSteps from '../components/checkout/ProgressSteps';
import { formatCurrency } from '../utils/formatters';
import { calculateServiceFee } from '../utils/calculations';
import { n8nService } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OrderConfirmation from '../components/checkout/OrderConfirmation';

const PaymentPage = () => {
    const {
        cart, orderType, customerData, paymentMethod,
        deliveryFee, location, clearCart,
        distanceKm, locationMethod, selectedAreaId
    } = useCart();

    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [screenshot, setScreenshot] = useState(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculateFee = calculateServiceFee;

    const isPickup = orderType === 'pickup';
    const isCash = paymentMethod === 'cash';

    let serviceFee = 0;
    let requiredDeposit = 0;
    let paidNow = 0;
    let remaining = 0;
    let totalOrderValue = 0;
    let finalTotal = 0;

    if (isPickup) {
        totalOrderValue = subtotal;
        requiredDeposit = subtotal / 2;
        // الرسوم تُحسب على المبلغ الذي سيتم تحويله (العربون)
        serviceFee = calculateFee(requiredDeposit);

        paidNow = requiredDeposit + serviceFee;
        remaining = subtotal / 2;
    } else {
        totalOrderValue = subtotal + deliveryFee;
        if (isCash) {
            serviceFee = 0;
            paidNow = 0;
            remaining = totalOrderValue;
        } else {
            // الرسوم تُحسب على إجمالي المبلغ المحول (المنتجات + التوصيل)
            serviceFee = calculateFee(totalOrderValue);
            paidNow = totalOrderValue + serviceFee;
            remaining = 0;
        }
    }

    finalTotal = totalOrderValue + serviceFee;

    const getEstimatedTime = () => {
        const BASE_PREP_TIME = 30; // وقت التحضير الأساسي في المطبخ

        if (orderType === 'pickup') {
            return `${BASE_PREP_TIME}-${BASE_PREP_TIME + 10} دقيقة`;
        }

        let travelTime = 15; // وقت الرحلة المبدئي للمناطق القريبة

        if (locationMethod === 'gps' || locationMethod === 'map') {
            // حسبة واقعية: 6 دقائق لكل كيلومتر في الزحام الأساسي
            travelTime = Math.max(20, Math.ceil(distanceKm * 6));
        } else if (locationMethod === 'fixed') {
            // المناطق الثابتة عادة ما تكون أبعد أو تحتاج ترتيب خط سير
            travelTime = 30;
        } else {
            travelTime = 25;
        }

        const totalMin = BASE_PREP_TIME + travelTime;
        const totalMax = totalMin + 15;

        return `${totalMin}-${totalMax} دقيقة`;
    };

    const estimatedTime = getEstimatedTime();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setSubmitError('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت.');
            return;
        }

        setIsProcessingFile(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setScreenshot(reader.result);
            setIsProcessingFile(false);
        };
        reader.onerror = () => {
            setSubmitError('حدث خطأ أثناء قراءة الملف.');
            setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
    };

    const removeScreenshot = () => {
        setScreenshot(null);
    };

    const handleConfirmPayment = async () => {
        if ((!isCash || (isCash && isPickup)) && !screenshot) {
            setSubmitError('يرجى رفع صورة إيصال التحويل (Screenshot) للمتابعة.');
            return;
        }

        setIsSubmitting(true);

        // جلب آخر رقم طلب من التخزين المحلي لضمان التتابع التصاعدي (#1, #2, #3)
        const lastCount = parseInt(localStorage.getItem('order_sequence_num') || '0');
        const nextCount = lastCount + 1;
        const orderId = `#${nextCount}`;

        const orderData = {
            restaurant: "مطعم أبو خاطر",
            order_id: orderId,
            timestamp: new Date().toISOString(),
            order_type: orderType,
            customer: {
                full_name: customerData.name,
                phone_1: customerData.phone1,
                phone_2: customerData.phone2,
                payment_method: paymentMethod,
                delivery_info: orderType === 'delivery' ? {
                    address: customerData.address,
                    method: locationMethod,
                    area_id: selectedAreaId,
                    coordinates: location || { lat: 0, lon: 0 },
                    distance_km: distanceKm,
                    delivery_fee: deliveryFee,
                    estimated_time: estimatedTime
                } : null
            },
            payment: {
                total_amount: finalTotal,
                paid_now: paidNow,
                remaining: remaining,
                service_fee: serviceFee,
                deadline: isCash ? null : new Date(Date.now() + 10 * 60000).toISOString(),
                screenshot: screenshot
            },
            items: cart.map((item, index) => ({
                id: `#${index + 1}`,
                name: item.name,
                category: item.category || "عام",
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            })),
            totals: {
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                service_fee: serviceFee,
                total: finalTotal
            }
        };

        try {
            console.log('🎯 بدء تأكيد الطلب...');
            setSubmitError(null);

            const health = await n8nService.checkHealth();
            if (!health.healthy) {
                console.warn('⚠️ اتصال n8n ضعيف:', health);
            }

            let attempts = 0;
            let result;

            while (attempts < 3) {
                attempts++;
                console.log(`🔄 المحاولة ${attempts} من 3`);

                try {
                    result = await n8nService.submitOrder(orderData);
                    if (result && (result.success || result.order_id || result.status)) {
                        console.log('✅ تأكيد ناجح:', result);
                        break;
                    }
                } catch (error) {
                    console.error(`❌ فشلت المحاولة ${attempts}:`, error);
                    if (attempts < 3) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                    } else {
                        throw error;
                    }
                }
            }

            if (result) {
                setSuccessData({
                    orderId: result.order_id || orderId,
                    orderNumber: result.order_number || orderId,
                    customerName: customerData.name,
                    totalAmount: finalTotal,
                    estimatedTime: estimatedTime,
                    itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
                    status: 'success',
                    timestamp: new Date().toISOString()
                });

                try {
                    localStorage.setItem('lastSuccessfulOrder', JSON.stringify({
                        order: orderData,
                        response: result,
                        timestamp: new Date().toISOString()
                    }));
                } catch (e) {
                    console.error('Failed to save to localStorage', e);
                }

                setIsSuccess(true);
                localStorage.setItem('order_sequence_num', nextCount.toString());
            }
        } catch (error) {
            console.error('💀 خطأ نهائي في تأكيد الدفع:', error);
            let userMessage = 'عذراً، حدث خطأ أثناء تأكيد الطلب.';
            if (error.message.includes('شبكة') || error.message.includes('اتصال') || error.message.includes('Failed to fetch')) {
                userMessage = '⚠️ مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك وإعادة المحاولة.';
            } else if (error.message.includes('وقت') || error.message.includes('timeout')) {
                userMessage = '⏰ تأخرت الاستجابة من الخادم. جاري المحاولة مرة أخرى...';
            } else {
                userMessage = `❌ ${error.message}`;
            }

            setSubmitError(userMessage);

            try {
                localStorage.setItem('pendingOrder', JSON.stringify({
                    data: orderData,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }));
            } catch (storageError) {
                console.error('❌ فشل حفظ الطلب محلياً:', storageError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                // Done
            });
        }
    };

    const handleCloseOrder = useCallback(() => {
        clearCart();
        navigate('/');
    }, [clearCart, navigate]);

    const handleViewOrderDetails = useCallback(() => {
        if (successData) {
            console.log('Viewing details for:', successData.orderId);
        }
    }, [successData]);

    const paymentNumber = paymentMethod === 'instapay' ? 'abu_khatar@instapay' : '01144423700';

    return (
        <div className="min-h-screen pb-32 bg-dark-950">
            <ProgressSteps />

            <div className="max-w-xl mx-auto p-4 pt-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <header className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-white">تأكيد الدفع</h2>
                    <p className="text-slate-500 text-sm">راجع تفاصيل الحساب وقم بالتحويل لإتمام الطلب</p>
                </header>

                {/* Success Overlay */}
                {isSuccess && successData && (
                    <OrderConfirmation
                        orderData={successData}
                        onClose={handleCloseOrder}
                        onViewDetails={handleViewOrderDetails}
                    />
                )}

                {/* Main Card */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/40">
                    {/* Amount Header */}
                    <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl"></div>
                        <CheckCircle size={40} className="mx-auto mb-4 opacity-80" />
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">
                            {(isCash && orderType === 'delivery') ? 'المبلغ المطلوب عند التوصيل' : 'المبلغ المطلوب دفعه الآن'}
                        </h3>
                        <div className="text-5xl font-black">{formatCurrency(paidNow)}</div>
                        {remaining > 0 && (
                            <p className="mt-2 text-xs font-bold opacity-80">المتبقي عند الاستلام: {formatCurrency(remaining)}</p>
                        )}
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Status Message */}
                        {(!isCash || (isCash && isPickup)) ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-5 bg-dark-800/50 rounded-3xl border border-white/5">
                                    <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <CreditCard size={24} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">حول المبلغ كعربون لضمان الطلب</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-mono font-black text-white ltr">{paymentNumber}</span>
                                            <button
                                                onClick={() => copyToClipboard(paymentNumber)}
                                                className="p-2.5 bg-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white transition-all active:scale-90"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3 text-primary text-[10px] font-bold">
                                    <Info size={14} />
                                    <span>يرجى إرسال لقطة شاشة (Screenshot) للتحويل للمتابعة.</span>
                                </div>

                                {/* Screenshot Upload Section */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">إثبات التحويل</h4>

                                    {!screenshot ? (
                                        <label className="relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-white/10 rounded-[2rem] bg-dark-800/30 hover:bg-dark-800/50 hover:border-primary/50 transition-all cursor-pointer group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                disabled={isProcessingFile}
                                            />
                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                {isProcessingFile ? (
                                                    <LoadingSpinner size={20} color="text-primary" />
                                                ) : (
                                                    <Upload size={24} />
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-white">اضغط هنا لرفع الصورة</p>
                                                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG أو JPEG (الحد الأقصى 5 ميجابايت)</p>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="relative group rounded-[2rem] overflow-hidden border border-white/10 bg-dark-800/50 p-2">
                                            <img
                                                src={screenshot}
                                                alt="Payment Screenshot"
                                                className="w-full h-48 object-cover rounded-[1.5rem]"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                <button
                                                    onClick={removeScreenshot}
                                                    className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                                    title="حذف الصورة"
                                                >
                                                    <X size={20} />
                                                </button>
                                                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                                                    <ImageIcon size={20} />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-emerald-500 text-white p-2 rounded-xl shadow-lg flex items-center gap-2">
                                                <CheckCircle size={14} />
                                                <span className="text-[10px] font-black">تم اختيار الصورة</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/10 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">الدفع كاش عند الباب</h4>
                                    <p className="text-[10px] text-slate-500">يرجى تجهيز المبلغ المطلوب للمندوب عند الاستلام</p>
                                </div>
                            </div>
                        )}

                        {/* Order Details Breakdown */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Receipt size={16} className="text-slate-500" />
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تفاصيل الحساب</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-400">سعر المنتجات</span>
                                    <span className="text-white">{formatCurrency(subtotal)}</span>
                                </div>
                                {orderType === 'delivery' && (
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-slate-400">خدمة التوصيل</span>
                                        <span className="text-white">{formatCurrency(deliveryFee)}</span>
                                    </div>
                                )}
                                {serviceFee > 0 && (
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-slate-400">رسوم السيرفر / الدفع</span>
                                        <span className="text-white">{formatCurrency(serviceFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-black pt-3 border-t border-white/5">
                                    <span className="text-white">الإجمالي الكلي</span>
                                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Time Info */}
                        <div className="p-4 bg-dark-800/30 rounded-2xl flex items-center justify-between border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-400">وقت التحضير المتوقع:</span>
                            </div>
                            <span className="text-sm font-black text-white">{estimatedTime}</span>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-[2rem] flex items-center gap-4 text-red-500 text-sm animate-in shake duration-300">
                        <AlertCircle size={24} className="shrink-0" />
                        <p className="font-bold leading-relaxed">{submitError}</p>
                    </div>
                )}

                {/* Sticky Controls for Payment */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/customer')}
                        disabled={isSubmitting}
                        className="flex-1 py-5 rounded-3xl font-black text-slate-400 border border-white/10 hover:bg-dark-800 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={20} />
                        <span>تعديل</span>
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={isSubmitting}
                        className="flex-[2] bg-primary text-white py-5 rounded-3xl font-black shadow-2xl shadow-primary/30 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
                    >
                        {isSubmitting ? (
                            <LoadingSpinner size={24} color="text-white" />
                        ) : (
                            <>
                                <span>{(isCash && orderType === 'delivery') ? 'تأكيد الطلب' : 'تأكيد التحويل الآن'}</span>
                                <CheckCircle size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
