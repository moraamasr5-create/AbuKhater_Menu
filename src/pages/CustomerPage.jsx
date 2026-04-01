import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    MapPin,
    AlertCircle,
    Compass,
    Map,
    Phone,
    User,
    CheckCircle2,
    Lock
} from 'lucide-react';
import useCart from '../hooks/useCart';
import { FIXED_AREAS, RESTAURANT_LOCATION, MAX_DELIVERY_DISTANCE } from '../utils/constants';
import ProgressSteps from '../components/checkout/ProgressSteps';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CustomerPage = () => {
    /**
     * 🔴 الصفحة المسؤولة عن جمع بيانات العميل (الاسم، الهاتف، والعنوان)
     * بتستخدم الـ GPS أو الخريطة لتحديد المكان بدقة لضمان سرعة التوصيل
     */
    const navigate = useNavigate();
    const {
        orderType, customerData, setCustomerData,
        paymentMethod, setPaymentMethod,
        location, setLocation,
        locationMethod, setLocationMethod,
        selectedAreaId, setSelectedAreaId,
        deliveryFee, distanceKm
    } = useCart();

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isLocating, setIsLocating] = useState(false);
    const [gpsError, setGpsError] = useState(null);

    // Map Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerInstance = useRef(null);

    // Address local state
    const [addressDetails, setAddressDetails] = useState({
        street: '',
        building: '',
        apartment: ''
    });

    // Initialize address from context if available
    useEffect(() => {
        if (customerData.address) {
            // Attempt simple parse: "شارع X - مبنى Y - شقة Z"
            const match = customerData.address.match(/شارع (.*?) - مبنى (.*?) - شقة (.*)/);
            if (match) {
                setAddressDetails({
                    street: match[1],
                    building: match[2],
                    apartment: match[3]
                });
            }
        }
    }, []);

    const handleLocationFetch = () => {
        if (!navigator.geolocation) {
            setGpsError("المتصفح لا يدعم تحديد الموقع");
            return;
        }

        setIsLocating(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lon: longitude });
                setIsLocating(false);
            },
            (error) => {
                console.error("GPS Error:", error);
                let msg = "فشل تحديد الموقع. يرجى تفعيل الـ GPS.";
                if (error.code === 1) msg = "تم رفض الوصول للمكان. يرجى السماح للمتصفح بالوصول.";
                setGpsError(msg);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Sync address to context
    useEffect(() => {
        const { street, building, apartment } = addressDetails;
        if (street || building || apartment) {
            const formatted = `شارع ${street} - مبنى ${building} - شقة ${apartment}`;
            setCustomerData(prev => ({ ...prev, address: formatted }));
        }
    }, [addressDetails, setCustomerData]);

    const validators = {
        name: (value) => {
            if (!value) return "الاسم مطلوب";
            if (value.trim().length < 2) return "الاسم يجب أن لا يقل عن حرفين";
            if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value)) return "يمنع استخدام الأرقام أو الرموز في الاسم";
            return "";
        },
        phone: (value) => {
            if (!value) return "رقم الهاتف مطلوب";
            if (!/^(010|011|012|015)/.test(value)) return "يجب أن يبدأ الرقم بـ 010, 011, 012, أو 015";
            if (!/^\d{11}$/.test(value)) return "رقم الهاتف يجب أن يتكون من 11 رقمًا";
            return "";
        },
        street: (value) => {
            if (!value) return "اسم الشارع مطلوب";
            if (value.length < 3) return "اسم الشارع يجب أن لا يقل عن 10 أحرف";
            return "";
        },
        building: (value) => {
            if (!value) return "بيانات المبنى مطلوبة";
            const isNumber = /^\d+$/.test(value);
            if (isNumber && value.length > 4) return "رقم المبنى يجب أن لا يزيد عن 5 أرقام";
            if (!isNumber && value.length > 4) return "اسم المبنى يجب أن لا يزيد عن 10 أحرف";
            return "";
        },
        apartment: (value) => {
            if (!value) return "بيانات الشقة مطلوبة";
            const isNumber = /^\d+$/.test(value);
            if (isNumber && value.length > 5) return "رقم الشقة يجب أن لا يزيد عن 5 أرقام";
            if (!isNumber && value.length > 10) return "اسم الشقة يجب أن لا يزيد عن 10 أحرف";
            return "";
        }
    };

    const validateField = (field, value, isRequired = true) => {
        if (!isRequired && !value) return ""; // Optional empty is ok

        let error = "";
        if (field === 'name') error = validators.name(value);
        if (field === 'phone1') error = validators.phone(value);
        if (field === 'phone2') error = validators.phone(value); // Mandatory per request
        if (field === 'street') error = validators.street(value);
        if (field === 'building') error = validators.building(value);
        if (field === 'apartment') error = validators.apartment(value);

        return error;
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const value = field in addressDetails ? addressDetails[field] : customerData[field];
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleChange = (field, value) => {
        if (field in addressDetails) {
            setAddressDetails(prev => ({ ...prev, [field]: value }));
        } else {
            setCustomerData(prev => ({ ...prev, [field]: value }));
        }

        // Live validation
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const isFormValid = () => {
        // Check personal info
        const nameValid = !validateField('name', customerData.name);
        const phone1Valid = !validateField('phone1', customerData.phone1);
        const phone2Valid = !validateField('phone2', customerData.phone2);

        if (!nameValid || !phone1Valid || !phone2Valid) return false;

        // Check delivery info if applicable
        if (orderType === 'delivery') {
            const hasLocation = (locationMethod === 'fixed' && selectedAreaId) ||
                ((locationMethod === 'gps' || locationMethod === 'map') && location && deliveryFee > 0);

            if (!hasLocation) return false;

            const streetValid = !validateField('street', addressDetails.street);
            const buildingValid = !validateField('building', addressDetails.building);
            const apartmentValid = !validateField('apartment', addressDetails.apartment);

            if (!streetValid || !buildingValid || !apartmentValid) return false;
        }

        return true;
    };

    // Helper for Input Class
    const getInputClass = (field) => {
        const hasError = touched[field] && errors[field];
        const base = "w-full p-4 rounded-2xl border text-white placeholder-slate-600 outline-none transition-all";
        if (hasError) return `${base} bg-red-500/5 border-red-500/50 focus:border-red-500`;
        return `${base} bg-dark-800/50 border-white/5 focus:border-primary`;
    };

    // Map Initialization (Leaflet)
    useEffect(() => {
        if (locationMethod === 'map' && mapRef.current && window.L) {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }

            const timer = setTimeout(() => {
                if (!mapRef.current || !window.L) return;

                const center = location ? [location.lat, location.lon] : [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lon];
                const zoom = location ? 15 : 13;

                try {
                    mapInstance.current = window.L.map(mapRef.current).setView(center, zoom);

                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OSM'
                    }).addTo(mapInstance.current);

                    mapInstance.current.invalidateSize();

                    // Restaurant Marker
                    window.L.marker([RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lon], {
                        icon: window.L.divIcon({
                            className: 'restaurant-marker',
                            html: '<div style="background: #ef4444; border: 2px solid white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);">🏠</div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    }).addTo(mapInstance.current).bindPopup('مطعم أبو خاطر');

                    // Delivery Range Circle
                    window.L.circle([RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lon], {
                        color: '#f97316',
                        fillColor: '#f97316',
                        fillOpacity: 0.08,
                        radius: MAX_DELIVERY_DISTANCE * 1000
                    }).addTo(mapInstance.current);

                    if (location) {
                        markerInstance.current = window.L.marker([location.lat, location.lon]).addTo(mapInstance.current);
                    }

                    mapInstance.current.on('click', (e) => {
                        const { lat, lng } = e.latlng;
                        if (markerInstance.current) {
                            markerInstance.current.setLatLng(e.latlng);
                        } else {
                            markerInstance.current = window.L.marker(e.latlng).addTo(mapInstance.current);
                        }
                        setLocation({ lat, lon: lng });
                    });

                    setTimeout(() => mapInstance.current?.invalidateSize(), 300);

                } catch (e) {
                    console.error("Map Init Error:", e);
                }
            }, 150);

            return () => {
                clearTimeout(timer);
                if (mapInstance.current) {
                    mapInstance.current.remove();
                    mapInstance.current = null;
                    markerInstance.current = null;
                }
            };
        }
    }, [locationMethod]);

    const handleNext = () => {
        if (isFormValid()) {
            navigate('/payment');
        } else {
            alert('يرجى إكمال جميع البيانات المطلوبة');
        }
    };

    return (
        <div className="min-h-[100dvh] bg-dark-950 pb-36 relative scroll-smooth overflow-x-hidden">
            <ProgressSteps />

            <div className="max-w-md mx-auto w-full px-4 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="text-center space-y-1">
                    <h2 className="text-2xl md:text-3xl font-black text-white display-font">إكمال البيانات</h2>
                    <p className="text-slate-400 text-xs md:text-sm font-bold">نحتاج لبعض المعلومات لتوصيل طلبك بأفضل جودة</p>
                </header>

                {/* Section 1: Personal Info */}
                <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-5 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <User className="text-primary" size={20} />
                        <h3 className="font-bold text-white uppercase tracking-wider text-xs">البيانات الشخصية</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-black mr-2">الاسم بالكامل <span className="text-red-500">*</span></label>
                            <input
                                required
                                placeholder="محمد علي..."
                                className={getInputClass('name')}
                                value={customerData.name}
                                onChange={e => handleChange('name', e.target.value)}
                            // onBlur={() => handleBlur('name')}
                            />
                            {touched.name && errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-black mr-2">رقم الهاتف الأساسي <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="tel"
                                placeholder="01xxxxxxxxx"
                                className={`ltr ${getInputClass('phone1')}`}
                                value={customerData.phone1}
                                onChange={e => handleChange('phone1', e.target.value)}
                                onBlur={() => handleBlur('phone1')}
                                maxLength={11}
                            />
                            {touched.phone1 && errors.phone1 && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.phone1}</p>}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-black mr-2">هاتف إضافي (إجباري) <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="tel"
                            placeholder="01xxxxxxxxx"
                            className={`ltr ${getInputClass('phone2')}`}
                            value={customerData.phone2}
                            onChange={e => handleChange('phone2', e.target.value)}
                            onBlur={() => handleBlur('phone2')}
                            maxLength={11}
                        />
                        {touched.phone2 && errors.phone2 && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.phone2}</p>}
                    </div>
                </div>

                {/* Section 2: Delivery Control */}
                {orderType === 'delivery' && (
                    <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <MapPin className="text-primary" size={20} />
                            <h3 className="font-bold text-white uppercase tracking-wider text-xs">عنوان التوصيل</h3>
                        </div>

                        {/* Location Methods Tabs */}
                        <div className="flex bg-dark-800/50 p-1.5 rounded-2xl border border-white/5">
                            {[
                                { id: 'gps', icon: Compass, label: 'GPS' },
                                { id: 'map', icon: Map, label: 'الخريطة' },
                                { id: 'fixed', icon: MapPin, label: 'مناطق ثابتة' }
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setLocationMethod(method.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs ${locationMethod === method.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <method.icon size={16} />
                                    <span>{method.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Method Specific UI */}
                        <div className="min-h-[100px] flex items-center justify-center">
                            {locationMethod === 'gps' && (
                                <div className="w-full space-y-4">
                                    <button
                                        type="button"
                                        onClick={handleLocationFetch}
                                        disabled={isLocating}
                                        className="w-full group relative py-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        {isLocating ? (
                                            <LoadingSpinner size={24} color="text-primary" />
                                        ) : (
                                            <>
                                                <Compass size={32} className={`text-primary ${location ? 'animate-none' : 'animate-pulse'}`} />
                                                <span className="font-bold text-sm text-slate-300">
                                                    {location ? 'تم تحديث الموقع بنجاح ✓' : 'انقر لتحديد موقعك تلقائياً'}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                    {gpsError && <p className="text-red-400 text-[10px] text-center">{gpsError}</p>}
                                </div>
                            )}

                            {locationMethod === 'map' && (
                                <div className="w-full space-y-4">
                                    <div ref={mapRef} className="w-full h-64 rounded-2xl border border-white/10 overflow-hidden shadow-inner grayscale-[0.5] hover:grayscale-0 transition-all z-0" />
                                    <p className="text-[10px] text-slate-500 text-center italic">اسحب الخريطة وانقر لتحديد نقطة التوصيل الدقيقة</p>
                                </div>
                            )}

                            {locationMethod === 'fixed' && (
                                <div className="w-full">
                                    <select
                                        value={selectedAreaId}
                                        onChange={(e) => setSelectedAreaId(e.target.value)}
                                        className="w-full p-4 bg-dark-800/50 rounded-2xl border border-white/5 text-white focus:border-primary outline-none transition-all appearance-none"
                                    >
                                        <option value="">-- اختر منطقتك من القائمة --</option>
                                        {FIXED_AREAS.map(area => (
                                            <option key={area.id} value={area.id}>{area.name} (توصيل: {area.fee} ج.م)</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Status Feedback */}
                        {location && orderType === 'delivery' && (
                            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${deliveryFee > 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {deliveryFee > 0 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <span>
                                    {deliveryFee > 0
                                        ? `موقعك ضمن النطاق. المسافة: ${distanceKm.toFixed(1)} كم | رسوم التوصيل: ${deliveryFee} ج.م`
                                        : `خارج النطاق المسموح (${MAX_DELIVERY_DISTANCE} كم). يرجى تغيير الموقع.`}
                                </span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">تفاصيل العنوان</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 font-bold mr-2">اسم الشارع <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    placeholder="أدخل اسم الشارع بالتفصيل..."
                                    className={getInputClass('street')}
                                    value={addressDetails.street}
                                    onChange={e => handleChange('street', e.target.value)}
                                    onBlur={() => handleBlur('street')}
                                />
                                {touched.street && errors.street && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.street}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 font-bold mr-2">رقم / اسم العمارة <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        placeholder="رقم العمارة"
                                        className={getInputClass('building')}
                                        value={addressDetails.building}
                                        onChange={e => handleChange('building', e.target.value)}
                                        onBlur={() => handleBlur('building')}
                                    />
                                    {touched.building && errors.building && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.building}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 font-bold mr-2">رقم / اسم الشقة <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        placeholder="رقم الشقة"
                                        className={getInputClass('apartment')}
                                        value={addressDetails.apartment}
                                        onChange={e => handleChange('apartment', e.target.value)}
                                        onBlur={() => handleBlur('apartment')}
                                    />
                                    {touched.apartment && errors.apartment && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.apartment}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 3: Payment Method */}
                <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-5 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Lock className="text-primary" size={20} />
                        <h3 className="font-bold text-white uppercase tracking-wider text-xs">طريقة الدفع للمطعم</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: 'cash', label: 'نقدي' },
                            { id: 'vodafone_cash', label: 'فودافون كاش' },
                            { id: 'instapay', label: 'انستاباي' }
                        ].map(method => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`py-4 rounded-2xl border-2 transition-all font-black text-sm ${paymentMethod === method.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-white/5 bg-dark-800/50 text-slate-500 hover:border-white/20'
                                    }`}
                            >
                                {method.label}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Fixed Bottom Action Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-xl border-t border-white/5 p-4 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-md mx-auto flex gap-3">
                    <button
                        onClick={() => navigate('/review')}
                        className="flex-1 h-14 rounded-2xl font-bold border border-white/10 bg-dark-800 text-slate-300 hover:bg-dark-700 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={18} />
                        <span className="text-sm">رجوع</span>
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!isFormValid()}
                        className="flex-[2] h-14 bg-gradient-to-r from-primary to-orange-500 text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        <span className="text-[15px]">تأكيد البيانات</span>
                        <ArrowLeft size={18} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerPage;
