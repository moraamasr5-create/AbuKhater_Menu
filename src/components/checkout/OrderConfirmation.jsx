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
    QrCode as QrIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatters';

const OrderConfirmation = ({ orderData, onClose, onViewDetails }) => {
    const [countdown, setCountdown] = useState(10);
    const [isClosing, setIsClosing] = useState(false);

    // دالة لإيقاف العد التنازلي والرجوع للرئيسية
    const stopCountdown = useCallback(() => {
        setIsClosing(true);
        onClose();
    }, [onClose]);

    useEffect(() => {
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
    }, [countdown, stopCountdown, isClosing]);

    // معالجة عرض التفاصيل يدوياً مع إيقاف الإغلاق التلقائي
    const handleViewDetails = useCallback(() => {
        setIsClosing(true);
        onViewDetails();
    }, [onViewDetails]);

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
            className="fixed inset-0 z-[200] bg-dark-950/95 overflow-y-auto flex items-center justify-center p-4 font-arabic"
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-dark-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-6 sm:p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500">

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

                    <h2 id="confirmation-title" className="text-3xl font-black text-white mb-3" > تهانينا! تم استلام طلبك   <br />سيتم التواصل معاكم في خلال دقائق</h2>
                    <p id="confirmation-description" className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                        شكراً لاختيارك <span className="text-primary font-bold">مطعم أبو خاطر</span>. طلبك الآن قيد المعالجة وسنقوم بتحضيره لك .
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Order Summary ID Card */}
                    <div className="md:col-span-2 bg-dark-800/50 rounded-3xl border border-white/5 p-6 space-y-5 shadow-inner">
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
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">المبلغ الإجمالي</span>
                                <span className="text-primary font-black text-xl">{formatCurrency(orderData.totalAmount)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-dark-700/30 rounded-lg flex items-center justify-center text-slate-500">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block">وقت التحضير</span>
                                    <span className="text-white font-bold text-xs">{orderData.estimatedTime}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-dark-700/30 rounded-lg flex items-center justify-center text-slate-500">
                                    <Package size={16} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block">عدد الأصناف</span>
                                    <span className="text-white font-bold text-xs">{orderData.itemsCount} صنف</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-2xl shadow-black/20">
                        <QRCodeSVG
                            value={String(orderData.orderNumber || orderData.orderId)}
                            size={120}
                            level="H"
                            includeMargin={false}
                            className="p-1"
                        />
                        <div className="mt-3 flex items-center gap-2 text-dark-900">
                            <QrIcon size={14} />
                            <p className="text-[10px] font-black uppercase tracking-tighter">امسح لمتابعة الطلب</p>
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mb-8">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between mb-1 text-[10px] font-black uppercase text-emerald-400">
                            <span>جاري المعالجة</span>
                            <span>{Math.round((countdown / 10) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${(countdown / 10) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleViewDetails}
                            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-dark-800 hover:bg-dark-700 text-white font-black text-sm transition-all border border-white/5 active:scale-95"
                        >
                            <ArrowRight size={18} className="rtl:rotate-180" />
                            <span>تفاصيل الطلب</span>
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
        itemsCount: 0
    }
};

export default OrderConfirmation;
