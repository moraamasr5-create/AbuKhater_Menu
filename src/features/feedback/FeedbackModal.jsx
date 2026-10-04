import React, { useState, useEffect } from 'react';
import {
    X,
    MessageSquare,
    User,
    Phone,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    Send,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { feedbackService } from '../../services/api';
import TurnstileWidget, { TURNSTILE_SITE_KEY } from '../../components/common/TurnstileWidget';

const FeedbackModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});
    const [turnstileToken, setTurnstileToken] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        type: 'suggestion', // 'suggestion' or 'complaint'
        message: ''
    });

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setSuccess(false);
                setError(null);
                setTurnstileToken(null);
                setFormData({
                    fullName: '',
                    phone: '',
                    type: 'suggestion',
                    message: ''
                });
            }, 300);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateField = (name, value) => {
        let fieldError = '';
        switch (name) {
            case 'fullName':
                if (!value.trim()) fieldError = 'الاسم مطلوب';
                else if (value.trim().length < 3) fieldError = 'الاسم قصير جداً';
                break;
            case 'phone': {
                const phoneRegex = /^01[0125][0-9]{8}$/;
                if (!value) fieldError = 'رقم الهاتف مطلوب';
                else if (!phoneRegex.test(value)) fieldError = 'رقم هاتف غير صحيح';
                break;
            }
            case 'message':
                if (!value.trim()) fieldError = 'محتوى الرسالة مطلوب';
                else if (value.trim().length < 10) fieldError = 'يرجى كتابة 10 أحرف على الأقل';
                break;
            default:
                break;
        }
        return fieldError;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        const fieldError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const err = validateField(key, formData[key]);
            if (err) newErrors[key] = err;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!turnstileToken && TURNSTILE_SITE_KEY) {
            setError('يرجى إكمال اختبار التحقق الأمني (التحقق من أنك لست روبوت) قبل الإرسال.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                turnstile_token: turnstileToken,
                timestamp: new Date().toISOString(),
                source: 'web_feedback_form'
            };

            await feedbackService.submitFeedback(payload);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="surface-float-3d bg-dark-900 border border-white/[0.08] rounded-[1.75rem] sm:rounded-[2.25rem] p-6 sm:p-8 w-full max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                        <CheckCircle className="text-emerald-500 w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">شكراً لاهتمامك!</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">
                        تم استلام رسالتك بنجاح. نحن نقدر تواصلك وسنعمل على تحسين خدماتنا بناءً على ملاحظاتك.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full btn-soft-3d-primary text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all active:scale-95 text-xs sm:text-sm"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="surface-float-3d bg-dark-900 border border-white/[0.08] rounded-[1.75rem] sm:rounded-[2.25rem] w-full max-w-lg max-h-[min(90dvh,680px)] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-white/[0.06] flex items-center justify-between bg-dark-800/30 shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <MessageSquare size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                                الشكاوى والمقترحات
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-0.5">
                                رأيك يهمنا لتطوير وتجويد خدماتنا
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-dark-800/80 border border-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all active:scale-95 shrink-0"
                        aria-label="إغلاق"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 custom-scrollbar space-y-4 sm:space-y-5 overscroll-contain" dir="rtl">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        {/* Type Toggle */}
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-2 sm:mb-4">
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, type: 'suggestion' }))}
                                className={`flex items-center justify-center gap-2 py-3 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all border active:scale-[0.98] ${
                                    formData.type === 'suggestion' 
                                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400 shadow-[0_4px_14px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] font-black' 
                                        : 'bg-dark-950/50 border-white/5 text-slate-400 hover:bg-dark-800/80'
                                }`}
                            >
                                <ThumbsUp size={16} className="shrink-0" />
                                <span>مقترح</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, type: 'complaint' }))}
                                className={`flex items-center justify-center gap-2 py-3 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all border active:scale-[0.98] ${
                                    formData.type === 'complaint' 
                                        ? 'bg-red-500/15 border-red-500/60 text-red-400 shadow-[0_4px_14px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] font-black' 
                                        : 'bg-dark-950/50 border-white/5 text-slate-400 hover:bg-dark-800/80'
                                }`}
                            >
                                <ThumbsDown size={16} className="shrink-0" />
                                <span>شكوى</span>
                            </button>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                <User size={14} className="text-primary shrink-0" /> 
                                <span>الاسم</span>
                            </label>
                            <input
                                required
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="أدخل اسمك الكريم..."
                                className={`w-full surface-recessed-3d border ${errors.fullName ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all`}
                            />
                            {errors.fullName && (
                                <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>{errors.fullName}</span>
                                </p>
                            )}
                        </div>

                        {/* Phone */}
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
                                maxLength={11}
                                className={`w-full surface-recessed-3d border ${errors.phone ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all font-mono`}
                            />
                            {errors.phone && (
                                <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>{errors.phone}</span>
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-xs sm:text-sm font-bold text-slate-300 pr-1 flex items-center gap-2 select-none">
                                <FileText size={14} className="text-primary shrink-0" /> 
                                <span>تفاصيل الرسالة</span>
                            </label>
                            <textarea
                                required
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="اكتب مقترحك أو تفاصيل الشكوى هنا..."
                                className={`w-full surface-recessed-3d border ${errors.message ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-white/[0.08]'} text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all min-h-[110px] sm:min-h-[130px] resize-none leading-relaxed`}
                            ></textarea>
                            {errors.message && (
                                <p className="text-red-400 text-[11px] sm:text-xs font-bold mt-1.5 pr-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>{errors.message}</span>
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 text-red-400 text-xs sm:text-sm animate-in fade-in">
                                <AlertCircle size={18} className="shrink-0" />
                                <p className="font-bold leading-relaxed">{error}</p>
                            </div>
                        )}

                        <TurnstileWidget
                            onVerify={(token) => setTurnstileToken(token)}
                            onExpire={() => setTurnstileToken(null)}
                            theme="dark"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-soft-3d-primary disabled:opacity-50 text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 text-xs sm:text-sm md:text-base mt-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>إرسال الآن</span>
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;


