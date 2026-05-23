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

const FeedbackModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});

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
            case 'phone':
                const phoneRegex = /^01[0125][0-9]{8}$/;
                if (!value) fieldError = 'رقم الهاتف مطلوب';
                else if (!phoneRegex.test(value)) fieldError = 'رقم هاتف غير صحيح';
                break;
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

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
                <div className="bg-dark-900 border border-white/[0.08] rounded-[2rem] p-8 w-full max-w-md text-center shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-emerald-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">شكراً لاهتمامك!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        تم استلام رسالتك بنجاح. نحن نقدر تواصلك وسنعمل على تحسين خدماتنا بناءً على ملاحظاتك.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
            <div className="bg-dark-900 border border-white/[0.08] rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between bg-dark-800/25">
                    <button onClick={onClose} className="p-2 bg-dark-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        الشكاوي والمقترحات
                        <MessageSquare className="text-primary" size={24} />
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar" dir="rtl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Type Toggle */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, type: 'suggestion' }))}
                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all border-2 ${formData.type === 'suggestion' 
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' 
                                    : 'bg-dark-950/50 border-white/5 text-slate-500'}`}
                            >
                                <ThumbsUp size={18} />
                                <span>مقترح</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, type: 'complaint' }))}
                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all border-2 ${formData.type === 'complaint' 
                                    ? 'bg-red-500/15 border-red-500 text-red-400' 
                                    : 'bg-dark-950/50 border-white/5 text-slate-500'}`}
                            >
                                <ThumbsDown size={18} />
                                <span>شكوى</span>
                            </button>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                <User size={14} className="text-primary" /> الاسم
                            </label>
                            <input
                                required
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="أدخل اسمك..."
                                className={`w-full bg-dark-950/50 border ${errors.fullName ? 'border-red-500' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all`}
                            />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
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
                                maxLength={11}
                                className={`w-full bg-dark-950/50 border ${errors.phone ? 'border-red-500' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all`}
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 pr-1 flex items-center gap-2">
                                <FileText size={14} className="text-primary" /> تفاصيل الرسالة
                            </label>
                            <textarea
                                required
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="اكتب مقترحك أو تفاصيل الشكوى هنا..."
                                className={`w-full bg-dark-950/50 border ${errors.message ? 'border-red-500' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all min-h-[140px] resize-none`}
                            ></textarea>
                            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle size={18} />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-3 mt-8"
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


