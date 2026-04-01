import React, { useState, useEffect } from 'react';
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
    UtensilsCrossed
} from 'lucide-react';
import { n8nService } from '../../services/api';

const ReservationModal = ({ isOpen, onClose }) => {
    const WORKING_HOURS = { start: '10:00', end: '23:59' }; // Configurable hours

    const [step, setStep] = useState(1); // 1: Info, 2: Payment
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({}); // Field-level errors

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        guests: 2,
        date: '',
        time: '',
        notes: '',
        locationType: 'restaurant', // 'restaurant' or 'cafe'
        paymentProof: null,
        paymentProofPreview: null
    });

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setSuccess(false);
                setError(null);
                setFormData({
                    fullName: '',
                    phone: '',
                    guests: 2,
                    date: '',
                    time: '',
                    notes: '',
                    locationType: 'restaurant',
                    paymentProof: null,
                    paymentProofPreview: null
                });
            }, 300);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateField = (name, value) => {
        let fieldError = '';
        
        switch (name) {
            case 'fullName':
                // Arabic and English characters, min 3 chars, no numbers
                const nameRegex = /^[a-zA-Z\s\u0600-\u06FF]{3,50}$/;
                if (!value.trim()) fieldError = 'الاسم الكامل مطلوب';
                else if (value.trim().length < 3) fieldError = 'يجب أن يكون الاسم 3 أحرف على الأقل';
                else if (!nameRegex.test(value)) fieldError = 'يمنع استخدام الأرقام أو الرموز في الاسم';
                break;
            case 'phone':
                // Egyptian phone format
                const phoneRegex = /^01[0125][0-9]{8}$/;
                if (!value) fieldError = 'رقم الهاتف مطلوب';
                else if (!phoneRegex.test(value)) fieldError = 'يرجى إدخال رقم هاتف مصري صحيح (11 رقم)';
                break;
            case 'date':
                if (!value) {
                    fieldError = 'التاريخ مطلوب';
                } else {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const maxDate = new Date();
                    maxDate.setDate(today.getDate() + 30);
                    
                    if (selectedDate < today) fieldError = 'لا يمكن اختيار تاريخ في الماضي';
                    else if (selectedDate > maxDate) fieldError = 'يمكن الحجز خلال 30 يوم من الآن فقط';
                }
                break;
            case 'time':
                if (!value) {
                    fieldError = 'الوقت مطلوب';
                } else {
                    if (value < WORKING_HOURS.start || value > WORKING_HOURS.end) {
                        fieldError = `مواعيد العمل من ${WORKING_HOURS.start} حتى ${WORKING_HOURS.end}`;
                    }
                }
                break;
            case 'guests':
                if (value < 1) fieldError = 'يجب اختيار شخص واحد على الأقل';
                else if (value > 20) fieldError = 'الحد الأقصى للحجز هو 20 شخصاً';
                break;
            case 'notes':
                if (value.length > 300) fieldError = 'الملاحظات يجب ألا تزيد عن 300 حرف';
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

    const sanitizeInput = (str) => {
        return str.replace(/[<>]/g, "").trim(); // Simple XSS/HTML prevention
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'paymentProof' && key !== 'paymentProofPreview') {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
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
                    paymentProof: reader.result, // Base64
                    paymentProofPreview: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = (e) => {
        e.preventDefault();
        if (validateForm()) {
            setStep(2);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!formData.paymentProof) {
            setError('الرجاء رفع صورة إيصال التحويل لتأكيد الحجز');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Prepare production-ready JSON payload
            const payload = {
                name: sanitizeInput(formData.fullName),
                phone: formData.phone,
                guests: parseInt(formData.guests),
                date: formData.date,
                time: formData.time,
                location_type: formData.locationType, // مطعم أو كافيه
                notes: sanitizeInput(formData.notes),
                payment_screenshot: formData.paymentProof,
                status: 'pending',
                source: 'web_reservation_form',
                created_at: new Date().toISOString()
            };

            await n8nService.submitReservation(payload);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء إرسال طلب الحجز، حاول مرة أخرى');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md text-center shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-emerald-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">تم إرسال طلبك بنجاح!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        سيتم مراجعة طلب الحجز وصورة التحويل وتأكيده معك عبر الهاتف في أقرب وقت.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        حسناً، فهمت
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-800/20">
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-dark-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        {step === 1 ? 'حجز طاولة جديدة' : 'تأكيد الحجز (العربون)'}
                        <Calendar className="text-primary" size={24} />
                    </h2>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-dark-950">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${step === 1 ? '50%' : '100%'}` }}
                    ></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {step === 1 ? (
                        <form id="reservation-form" onSubmit={nextStep} className="space-y-6" dir="rtl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <User size={14} className="text-primary" /> الاسم الكامل
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="محمد أحمد علي"
                                        aria-invalid={!!errors.fullName}
                                        className={`w-full bg-dark-950/50 border ${errors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all`}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1 pr-1 flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12} /> {errors.fullName}</p>}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <Phone size={14} className="text-primary" /> رقم الهاتف
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="01xxxxxxxxx"
                                        aria-invalid={!!errors.phone}
                                        className={`w-full bg-dark-950/50 border ${errors.phone ? 'border-red-500 ring-1 ring-red-500/20' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1 pr-1 flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12} /> {errors.phone}</p>}
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <Calendar size={14} className="text-primary" /> التاريخ
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        aria-invalid={!!errors.date}
                                        className={`w-full bg-dark-950/50 border ${errors.date ? 'border-red-500 ring-1 ring-red-500/20' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all [color-scheme:dark]`}
                                    />
                                    {errors.date && <p className="text-red-500 text-xs mt-1 pr-1 flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12} /> {errors.date}</p>}
                                </div>

                                {/* Time */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <Clock size={14} className="text-primary" /> الوقت
                                    </label>
                                    <input
                                        required
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        aria-invalid={!!errors.time}
                                        className={`w-full bg-dark-950/50 border ${errors.time ? 'border-red-500 ring-1 ring-red-500/20' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all [color-scheme:dark]`}
                                    />
                                    {errors.time && <p className="text-red-500 text-xs mt-1 pr-1 flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12} /> {errors.time}</p>}
                                </div>

                                {/* Location Type Select */}
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <UtensilsCrossed size={14} className="text-primary" /> اختر المكان المفضل
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, locationType: 'restaurant' }))}
                                            className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all border-2 ${formData.locationType === 'restaurant' 
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                                                : 'bg-dark-950/50 border-white/5 text-slate-500 hover:bg-dark-800'}`}
                                        >
                                            <UtensilsCrossed size={18} />
                                            <span>مطعم</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, locationType: 'cafe' }))}
                                            className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all border-2 ${formData.locationType === 'cafe' 
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                                                : 'bg-dark-950/50 border-white/5 text-slate-500 hover:bg-dark-800'}`}
                                        >
                                            <Coffee size={18} />
                                            <span>كافيه</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Guests */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <Users size={14} className="text-primary" /> عدد الأشخاص
                                    </label>
                                    <div className={`flex items-center bg-dark-950/50 border ${errors.guests ? 'border-red-500' : 'border-white/5'} rounded-2xl p-2 h-[60px]`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVal = Math.max(1, formData.guests - 1);
                                                setFormData(p => ({ ...p, guests: newVal }));
                                                setErrors(prev => ({ ...prev, guests: validateField('guests', newVal) }));
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-dark-800 text-white rounded-xl hover:bg-dark-700 font-bold"
                                        >-</button>
                                        <input
                                            readOnly
                                            value={formData.guests}
                                            className="flex-1 text-center bg-transparent text-white font-black text-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVal = formData.guests + 1;
                                                setFormData(p => ({ ...p, guests: newVal }));
                                                setErrors(prev => ({ ...prev, guests: validateField('guests', newVal) }));
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg shadow-primary/20 font-bold"
                                        >+</button>
                                    </div>
                                    {errors.guests && <p className="text-red-500 text-xs mt-1 pr-1 flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12} /> {errors.guests}</p>}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                        <FileText size={14} className="text-primary" /> ملاحظات إضافية (اختياري)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="هل هناك أي تفاصيل إضافية تود إخبارنا بها؟"
                                        className={`w-full bg-dark-950/50 border ${errors.notes ? 'border-red-500' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all min-h-[100px] resize-none`}
                                    ></textarea>
                                    <div className="flex justify-between items-center mt-1 px-1">
                                        {errors.notes && <p className="text-red-500 text-xs flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12} /> {errors.notes}</p>}
                                        <span className={`text-[10px] mr-auto ${formData.notes.length > 300 ? 'text-red-500' : 'text-slate-500'}`}>
                                            {formData.notes.length}/300
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6" dir="rtl">
                            {/* Arboon Notice */}
                            <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl text-center space-y-3">
                                <h3 className="text-xl font-black text-primary">تأكيد الحجز يتطلب عربون</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    لضمان جدية الحجز وتجهيز الطاولة، نرجو تحويل مبلغ <br />
                                    <span className="text-2xl font-black text-white mt-2 block">105 ج.م</span>
                                </p>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-dark-950/50 border border-white/5 p-6 rounded-3xl space-y-4">
                                <h4 className="font-bold text-slate-400 border-b border-white/5 pb-2 text-sm flex items-center gap-2">
                                    <CreditCard size={14} className="text-primary" /> بيانات التحويل
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Instapay / Wallet:</span>
                                        <span className="text-white font-black tracking-wider">01144423700</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">الاسم :</span>
                                        <span className="text-white font-black">مطعم أبو خاطر</span>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                    <Upload size={14} className="text-primary" /> أرفع صورة إيصال الدفع
                                </label>

                                <div className="relative group">
                                    {formData.paymentProofPreview ? (
                                        <div className="relative rounded-3xl overflow-hidden aspect-video border-2 border-primary shadow-2xl shadow-primary/10">
                                            <img src={formData.paymentProofPreview} className="w-full h-full object-cover" alt="Proof" />
                                            <button
                                                onClick={() => setFormData(p => ({ ...p, paymentProof: null, paymentProofPreview: null }))}
                                                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg transition-transform hover:scale-110"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-4 bg-dark-950/50 border-2 border-dashed border-white/10 hover:border-primary/50 rounded-3xl p-10 cursor-pointer transition-all hover:bg-dark-950">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Upload size={28} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-200 font-bold text-sm">اضغط هنا لرفع الصورة</p>
                                                <p className="text-slate-500 text-xs mt-1">PNG, JPG or JPEG (Max 10MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-dark-800/20 flex gap-4">
                    {step === 1 ? (
                        <button
                            form="reservation-form"
                            type="submit"
                            className="flex-1 bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <span>التالي: خطوة العربون</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="w-1/3 bg-dark-800 hover:bg-dark-700 text-slate-300 font-bold py-4 rounded-2xl transition-all active:scale-95"
                            >
                                رجوع
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
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
