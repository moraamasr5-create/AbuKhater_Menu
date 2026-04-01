import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    CheckCircle,
    Receipt,
    Clock,
    ArrowRight,
    Home,
    Package,
    PartyPopper,
    QrCode as QrIcon,
    Wallet,
    Info,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatters';

const OrderConfirmation = ({ orderData, onClose, onViewDetails }) => {
    const [countdown, setCountdown] = useState(15);
    const [isClosing, setIsClosing] = useState(false);
    const [showFullDetails, setShowFullDetails] = useState(false);

    // دالة لإيقاف العد التنازلي والرجوع للرئيسية
    const stopCountdown = useCallback(() => {
        setIsClosing(true);
        onClose();
    }, [onClose]);

    useEffect(() => {
        // لو العميل فتح "تفاصيل الطلب"، بنوقف العد التنازلي عشان نخليه يراجع براحته
        if (showFullDetails) return;

        if (countdown <= 0) {
            if (!isClosing) {
                stopCountdown();
            }
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, stopCountdown, isClosing, showFullDetails]);

    // معالجة عرض التفاصيل يدوياً مع إيقاف الإغلاق التلقائي
    const handleToggleDetails = useCallback(() => {
        setShowFullDetails(prev => !prev);
    }, []);

    // إغلاق النافذة عند الضغط على Escape (A11y)
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                stopCountdown();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [stopCountdown]);

    if (isClosing) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            dir="rtl"
            className="fixed inset-0 z-[200] bg-dark-950/95 overflow-y-auto flex items-start justify-center p-4 font-arabic scrollbar-hide"
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative w-full max-w-lg sm:max-w-xl bg-dark-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500 my-8">
                
                {/* Close Button Only In Details View */}
                {showFullDetails && (
                    <button 
                        onClick={handleToggleDetails}
                        className="absolute top-6 left-6 p-2 bg-dark-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 z-20"
                    >
                        <X size={20} />
                    </button>
                )}

                {!showFullDetails ? (
                    <>
                        {/* Header Success Animation */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                    <CheckCircle size={48} className="text-white animate-bounce" />
                                </div>
                                <div className="absolute -top-2 -right-2 bg-dark-900 p-2 rounded-full border border-white/10">
                                    <PartyPopper size={20} className="text-primary" />
                                </div>
                            </div>

                            <h2 id="confirmation-title" className="text-3xl font-black text-white mb-3 leading-tight" > 
                                تهانينا! {orderData.customerName?.split(' ')[0]} <br />تم استلام طلبك بنجاح
                            </h2>
                            <p id="confirmation-description" className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                                طلبك <span className="text-white font-bold">{orderData.orderNumber}</span> قيد المعالجة الآن. شكراً لاختيارك <span className="text-primary font-bold">مطعم أبو خاطر</span>.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            <div className="sm:col-span-2 bg-dark-800/50 rounded-3xl border border-white/5 p-6 space-y-5 shadow-inner">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-dark-700/50 rounded-xl flex items-center justify-center text-slate-400">
                                            <Receipt size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">رقم الطلب</span>
                                            <span className="text-white font-black font-mono tracking-wider">{orderData.orderNumber || orderData.orderId}</span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">المبلغ</span>
                                        <span className="text-primary font-black text-xl">{formatCurrency(orderData.totalAmount)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-dark-700/30 rounded-lg flex items-center justify-center text-slate-500">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 block">الوقت المتوقع</span>
                                            <span className="text-white font-bold text-xs">{orderData.estimatedTime}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-dark-700/30 rounded-lg flex items-center justify-center text-slate-500">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 block">الأصناف</span>
                                            <span className="text-white font-bold text-xs">{orderData.itemsCount} أصناف</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-2xl shadow-black/20">
                                <QRCodeSVG
                                    value={String(orderData.orderNumber || orderData.orderId)}
                                    size={100}
                                    level="H"
                                    includeMargin={false}
                                    className="p-1"
                                />
                                <div className="mt-3 flex items-center gap-2 text-dark-900">
                                    <QrIcon size={12} />
                                    <p className="text-[9px] font-black uppercase tracking-tighter">امسح للمتابعة</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mb-8">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between mb-1 text-[10px] font-black uppercase text-emerald-400">
                                    <span>جاري المعالجة</span>
                                    <span>طلبك في الأمان</span>
                                </div>
                                <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                                        style={{ width: `${(countdown / 15) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Detailed Receipt View */
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Info size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">تفاصيل الطلب والحساب</h3>
                                <p className="text-[10px] text-slate-500 font-bold">رقم الطلب: {orderData.orderNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Order Items Table */}
                            <div className="bg-dark-800/30 rounded-2xl p-4 border border-white/5">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={14} /> قائمة الوجبات
                                </h4>
                                <div className="space-y-3">
                                    {orderData.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 flex items-center justify-center bg-dark-700 rounded-lg text-[10px] font-black text-slate-300">{item.quantity}×</span>
                                                <span className="text-slate-200 font-bold">{item.name}</span>
                                            </div>
                                            <span className="text-white font-bold">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center font-black">
                                        <span className="text-white text-base">الإجمالي المسدد</span>
                                        <span className="text-primary text-xl">{formatCurrency(orderData.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Account Details */}
                            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                <h4 className="text-[11px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Wallet size={14} /> تفاصيل الحساب المحول له
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400">وسيلة الدفع:</span>
                                        <span className="text-xs font-black text-white">
                                            {orderData.paymentMethod === 'instapay' ? 'انستاباي' : 
                                             orderData.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 
                                             orderData.paymentMethod === 'cash' ? 'نقدي (كاش)' : 'غير محدد'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400">رقم الحساب:</span>
                                        <span className="text-sm font-mono font-black text-white">{orderData.paymentNumber}</span>
                                    </div>
                                    <div className="mt-3 p-3 bg-emerald-500/10 rounded-xl flex items-center gap-3">
                                        <CheckCircle size={16} className="text-emerald-500" />
                                        <p className="text-[10px] text-emerald-500 font-black leading-tight">
                                            لقد قمت بإرفاق صورة الدفع بنجاح. سنقوم بتأكيد هويتك وتحضير طلبك فوراً.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <button 
                                onClick={handleToggleDetails}
                                className="w-full py-4 rounded-2xl bg-dark-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-dark-700 transition-all active:scale-95"
                            >
                                <ChevronUp size={16} />
                                <span>إخفاء التفاصيل</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Actions (Hidden in details view unless changed) */}
                {!showFullDetails && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleToggleDetails}
                                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-dark-800 hover:bg-dark-700 text-white font-black text-sm transition-all border border-white/5 active:scale-95 group"
                            >
                                <Receipt size={18} className="text-slate-400 group-hover:text-primary" />
                                <span>تفاصيل الطلب</span>
                                <ChevronDown size={14} className="text-slate-500" />
                            </button>
                            <button
                                onClick={stopCountdown}
                                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary hover:bg-orange-600 text-white font-black text-sm transition-all shadow-xl shadow-primary/20 active:scale-95"
                            >
                                <span>الرئيسية</span>
                                <Home size={18} />
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-slate-500 text-[10px] font-bold italic tracking-wide">
                                سيتم توجيهك تلقائياً للرئيسية خلال <span className="text-primary font-black">{countdown}</span> ثوانٍ...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

OrderConfirmation.propTypes = {
    orderData: PropTypes.shape({
        orderNumber: PropTypes.string,
        orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        totalAmount: PropTypes.number.isRequired,
        estimatedTime: PropTypes.string.isRequired,
        itemsCount: PropTypes.number.isRequired,
        customerName: PropTypes.string,
        items: PropTypes.array,
        paymentMethod: PropTypes.string,
        paymentNumber: PropTypes.string,
        deliveryAddress: PropTypes.string
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onViewDetails: PropTypes.func.isRequired
};

OrderConfirmation.defaultProps = {
    orderData: {
        customerName: 'عميلنا العزيز',
        deliveryAddress: 'سيتم التوصيل للعنوان المحدد',
        orderNumber: '0000',
        totalAmount: 0,
        estimatedTime: '30 دقيقة',
        itemsCount: 0,
        items: []
    }
};

export default OrderConfirmation;
