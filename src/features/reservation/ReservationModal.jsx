import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Calendar,
    Clock,
    User,
    Phone,
    Users,
    FileText,
    Upload,
    CheckCircle,
    CreditCard,
    AlertCircle,
    Loader2,
    Coffee,
    UtensilsCrossed,
    Smartphone,
    Wallet
} from 'lucide-react';
import { reservationService } from '../../services/api';
import useCart from '../../hooks/useCart';
import TurnstileWidget, { TURNSTILE_SITE_KEY } from '../../components/common/TurnstileWidget';

const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayDateString = () => formatDateLocal(new Date());

const getTomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateLocal(d);
};

const formatArabicDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return new Intl.DateTimeFormat('ar-EG', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        }).format(date);
    } catch {
        return dateStr;
    }
};

const ReservationModal = ({ isOpen, onClose }) => {
    const { restaurantSettings } = useCart() || {};
    const [step, setStep] = useState(1); // 1: Info, 2: Payment
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({}); // Field-level errors
    const [turnstileToken, setTurnstileToken] = useState(null);
    const hourScrollRef = useRef(null);

    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const todayLabel = formatArabicDateLabel(todayStr);
    const tomorrowLabel = formatArabicDateLabel(tomorrowStr);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        guests: 2,
        date: todayStr,
        timeHour: '',
        timeMinute: '',
        timeAmPm: '',
        time: '',
        notes: '',
        locationType: 'restaurant', // 'restaurant' or 'cafe'
        paymentMethod: 'wallet', // 'wallet' or 'instapay'
        senderAccount: '',
        isConfirmedSender: false,
        paymentProof: null,
        paymentProofPreview: null
    });

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                const today = getTodayDateString();
                setStep(1);
                setSuccess(false);
                setError(null);
                setFormData({
                    fullName: '',
                    phone: '',
                    guests: 2,
                    date: today,
                    timeHour: '',
                    timeMinute: '',
                    timeAmPm: '',
                    time: '',
                    notes: '',
                    locationType: 'restaurant',
                    paymentMethod: 'wallet',
                    senderAccount: '',
                    isConfirmedSender: false,
                    paymentProof: null,
                    paymentProofPreview: null
                });
            }, 300);
        } else {
            const today = getTodayDateString();
            const tomorrow = getTomorrowDateString();
            setFormData(prev => {
                if (prev.date !== today && prev.date !== tomorrow) {
                    return { ...prev, date: today };
                }
                return prev;
            });
        }
    }, [isOpen]);

    // Vertical scroll peek hint when modal opens
    useEffect(() => {
        if (isOpen && step === 1) {
            const timer = setTimeout(() => {
                if (hourScrollRef.current) {
                    hourScrollRef.current.scrollTo({ top: 48, behavior: 'smooth' });
                    setTimeout(() => {
                        if (hourScrollRef.current) {
                            hourScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }, 400);
                }
            }, 450);

            return () => clearTimeout(timer);
        }
    }, [isOpen, step]);

    if (!isOpen) return null;

    const validateField = (name, value) => {
        let fieldError = '';

        switch (name) {
            case 'fullName': {
                // Arabic and English characters, min 3 chars, no numbers
                const nameRegex = /^[a-zA-Z\s\u0600-\u06FF]{3,50}$/;
                if (!value.trim()) fieldError = 'الاسم الكامل مطلوب';
                else if (value.trim().length < 3) fieldError = 'يجب أن يكون الاسم 3 أحرف على الأقل';
                else if (!nameRegex.test(value)) fieldError = 'يمنع استخدام الأرقام أو الرموز في الاسم';
                break;
            }
            case 'phone': {
                // Egyptian phone format
                const phoneRegex = /^01[0125][0-9]{8}$/;
                if (!value) fieldError = 'رقم الهاتف مطلوب';
                else if (!phoneRegex.test(value)) fieldError = 'يرجى إدخال رقم هاتف مصري صحيح (11 رقم)';
                break;
            }
            case 'date': {
                const today = getTodayDateString();
                const tomorrow = getTomorrowDateString();
                if (!value) {
                    fieldError = 'يرجى اختيار موعد الحجز (اليوم أو غداً)';
                } else if (value !== today && value !== tomorrow) {
                    fieldError = 'الحجز متاح لليوم أو غداً فقط';
                }
                break;
            }
            case 'time':
                if (!value) {
                    fieldError = 'الوقت مطلوب';
                }
                break;
            case 'guests':
                if (value < 1) fieldError = 'يجب اختيار شخص واحد على الأقل';
                else if (value > 20) fieldError = 'الحد الأقصى للحجز هو 20 شخصاً';
                break;
            case 'notes':
                if (value.length > 300) fieldError = 'الملاحظات يجب ألا تزيد عن 300 حرف';
                break;
            case 'senderAccount':
                if (!value || !value.trim()) {
                    fieldError = 'بيانات الحساب / الرقم المحول منه مطلوبة للتحقق';
                } else if (formData.paymentMethod === 'wallet') {
                    const phoneRegex = /^01[0125][0-9]{8}$/;
                    if (!phoneRegex.test(value.trim())) {
                        fieldError = 'يرجى إدخال رقم محفظة مصري صحيح (11 رقم يبدأ بـ 01)';
                    }
                } else if (formData.paymentMethod === 'instapay') {
                    if (value.trim().length < 3) {
                        fieldError = 'يرجى إدخال معرف إنستاباي أو رقم صحيح (3 أحرف على الأقل)';
                    }
                }
                break;
            default:
                break;
        }
        return fieldError;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time validation
        const fieldError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
    };

    const handlePaymentMethodChange = (method) => {
        setFormData(prev => ({
            ...prev,
            paymentMethod: method,
            senderAccount: method === 'wallet' ? (prev.senderAccount || prev.phone) : (prev.senderAccount === prev.phone ? '' : prev.senderAccount),
            isConfirmedSender: false
        }));
        setErrors(prev => ({ ...prev, senderAccount: '' }));
        setError(null);
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (newData.timeHour && newData.timeMinute && newData.timeAmPm) {
                let h = parseInt(newData.timeHour, 10);
                if (newData.timeAmPm === 'PM' && h !== 12) h += 12;
                if (newData.timeAmPm === 'AM' && h === 12) h = 0;
                newData.time = `${h.toString().padStart(2, '0')}:${newData.timeMinute}`;
                setErrors(errs => ({ ...errs, time: validateField('time', newData.time) }));
            } else {
                newData.time = '';
            }

            return newData;
        });
    };

    const sanitizeInput = (str) => {
        return str.replace(/[<>]/g, "").trim(); // Simple XSS/HTML prevention
    };

    const validateForm = () => {
        const newErrors = {};
        const step1Fields = ['fullName', 'phone', 'date', 'time', 'guests', 'notes'];
        step1Fields.forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    paymentProof: file, // Store the File object
                    paymentProofPreview: reader.result // Use Base64 for preview
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = (e) => {
        e.preventDefault();
        if (validateForm()) {
            setFormData(prev => ({
                ...prev,
                senderAccount: prev.paymentMethod === 'wallet' ? (prev.senderAccount || prev.phone) : prev.senderAccount
            }));
            setStep(2);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        const senderErr = validateField('senderAccount', formData.senderAccount);
        if (senderErr) {
            setError(senderErr);
            setErrors(prev => ({ ...prev, senderAccount: senderErr }));
            return;
        }

        if (!formData.isConfirmedSender) {
            setError('يرجى تأكيد صحة بيانات الحساب / الرقم المحول منه بوضع علامة التأكيد');
            return;
        }

        if (!formData.paymentProof) {
            setError('الرجاء رفع (إسكرين شوت/صورة) التحويل لتأكيد الحجز');
            return;
        }

        if (!turnstileToken && TURNSTILE_SITE_KEY) {
            setError('يرجى إكمال اختبار التحقق الأمني (التحقق من أنك لست روبوت) لتأكيد الحجز.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const paymentNotes = `[طريقة الدفع: ${formData.paymentMethod === 'wallet' ? 'محفظة إلكترونية' : 'إنستاباي'} | المحول منه: ${formData.senderAccount}]`;
            const combinedNotes = formData.notes 
                ? `${formData.notes} | ${paymentNotes}`
                : paymentNotes;

            // Prepare production-ready JSON payload
            const payload = {
                name: sanitizeInput(formData.fullName),
                phone: formData.phone,
                guests: parseInt(formData.guests, 10),
                date: formData.date,
                time: formData.time,
                location_type: formData.locationType, // مطعم أو كافيه
                notes: sanitizeInput(combinedNotes),
                payment_screenshot: formData.paymentProof,
                payment_method: formData.paymentMethod,
                sender_account: sanitizeInput(formData.senderAccount),
                turnstile_token: turnstileToken,
                status: 'pending',
                source: 'web_reservation_form',
                created_at: new Date().toISOString()
            };

            await reservationService.submitReservation(payload);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء إرسال طلب الحجز، حاول مرة أخرى');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-dark-900 border border-white/[0.08] rounded-[1.75rem] sm:rounded-[2.25rem] p-6 sm:p-8 w-full max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <CheckCircle className="text-emerald-500 w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">تم إرسال طلبك بنجاح وهو قيد المراجعة ✅</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">
                        سيتم مراجعة طلب الحجز وصورة التحويل وتأكيده معك عبر الهاتف أو الواتساب في أقرب وقت.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
                    >
                        حسناً، فهمت
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="surface-float-3d rounded-[1.75rem] sm:rounded-[2.25rem] w-full max-w-xl max-h-[min(90dvh,720px)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <Calendar size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                                {step === 1 ? 'حجز طاولة جديدة' : 'تأكيد الحجز ودفع العربون'}
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-0.5">
                                {step === 1 ? 'الخطوة 1 من 2 - بيانات الحجز' : 'الخطوة 2 من 2 - تحويل وتأكيد العربون'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-soft-3d-dark w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-400 hover:text-red-400 flex items-center justify-center transition-all shrink-0"
                        aria-label="إغلاق"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-dark-950 shrink-0">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${step === 1 ? '50%' : '100%'}` }}
                    ></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 custom-scrollbar overscroll-contain">
                    {step === 1 ? (
                        <form id="reservation-form" onSubmit={nextStep} className="space-y-4 sm:space-y-5" dir="rtl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                {/* 1. الاسم ثنائي */}
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                        <User size={14} className="text-primary shrink-0" /> 
                                        <span>الاسم ثنائي</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="بالعربي من فضلكـ."
                                        aria-invalid={!!errors.fullName}
                                        className={`w-full bg-dark-950/60 border ${errors.fullName ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all font-medium`}
                                    />
                                    {errors.fullName && <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"><AlertCircle size={12} className="shrink-0" /> {errors.fullName}</p>}
                                </div>

                                {/* 2. رقم الهاتف */}
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                        <Phone size={14} className="text-primary shrink-0" /> 
                                        <span>رقم الهاتف</span>
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="01xxxxxxxxx"
                                        aria-invalid={!!errors.phone}
                                        maxLength={11}
                                        className={`w-full bg-dark-950/60 border ${errors.phone ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all font-mono`}
                                    />
                                    {errors.phone && <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"><AlertCircle size={12} className="shrink-0" /> {errors.phone}</p>}
                                </div>

                                {/* 3. اختار المكان */}
                                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                        <UtensilsCrossed size={14} className="text-primary shrink-0" /> 
                                        <span>اختر المكان</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 h-[48px] sm:h-[52px]">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, locationType: 'restaurant' }))}
                                            className={`flex items-center justify-center gap-2 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 touch-manipulation active:scale-[0.98] ${
                                                formData.locationType === 'restaurant'
                                                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.01]'
                                                    : 'bg-dark-950/60 border-white/[0.08] text-slate-400 hover:bg-dark-800 hover:text-white'
                                            }`}
                                        >
                                            <UtensilsCrossed size={16} />
                                            <span>مطعم</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, locationType: 'cafe' }))}
                                            className={`flex items-center justify-center gap-2 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 touch-manipulation active:scale-[0.98] ${
                                                formData.locationType === 'cafe'
                                                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30 scale-[1.01]'
                                                    : 'bg-dark-950/60 border-white/[0.08] text-slate-400 hover:bg-dark-800 hover:text-purple-300'
                                            }`}
                                        >
                                            <Coffee size={16} />
                                            <span>كافيه</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 4. ميعاد الحجز */}
                                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center justify-between select-none">
                                        <span className="flex items-center gap-2">
                                            <Calendar size={14} className="text-primary shrink-0" /> 
                                            <span>ميعاد الحجز</span>
                                        </span>
                                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-normal">اليوم أو غداً فقط</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, date: todayStr }));
                                                setErrors(prev => ({ ...prev, date: '' }));
                                            }}
                                            className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-center touch-manipulation active:scale-[0.98] ${
                                                formData.date === todayStr
                                                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.01]'
                                                    : 'bg-dark-950/60 border-white/[0.08] text-slate-400 hover:bg-dark-800 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-xs sm:text-sm font-black">اليوم</span>
                                            <span className={`text-[10px] sm:text-[11px] mt-0.5 font-medium ${formData.date === todayStr ? 'text-white/90' : 'text-slate-500'}`}>
                                                {todayLabel}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, date: tomorrowStr }));
                                                setErrors(prev => ({ ...prev, date: '' }));
                                            }}
                                            className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-center touch-manipulation active:scale-[0.98] ${
                                                formData.date === tomorrowStr
                                                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.01]'
                                                    : 'bg-dark-950/60 border-white/[0.08] text-slate-400 hover:bg-dark-800 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-xs sm:text-sm font-black">غداً</span>
                                            <span className={`text-[10px] sm:text-[11px] mt-0.5 font-medium ${formData.date === tomorrowStr ? 'text-white/90' : 'text-slate-500'}`}>
                                                {tomorrowLabel}
                                            </span>
                                        </button>
                                    </div>
                                    {errors.date && <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"><AlertCircle size={12} className="shrink-0" /> {errors.date}</p>}
                                </div>

                                {/* 5. الوقت */}
                                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                        <Clock size={14} className="text-primary shrink-0" /> 
                                        <span>الوقت</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 items-start">
                                        {/* Hour (Scrollable) */}
                                        <div className="space-y-1">
                                            <span className="block text-center text-[10px] sm:text-[11px] font-bold text-slate-500">الساعة</span>
                                            <div ref={hourScrollRef} className="h-[88px] sm:h-[96px] overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar snap-y snap-mandatory rounded-xl touch-pan-y overscroll-contain">
                                                {[...Array(12)].map((_, i) => {
                                                    const value = String(i + 1);
                                                    const isSelected = formData.timeHour === value;
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            aria-pressed={isSelected}
                                                            onClick={() => handleTimeChange({ target: { name: 'timeHour', value } })}
                                                            className={`min-h-10 sm:min-h-11 w-full shrink-0 snap-center rounded-xl border text-xs sm:text-sm font-bold transition-all touch-manipulation flex items-center justify-center ${isSelected
                                                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                                : `bg-dark-950/60 ${errors.time ? 'border-red-500/60' : 'border-white/[0.08]'} text-slate-300 active:bg-dark-800 hover:bg-dark-800`}`}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Minute */}
                                        <div className="space-y-1">
                                            <span className="block text-center text-[10px] sm:text-[11px] font-bold text-slate-500">الدقيقة</span>
                                            <div className="grid grid-cols-1 gap-1">
                                                {['00', '30'].map(value => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        aria-pressed={formData.timeMinute === value}
                                                        onClick={() => handleTimeChange({ target: { name: 'timeMinute', value } })}
                                                        className={`min-h-10 sm:min-h-11 rounded-xl border text-xs sm:text-sm font-bold transition-colors touch-manipulation ${formData.timeMinute === value
                                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                            : `bg-dark-950/60 ${errors.time ? 'border-red-500/60' : 'border-white/[0.08]'} text-slate-300 active:bg-dark-800 hover:bg-dark-800`}`}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Period (AM/PM) */}
                                        <div className="space-y-1">
                                            <span className="block text-center text-[10px] sm:text-[11px] font-bold text-slate-500">الفترة</span>
                                            <div className="grid grid-cols-1 gap-1">
                                                {['AM', 'PM'].map(value => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        aria-pressed={formData.timeAmPm === value}
                                                        onClick={() => handleTimeChange({ target: { name: 'timeAmPm', value } })}
                                                        className={`min-h-10 sm:min-h-11 rounded-xl border text-xs sm:text-sm font-bold transition-colors touch-manipulation ${formData.timeAmPm === value
                                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                            : `bg-dark-950/60 ${errors.time ? 'border-red-500/60' : 'border-white/[0.08]'} text-slate-300 active:bg-dark-800 hover:bg-dark-800`}`}
                                                    >
                                                        {value === 'AM' ? 'صباحًا' : 'مساءً'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {errors.time && <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"><AlertCircle size={12} className="shrink-0" /> {errors.time}</p>}
                                </div>

                                {/* 6. عدد الأشخاص */}
                                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                        <Users size={14} className="text-primary shrink-0" /> 
                                        <span>عدد الأشخاص</span>
                                    </label>
                                    <div className={`flex items-center bg-dark-950/60 border ${errors.guests ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} rounded-xl sm:rounded-2xl p-1.5 h-[48px] sm:h-[52px]`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVal = Math.max(1, formData.guests - 1);
                                                setFormData(p => ({ ...p, guests: newVal }));
                                                setErrors(prev => ({ ...prev, guests: validateField('guests', newVal) }));
                                            }}
                                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-dark-800 text-white rounded-lg sm:rounded-xl hover:bg-dark-700 font-bold transition-all active:scale-95"
                                        >-</button>
                                        <input
                                            readOnly
                                            value={formData.guests}
                                            className="flex-1 text-center bg-transparent text-white font-black text-base sm:text-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVal = formData.guests + 1;
                                                setFormData(p => ({ ...p, guests: newVal }));
                                                setErrors(prev => ({ ...prev, guests: validateField('guests', newVal) }));
                                            }}
                                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-primary text-white rounded-lg sm:rounded-xl shadow-md shadow-primary/20 font-bold transition-all active:scale-95"
                                        >+</button>
                                    </div>
                                    {errors.guests && <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"><AlertCircle size={12} className="shrink-0" /> {errors.guests}</p>}
                                </div>

                                {/* 7. الملاحظات */}
                                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                    <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                        <FileText size={14} className="text-primary shrink-0" /> 
                                        <span>ملاحظات إضافية (اختياري)</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="هل هناك أي تفاصيل إضافية تود إخبارنا بها؟"
                                        className={`w-full bg-dark-950/60 border ${errors.notes ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all min-h-[85px] sm:min-h-[95px] resize-none leading-relaxed`}
                                    ></textarea>
                                    <div className="flex justify-between items-center mt-1 px-1">
                                        {errors.notes && <p className="text-red-400 text-[11px] sm:text-xs font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><AlertCircle size={12} className="shrink-0" /> {errors.notes}</p>}
                                        <span className={`text-[10px] mr-auto ${formData.notes.length > 300 ? 'text-red-400' : 'text-slate-500'}`}>
                                            {formData.notes.length}/300
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 sm:space-y-5" dir="rtl">
                            {/* Arboon Notice */}
                            {(() => {
                                const depositBase = parseFloat(restaurantSettings?.reservation_deposit_amount) || 100;
                                const depositFee = parseFloat(restaurantSettings?.reservation_service_fee) || 5;
                                const totalDeposit = depositBase + depositFee;
                                const walletNum = restaurantSettings?.payment_wallet_number || '01144423700';
                                const instapayIpa = restaurantSettings?.payment_instapay_ipa || 'abu_khatar@instapay';
                                const accName = restaurantSettings?.payment_account_name || 'مطعم أبو خاطر';

                                return (
                                    <>
                                        <div className="bg-primary/10 border border-primary/20 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-center space-y-1.5">
                                            <h3 className="text-base sm:text-lg font-black text-primary">تأكيد الحجز يتطلب عربون</h3>
                                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                                                لضمان جدية الحجز وتجهيز الطاولة، نرجو تحويل مبلغ <br />
                                                <span className="text-slate-400 text-[11px] sm:text-xs">(يتم خصم العربون بالكامل من فاتورة الحساب عند الحضور)</span>
                                                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{totalDeposit} ج.م</span>
                                            </p>
                                        </div>

                                        {/* Payment Method Tabs */}
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                                <CreditCard size={14} className="text-primary shrink-0" /> 
                                                <span>اختر طريقة التحويل</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePaymentMethodChange('wallet')}
                                                    className={`flex items-center justify-center gap-2 py-3 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 active:scale-[0.98] ${
                                                        formData.paymentMethod === 'wallet'
                                                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10 scale-[1.01]'
                                                            : 'bg-dark-950/60 border-white/[0.08] text-slate-400 hover:bg-dark-800'
                                                    }`}
                                                >
                                                    <Wallet size={16} className={formData.paymentMethod === 'wallet' ? 'text-emerald-400' : 'text-slate-500'} />
                                                    <span>محفظة إلكترونية</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePaymentMethodChange('instapay')}
                                                    className={`flex items-center justify-center gap-2 py-3 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 active:scale-[0.98] ${
                                                        formData.paymentMethod === 'instapay'
                                                            ? 'bg-primary/15 border-primary text-primary shadow-md shadow-primary/10 scale-[1.01]'
                                                            : 'bg-dark-950/60 border-white/[0.08] text-slate-400 hover:bg-dark-800'
                                                    }`}
                                                >
                                                    <Smartphone size={16} className={formData.paymentMethod === 'instapay' ? 'text-primary' : 'text-slate-500'} />
                                                    <span>إنستاباي (Instapay)</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Transfer Info based on selected payment method */}
                                        <div className="bg-dark-950/60 border border-white/[0.08] p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-3">
                                            <h4 className="font-bold text-slate-400 border-b border-white/5 pb-2 text-xs sm:text-sm flex items-center gap-2">
                                                <CreditCard size={14} className="text-primary shrink-0" /> 
                                                <span>بيانات التحويل للمطعم</span>
                                            </h4>
                                            <div className="space-y-2.5">
                                                {formData.paymentMethod === 'wallet' ? (
                                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                                        <span className="text-slate-400 font-medium">فودافون كاش / المحفظة:</span>
                                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-black tracking-widest text-xs sm:text-sm md:text-base shadow-[0_0_15px_rgba(16,185,129,0.15)] select-all font-mono">
                                                            {walletNum}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                                        <span className="text-slate-400 font-medium">عنوان الدفع (Instapay IPA):</span>
                                                        <span className="bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 rounded-xl font-black tracking-wider text-xs sm:text-sm select-all font-mono">
                                                            {instapayIpa}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                                    <span className="text-slate-400 font-medium">اسم الحساب المستلم:</span>
                                                    <span className="text-white font-black">{accName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sender Account Input & Confirmation */}
                                        <div className="space-y-3 bg-dark-950/60 border border-white/[0.08] p-4 sm:p-5 rounded-2xl sm:rounded-3xl">
                                            <label className="text-xs sm:text-sm font-bold text-slate-300 flex items-center justify-between select-none">
                                                <span className="flex items-center gap-2">
                                                    {formData.paymentMethod === 'wallet' ? (
                                                        <Wallet size={14} className="text-emerald-400 shrink-0" />
                                                    ) : (
                                                        <Smartphone size={14} className="text-primary shrink-0" />
                                                    )}
                                                    <span>{formData.paymentMethod === 'wallet' ? 'رقم المحفظة المحول منها' : 'معرف / حساب إنستاباي المحول منه'}</span>
                                                    <span className="text-red-400 font-bold">*</span>
                                                </span>
                                                <span className="text-[10px] text-amber-400/90 font-medium">مطلوب للتحقق</span>
                                            </label>

                                            <input
                                                required
                                                type={formData.paymentMethod === 'wallet' ? 'tel' : 'text'}
                                                name="senderAccount"
                                                value={formData.senderAccount}
                                                onChange={handleInputChange}
                                                maxLength={formData.paymentMethod === 'wallet' ? 11 : 60}
                                                placeholder={
                                                    formData.paymentMethod === 'wallet'
                                                        ? '01xxxxxxxxx'
                                                        : 'مثال: username@instapay أو رقم الهاتف'
                                                }
                                                className={`w-full bg-dark-900 border ${
                                                    errors.senderAccount ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'
                                                } text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all font-mono`}
                                            />
                                            {errors.senderAccount && (
                                                <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                                    <AlertCircle size={12} className="shrink-0" />
                                                    <span>{errors.senderAccount}</span>
                                                </p>
                                            )}

                                            {/* Warning notice & Checkbox */}
                                            <div className="pt-2 border-t border-white/5 space-y-2.5 sm:space-y-3">
                                                <div className="flex items-start gap-2 text-[11px] sm:text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl sm:rounded-2xl">
                                                    <AlertCircle size={15} className="shrink-0 text-amber-400 mt-0.5" />
                                                    <p className="leading-relaxed">
                                                        {formData.paymentMethod === 'wallet'
                                                            ? 'تنبيه: تأكد أن التحويل تم بالفعل من هذا الرقم لضمان مطابقة الدفعة وتأكيد الحجز سريعاً.'
                                                            : 'تنبيه: يرجى كتابة عنوان إنستاباي (IPA) أو رقم الحساب/الهاتف المحول منه للتحقق من العملية.'}
                                                    </p>
                                                </div>

                                                <label className="flex items-start sm:items-center gap-2.5 sm:gap-3 cursor-pointer select-none text-xs sm:text-sm text-slate-300 group p-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isConfirmedSender}
                                                        onChange={(e) => {
                                                            setFormData(p => ({ ...p, isConfirmedSender: e.target.checked }));
                                                            if (e.target.checked && error) setError(null);
                                                        }}
                                                        className="w-4 h-4 mt-0.5 sm:mt-0 rounded border-white/20 bg-dark-900 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary shrink-0"
                                                    />
                                                    <span className="group-hover:text-white transition-colors font-medium leading-tight text-xs sm:text-sm">
                                                        {formData.paymentMethod === 'wallet'
                                                            ? 'أؤكد أنه تم التحويل من رقم المحفظة المسجل أعلاه'
                                                            : 'أؤكد أنه تم التحويل من حساب إنستاباي المسجل أعلاه'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {/* Upload Section */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                    <Upload size={14} className="text-primary shrink-0" /> 
                                    <span>أرفع صورة إيصال الدفع</span>
                                </label>

                                <div className="relative group">
                                    {formData.paymentProofPreview ? (
                                        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-video border-2 border-primary shadow-2xl shadow-primary/10">
                                            <img src={formData.paymentProofPreview} className="w-full h-full object-cover" alt="Proof" />
                                            <button
                                                onClick={() => setFormData(p => ({ ...p, paymentProof: null, paymentProofPreview: null }))}
                                                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-3 sm:gap-4 bg-dark-950/60 border-2 border-dashed border-white/[0.08] hover:border-primary/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 cursor-pointer transition-all hover:bg-dark-950">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Upload size={24} className="sm:w-7 sm:h-7" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-200 font-bold text-xs sm:text-sm">اضغط هنا لرفع الصورة</p>
                                                <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">PNG, JPG or JPEG (الحد الأقصى 10MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Cloudflare Turnstile Verification */}
                            <TurnstileWidget
                                onVerify={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken(null)}
                            />

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 text-red-400 text-xs sm:text-sm animate-in fade-in">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="font-bold leading-relaxed">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-t border-white/[0.06] bg-dark-950/80 shrink-0 flex gap-3 sm:gap-4">
                    {step === 1 ? (
                        <button
                            form="reservation-form"
                            type="submit"
                            className="btn-soft-3d-primary flex-1 text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
                        >
                            <span>التالي: خطوة العربون</span>
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setStep(1);
                                }}
                                className="btn-soft-3d-dark w-1/3 text-slate-300 font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm md:text-base"
                            >
                                رجوع
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-soft-3d-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>جاري الإرسال...</span>
                                    </>
                                ) : (
                                    <span>تأكيد وإرسال الطلب</span>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationModal;

