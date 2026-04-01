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

    /**
     * 🔴 الدالة المسؤولة عن معالجة صورة إثبات الدفع (Screenshot)
     * بتتأكد إن الحجم مناسب وبتحولها لـ Base64 عشان نقدر نعرضها أو نبعتها
     */
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

    /**
     * 🔴 الدالة الأساسية لتأكيد الطلب وإرساله لـ n8n
     * بتجمع بيانات العميل، الأصناف، وصورة الدفع وبتبعتهم في طلب واحد
     */
    const handleConfirmPayment = async () => {
        if (isSubmitting) return; // حماية ضد الضغط المتكرر

        if ((!isCash || (isCash && isPickup)) && !screenshot) {
            setSubmitError('يرجى رفع صورة إيصال التحويل (Screenshot) للمتابعة.');
            return;
        }

        setIsSubmitting(true);

        // 🔴 جلب رقم الطلب التسلسلي (#1, #2...) من الذاكرة المحلية
        const lastCount = parseInt(localStorage.getItem('order_sequence_num') || '0');
        const nextCount = lastCount + 1;
        const orderId = `#${nextCount}`;

        // 🎯 بناء هيكل البيانات المطلوب تماماً لـ n8n ولشيت جوجل
        // نأكد على إرسال الـ items كمصفوفة JSON صحيحة، مع إدراج طريقة الدفع وصورة الإيصال
        const orderPayload = {
            order_id: orderId,
            status: "pending",
            order_type: orderType,
            created_at: new Date().toISOString(),
            customer: {
                name: customerData.name || "Unknown",
                phone_primary: customerData.phone1 || "Unknown",
                phone_secondary: customerData.phone2 || "",
                address: customerData.address || (isPickup ? "استلام من الفرع" : "لم يتم تحديد العنوان"),
                coordinates: location ? {
                    lat: location.lat,
                    lon: location.lon
                } : null
            },
            payment: {
                method: paymentMethod,
                amount_total: finalTotal,
                amount_paid: paidNow,
                amount_remaining: remaining,
                delivery_fee: deliveryFee || 0,
                screenshot: screenshot // 🖼️ إرسال صورة إثبات الدفع (Base64)
            },
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }))
        };

        // Existing orderData for local state and legacy support
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

            // 🚀 Send production payload to webhook as requested
            try {
                const response = await fetch('https://restaurant1abukhater.app.n8n.cloud/webhook-test/submit-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(orderPayload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('✅ Structured order payload sent to n8n');
            } catch (error) {
                console.error('⚠️ n8n webhook error:', error);
                throw new Error('فشل إرسال الطلب. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'); // Fail gracefully and show error banner
            }

            // Record success data immediately since we succeeded
            setSuccessData({
                orderId: orderId,
                orderNumber: orderId,
                customerName: customerData.name,
                totalAmount: finalTotal,
                estimatedTime: estimatedTime,
                itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
                items: [...cart],
                paymentMethod: paymentMethod,
                paymentNumber: paymentNumber,
                status: 'success',
                timestamp: new Date().toISOString()
            });

            setIsSuccess(true);
            localStorage.setItem('order_sequence_num', nextCount.toString());

            // Try legacy sync in background just in case, but don't block
            n8nService.submitOrder(orderData).catch(e => console.log('Legacy sync skipped/failed', e));

            try {
                localStorage.setItem('lastSuccessfulOrder', JSON.stringify({
                    order: orderData,
                    timestamp: new Date().toISOString()
                }));
            } catch (e) {
                console.error('Failed to save to localStorage', e);
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

    const paymentNumber = paymentMethod === 'instapay'
        ? 'abu_khatar@instapay'
        : (paymentMethod === 'vodafone_cash' ? '01144423700' : '');

    return (
        <div className="min-h-[100dvh] bg-dark-950 pb-36 relative scroll-smooth overflow-x-hidden">
            <ProgressSteps />

            <div className="max-w-md mx-auto w-full px-4 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="text-center space-y-1">
                    <h2 className="text-2xl font-black text-white display-font">تأكيد الدفع</h2>
                    <p className="text-slate-400 text-xs font-bold">راجع تفاصيل الحساب وقم بالتحويل لإتمام الطلب</p>
                </header>

                {/* Success Overlay */}
                {isSuccess && successData && (
                    <OrderConfirmation
                        orderData={successData}
                        onClose={handleCloseOrder}
                        onViewDetails={handleViewOrderDetails}
                    />
                )}

                {/* Amount Card */}
                <div className="rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-primary to-orange-600 p-6 text-center text-white relative shadow-lg shadow-primary/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -translate-x-8 translate-y-8 blur-xl"></div>

                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <CheckCircle size={32} className="opacity-90 mb-1" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest opacity-90">
                            {(isCash && orderType === 'delivery') ? 'المبلغ المطلوب عند التوصيل' : 'المبلغ المطلوب دفعه الآن'}
                        </h3>
                        <div className="text-4xl font-black display-font tracking-tight">{formatCurrency(paidNow)}</div>
                        {remaining > 0 && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full backdrop-blur-sm">
                                <span className="text-[10px] font-bold opacity-90">المتبقي عند الاستلام: {formatCurrency(remaining)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Action Section */}
                {(!isCash || (isCash && isPickup)) ? (
                    <div className="space-y-4">
                        {/* Bank Account Details */}
                        <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-4 shadow-sm">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    <CreditCard size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-400 font-bold mb-1">رقم الحساب للتحويل</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-lg font-mono font-bold text-white ltr truncate">{paymentNumber}</span>
                                        <button
                                            onClick={() => copyToClipboard(paymentNumber)}
                                            className="p-2.5 bg-dark-800 text-slate-300 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={14} className="text-primary" />
                                <span className="text-[11px] font-bold text-slate-300">إثبات التحويل (Screenshot)</span>
                            </div>

                            {!screenshot ? (
                                <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-dark-700/50 rounded-[1.25rem] bg-dark-950/50 hover:bg-dark-800 hover:border-primary/50 transition-all cursor-pointer active:scale-[0.98]">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={isProcessingFile}
                                    />
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        {isProcessingFile ? <LoadingSpinner size={20} /> : <Upload size={20} />}
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-bold text-white">اضغط لرفع الصورة</p>
                                        <p className="text-[10px] text-slate-500 font-bold">JPG, PNG (الحد الأقصى 5MB)</p>
                                    </div>
                                </label>
                            ) : (
                                <div className="relative group rounded-[1.25rem] overflow-hidden border border-white/10 bg-dark-950">
                                    <img src={screenshot} alt="Screenshot" className="w-full h-40 object-cover opacity-90" />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                        <button onClick={removeScreenshot} className="p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform flex items-center gap-2">
                                            <X size={16} />
                                            <span className="text-xs font-bold">حذف للصورة</span>
                                        </button>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 pointer-events-none">
                                        <CheckCircle size={12} />
                                        <span className="text-[10px] font-bold">تم الرفع</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[1.5rem] flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h4 className="text-emerald-500 font-bold text-sm mb-0.5">الدفع كاش عند الباب</h4>
                            <p className="text-[10px] text-slate-400 font-bold">يرجى تجهيز المبلغ للمندوب عند الاستلام</p>
                        </div>
                    </div>
                )}

                {/* Order Details & Summary List */}
                <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-5 shadow-sm space-y-4">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Receipt size={14} /> تفاصيل الحساب
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-400">سعر المنتجات</span>
                            <span className="text-white">{formatCurrency(subtotal)}</span>
                        </div>
                        {orderType === 'delivery' && (
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-400">خدمة التوصيل</span>
                                <span className="text-white">{formatCurrency(deliveryFee)}</span>
                            </div>
                        )}
                        {serviceFee > 0 && (
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-400">رسوم السيرفر</span>
                                <span className="text-white">{formatCurrency(serviceFee)}</span>
                            </div>
                        )}

                        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                            <span className="text-sm font-black text-white">الإجمالي الكلي</span>
                            <span className="text-lg font-black text-primary display-font">{formatCurrency(finalTotal)}</span>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock size={14} />
                                <span className="text-[10px] font-bold">وقت التحضير المتوقع:</span>
                            </div>
                            <span className="text-xs font-black text-white">{estimatedTime}</span>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-500 animate-in shake duration-300">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="font-bold text-xs leading-relaxed">{submitError}</p>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Action Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-xl border-t border-white/5 p-4 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-md mx-auto flex gap-3">
                    <button
                        onClick={() => navigate('/customer')}
                        disabled={isSubmitting}
                        className="flex-1 h-14 rounded-2xl font-bold border border-white/10 bg-dark-800 text-slate-300 hover:bg-dark-700 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={18} />
                        <span className="text-sm">تعديل</span>
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={isSubmitting}
                        className="flex-[2] h-14 bg-gradient-to-r from-primary to-orange-500 text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        {isSubmitting ? (
                            <LoadingSpinner size={22} color="text-white" />
                        ) : (
                            <>
                                <span className="text-[15px]">{(isCash && orderType === 'delivery') ? 'تأكيد الطلب' : 'إتمام الدفع'}</span>
                                <CheckCircle size={18} className="opacity-80" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
