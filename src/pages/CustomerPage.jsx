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
    Lock,
    Wallet,
    CreditCard,
    Receipt,
    Store
} from 'lucide-react';
import useCart from '../hooks/useCart';
import { RESTAURANT_LOCATION, MAX_DELIVERY_DISTANCE } from '../core/constants';
import ProgressSteps from '../features/checkout/ProgressSteps';
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
        deliveryFee, distanceKm,
        deliveryZones, maxDistance
    } = useCart();

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isLocating, setIsLocating] = useState(false);
    const [gpsError, setGpsError] = useState(null);

    const [savedCustomers, setSavedCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('saved_customers') || '[]');
        setSavedCustomers(saved);
    }, []);

    const handleSelectCustomer = (entry) => {
        setCustomerData(prev => ({
            ...prev,
            name: entry.name,
            phone1: entry.phone1,
            phone2: entry.phone2,
            address: entry.address
        }));

        const match = entry.address?.match(/شارع (.*?) - مبنى (.*?) - شقة (.*)/);
        if (match) setAddressDetails({ street: match[1], building: match[2], apartment: match[3] });

        setShowSuggestions(false);
    };

    const handleDeleteCustomer = (phone1) => {
        const updated = savedCustomers.filter(c => c.phone1 !== phone1);
        setSavedCustomers(updated);
        localStorage.setItem('saved_customers', JSON.stringify(updated));
        if (updated.length === 0) setShowSuggestions(false);
    };

    // Map Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerInstance = useRef(null);
    const pendingGPSLocation = useRef(null); // موقع GPS ينتظر وضعه على الخريطة

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
            setGpsError("المتصفح لا يدعم تحديد الموقع، يمكنك اختيار منطقتك من القائمة.");
            setLocationMethod('fixed');
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
                let msg = "تعذر تحديد الموقع تلقائياً. تم تحويلك لاختيار منطقتك من القائمة.";
                if (error.code === 1) msg = "تم رفض إذن الموقع. يمكنك اختيار منطقتك من القائمة أدناه.";
                setGpsError(msg);
                setIsLocating(false);
                setLocationMethod('fixed');
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
            if (!value || !value.trim()) return "الاسم مطلوب";
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
            if (!value || !value.trim()) return "اسم الشارع مطلوب";
            if (value.trim().length < 3) return "اسم الشارع يجب أن لا يقل عن 3 أحرف";
            return "";
        },
        building: (value) => {
            if (!value || !value.trim()) return "بيانات المبنى مطلوبة";
            const isNumber = /^\d+$/.test(value.trim());
            if (isNumber && value.trim().length > 5) return "رقم المبنى يجب أن لا يزيد عن 5 أرقام";
            if (!isNumber && value.trim().length > 30) return "اسم المبنى يجب أن لا يزيد عن 30 حرفًا";
            return "";
        },
        apartment: (value) => {
            if (!value || !value.trim()) return "بيانات الشقة مطلوبة";
            const isNumber = /^\d+$/.test(value.trim());
            if (isNumber && value.trim().length > 5) return "رقم الشقة يجب أن لا يزيد عن 5 أرقام";
            if (!isNumber && value.trim().length > 30) return "بيانات الشقة يجب أن لا تزيد عن 30 حرفًا";
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
        const base = "w-full px-4 py-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-white placeholder-slate-600 outline-none transition-all text-[15px] sm:text-base leading-normal";
        if (hasError) return `${base} bg-red-500/5 border-red-500/50 focus:border-red-500`;
        return `${base} bg-dark-800/50 border-white/5 focus:border-primary`;
    };

    // Helper to create glowing custom customer marker with boundary protection
    const createCustomerMarker = (latlng, radiusKm, restLat, restLng) => {
        if (!window.L) return null;
        const marker = window.L.marker(latlng, {
            draggable: true,
            autoPan: true,
            icon: window.L.divIcon({
                className: 'customer-pin-marker',
                html: '<div style="background: #ea580c; border: 3px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(234, 88, 12, 0.8); font-size: 16px; cursor: grab;">📍</div>',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            })
        });

        marker.on('dragend', (e) => {
            const newLatLng = e.target.getLatLng();
            const dist = calculateDistance(restLat, restLng, newLatLng.lat, newLatLng.lng);
            if (dist > radiusKm) {
                alert(`عفواً، الموقع خارج نطاق التوصيل المسموح (${radiusKm} كم).`);
                if (location) {
                    marker.setLatLng([location.lat, location.lon]);
                }
                return;
            }
            setLocation({ lat: newLatLng.lat, lon: newLatLng.lng });
        });

        return marker;
    };

    // Helper to create restaurant marker
    const createRestaurantMarker = (latlng) => {
        if (!window.L) return null;
        return window.L.marker(latlng, {
            icon: window.L.divIcon({
                className: 'restaurant-marker',
                html: '<div style="background: #ef4444; border: 2.5px solid white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(239, 68, 68, 0.6); font-size: 15px;">🏠</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        }).bindPopup('<b>مطعم أبو خاطر</b>');
    };

    // Map Initialization (Leaflet - Highly Optimized for Mobile)
    useEffect(() => {
        if (locationMethod === 'map' && mapRef.current) {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
            }

            const timer = setTimeout(() => {
                if (!mapRef.current || !window.L) return;

                const restLat = RESTAURANT_LOCATION.lat;
                const restLng = RESTAURANT_LOCATION.lon;
                const radiusKm = parseFloat(maxDistance) || MAX_DELIVERY_DISTANCE || 12;

                // Restrict map panning to only allowed delivery area
                const latMargin = (radiusKm * 1.15) / 111.0;
                const lonMargin = (radiusKm * 1.15) / (111.0 * Math.cos(restLat * (Math.PI / 180)));
                const southWest = window.L.latLng(restLat - latMargin, restLng - lonMargin);
                const northEast = window.L.latLng(restLat + latMargin, restLng + lonMargin);
                const deliveryBounds = window.L.latLngBounds(southWest, northEast);

                const center = location ? [location.lat, location.lon] : [restLat, restLng];
                const initialZoom = location ? 16 : 14;

                try {
                    mapInstance.current = window.L.map(mapRef.current, {
                        attributionControl: false,
                        zoomControl: true,
                        dragging: true,
                        touchZoom: true,
                        scrollWheelZoom: true,
                        doubleClickZoom: true,
                        tap: false,
                        minZoom: 13,
                        maxZoom: 18,
                        maxBounds: deliveryBounds,
                        maxBoundsViscosity: 1.0,
                        preferCanvas: true
                    }).setView(center, Math.min(Math.max(initialZoom, 13), 18));

                    // Lightweight Google Hybrid Tiles with buffer caching and idle updates
                    window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                        subdomains: ['0', '1', '2', '3'],
                        minZoom: 13,
                        maxZoom: 18,
                        keepBuffer: 2,
                        updateWhenIdle: true,
                        updateWhenZooming: false
                    }).addTo(mapInstance.current);

                    // Restaurant Marker
                    createRestaurantMarker([restLat, restLng]).addTo(mapInstance.current);

                    // Delivery Range Circle
                    const radiusMeters = radiusKm * 1000;
                    window.L.circle([restLat, restLng], {
                        color: '#ea580c',
                        fillColor: '#ea580c',
                        fillOpacity: 0.08,
                        weight: 2,
                        dashArray: '5, 8',
                        radius: radiusMeters
                    }).addTo(mapInstance.current);

                    // Customer initial marker if location exists
                    if (location) {
                        markerInstance.current = createCustomerMarker([location.lat, location.lon], radiusKm, restLat, restLng);
                        if (markerInstance.current) markerInstance.current.addTo(mapInstance.current);
                    }

                    // Click anywhere to place / move pin within delivery boundary
                    mapInstance.current.on('click', (e) => {
                        const { lat, lng } = e.latlng;
                        const dist = calculateDistance(restLat, restLng, lat, lng);
                        if (dist > radiusKm) {
                            alert(`عفواً، الموقع المختار خارج نطاق التوصيل المسموح (${radiusKm} كم).`);
                            return;
                        }
                        if (markerInstance.current) {
                            markerInstance.current.setLatLng(e.latlng);
                        } else {
                            markerInstance.current = createCustomerMarker(e.latlng, radiusKm, restLat, restLng);
                            if (markerInstance.current) markerInstance.current.addTo(mapInstance.current);
                        }
                        setLocation({ lat, lon: lng });
                    });

                    // Size invalidations for smooth zero-glitch rendering
                    [100, 300, 600, 1000].forEach(delay => {
                        setTimeout(() => {
                            mapInstance.current?.invalidateSize();

                            // Fly to pending GPS location if user clicked "أين أنا" from GPS tab
                            if (pendingGPSLocation.current && mapInstance.current) {
                                const { lat, lon } = pendingGPSLocation.current;
                                const dist = calculateDistance(restLat, restLng, lat, lon);
                                if (dist <= radiusKm) {
                                    const latlng = window.L.latLng(lat, lon);
                                    mapInstance.current.flyTo(latlng, 16);
                                    if (markerInstance.current) {
                                        markerInstance.current.setLatLng(latlng);
                                    } else {
                                        markerInstance.current = createCustomerMarker(latlng, radiusKm, restLat, restLng);
                                        if (markerInstance.current) markerInstance.current.addTo(mapInstance.current);
                                    }
                                }
                                pendingGPSLocation.current = null;
                            }
                        }, delay);
                    });

                } catch (e) {
                    console.error("Map Init Error:", e);
                }
            }, 100);

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

    // زر "أين انا!" داخل الخريطة
    const handleLocateMeOnMap = () => {
        if (!navigator.geolocation) {
            alert("المتصفح لا يدعم تحديد الموقع");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lon: longitude });
                setIsLocating(false);

                if (mapInstance.current && window.L) {
                    const newLatLng = window.L.latLng(latitude, longitude);
                    mapInstance.current.flyTo(newLatLng, 16);
                    if (markerInstance.current) {
                        markerInstance.current.setLatLng(newLatLng);
                    } else {
                        markerInstance.current = createCustomerMarker(newLatLng);
                        if (markerInstance.current) markerInstance.current.addTo(mapInstance.current);
                    }
                }
            },
            (error) => {
                console.error("GPS Error:", error);
                alert("فشل تحديد الموقع. يرجى تفعيل الـ GPS والسماح للمتصفح بالوصول.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // زر "أين انا!" في قسم GPS — يحدد الموقع ثم ينتقل للخريطة ويضع الدبوس
    const handleLocateAndSwitchToMap = () => {
        if (!navigator.geolocation) {
            setGpsError("المتصفح لا يدعم تحديد الموقع");
            return;
        }
        setIsLocating(true);
        setGpsError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // احفظ الموقع في الـ ref ليُستخدم فور تهيئة الخريطة
                pendingGPSLocation.current = { lat: latitude, lon: longitude };
                setLocation({ lat: latitude, lon: longitude });
                setIsLocating(false);
                // الانتقال لتبويب الخريطة سيُشغّل useEffect الذي يضع الدبوس
                setLocationMethod('map');
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

    const handleNext = () => {
        if (orderType === 'pickup' && paymentMethod === 'cash') {
            alert('عفوًا، لا يوجد خيار الدفع النقدي في خدمة استلام من الفرع');
            return;
        }

        if (isFormValid()) {
            const saved = JSON.parse(localStorage.getItem('saved_customers') || '[]');
            const newEntry = {
                name: customerData.name,
                phone1: customerData.phone1,
                phone2: customerData.phone2,
                address: customerData.address
            };
            const filtered = saved.filter(c => c.phone1 !== newEntry.phone1);
            const updated = [newEntry, ...filtered].slice(0, 5);
            localStorage.setItem('saved_customers', JSON.stringify(updated));

            navigate('/payment');
        } else {
            // Touch and validate all required fields for instant inline feedback
            const allTouched = { name: true, phone1: true, phone2: true };
            const allErrors = {
                name: validateField('name', customerData.name),
                phone1: validateField('phone1', customerData.phone1),
                phone2: validateField('phone2', customerData.phone2)
            };
            if (orderType === 'delivery') {
                allTouched.street = true;
                allTouched.building = true;
                allTouched.apartment = true;
                allErrors.street = validateField('street', addressDetails.street);
                allErrors.building = validateField('building', addressDetails.building);
                allErrors.apartment = validateField('apartment', addressDetails.apartment);
            }
            setTouched(prev => ({ ...prev, ...allTouched }));
            setErrors(prev => ({ ...prev, ...allErrors }));

            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-dark-950 pb-[max(9rem,env(safe-area-inset-bottom,0px))] sm:pb-36 relative scroll-smooth overflow-x-hidden">
            <ProgressSteps />

            <div className="max-w-md mx-auto w-full px-3 sm:px-4 pt-5 sm:pt-6 space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="text-center space-y-2">
                    <h2 className="text-[1.35rem] sm:text-2xl md:text-3xl font-black text-white display-font tracking-tight">إكمال البيانات</h2>
                    <p className="text-slate-400/95 text-[13px] sm:text-sm font-semibold leading-relaxed px-1">
                        {orderType === 'pickup' ? 'بياناتك لتجهيز واستلام طلبك من الفرع' : 'نحتاج لبعض المعلومات لتوصيل طلبك بأفضل سرعة'}
                    </p>
                </header>

                {/* Pickup Context Banner */}
                {orderType === 'pickup' && (
                    <div className="bg-teal-500/10 border border-teal-500/25 p-4 rounded-2xl flex items-center gap-3.5 animate-in fade-in">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                            <Store size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-teal-400 text-xs sm:text-sm">استلام من المطعم</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">فرع مطعم أبو خاطر الرئيسي — يرجى تجهيز الاسم ورقم الهاتف عند الاستلام.</p>
                        </div>
                    </div>
                )}

                {/* Section 1: Personal Info */}
                <div className="bg-dark-900 rounded-2xl sm:rounded-[1.5rem] border border-white/[0.07] p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3 sm:pb-4">
                        <User className="text-primary" size={20} />
                        <h3 className="font-bold text-white uppercase tracking-wider text-xs">البيانات الشخصية</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 relative">
                            <label className="text-xs font-bold text-slate-300 mr-1.5 flex items-center gap-1">
                                الاسم بالكامل <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                placeholder="أدخل اسمك ثنائي..."
                                className={getInputClass('name')}
                                value={customerData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                onFocus={() => { if (savedCustomers.length > 0) setShowSuggestions(true); }}
                                onBlur={() => {
                                    handleBlur('name');
                                    setTimeout(() => setShowSuggestions(false), 200);
                                }}
                            />
                            {touched.name && errors.name && (
                                <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>{errors.name}</span>
                                </p>
                            )}

                            {showSuggestions && savedCustomers.length > 0 && (
                                <div className="absolute top-[100%] left-0 w-full mt-1 bg-dark-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                                    {savedCustomers.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center px-4 py-3 hover:bg-dark-800 cursor-pointer border-b border-white/5 last:border-0"
                                            onClick={() => handleSelectCustomer(entry)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">{entry.name}</span>
                                                <span className="text-xs text-slate-500">{entry.phone1}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-slate-500 hover:text-red-400 text-xs p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCustomer(entry.phone1);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300 mr-1.5 flex items-center gap-1">
                                رقم الهاتف الأساسي <span className="text-red-500">*</span>
                            </label>
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
                            {touched.phone1 && errors.phone1 && (
                                <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>{errors.phone1}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 mr-1.5 flex items-center gap-1">
                            هاتف إضافي (للطوارئ والتأكيد) <span className="text-red-500">*</span>
                        </label>
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
                        {touched.phone2 && errors.phone2 && (
                            <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                                <AlertCircle size={12} className="shrink-0" />
                                <span>{errors.phone2}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Section 2: Delivery Control */}
                {orderType === 'delivery' && (
                    <div className="bg-dark-900 rounded-2xl sm:rounded-[1.5rem] border border-white/[0.07] p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
                        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3 sm:pb-4">
                            <MapPin className="text-primary" size={20} />
                            <h3 className="font-bold text-white uppercase tracking-wider text-xs">عنوان التوصيل</h3>
                        </div>

                        {/* Location Methods Tabs */}
                        <div className="flex bg-dark-800/55 p-1.5 rounded-xl sm:rounded-2xl border border-white/[0.06] gap-0.5">
                            {[
                                { id: 'gps', icon: Compass, label: 'GPS' },
                                { id: 'map', icon: Map, label: 'الخريطة' },
                                { id: 'fixed', icon: MapPin, label: 'مناطق ثابتة' }
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setLocationMethod(method.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 min-h-[44px] rounded-lg sm:rounded-xl transition-all font-bold text-[11px] sm:text-xs ${locationMethod === method.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/25'
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
                                <div className="w-full space-y-3">
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
                                    <button
                                        type="button"
                                        onClick={handleLocateAndSwitchToMap}
                                        disabled={isLocating}
                                        className="w-full bg-dark-800/70 border border-white/10 shadow text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:border-primary transition-all disabled:opacity-50"
                                    >
                                        {isLocating ? <LoadingSpinner size={14} color="text-white" /> : <MapPin size={16} />}
                                        <span>أين انا! (على الخريطة)</span>
                                    </button>
                                    {gpsError && <p className="text-red-400 text-[10px] text-center">{gpsError}</p>}
                                </div>
                            )}

                            {locationMethod === 'map' && (
                                <div className="w-full space-y-4">
                                    <div className="relative w-full">
                                        <div ref={mapRef} className="w-full h-56 sm:h-64 rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden shadow-inner transition-all z-0" />
                                        <button
                                            type="button"
                                            onClick={handleLocateMeOnMap}
                                            disabled={isLocating}
                                            className="absolute bottom-4 left-4 z-[400] bg-dark-900/90 backdrop-blur border border-white/10 shadow-lg text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary hover:border-primary transition-all disabled:opacity-50"
                                        >
                                            {isLocating ? <LoadingSpinner size={14} color="text-white" /> : <MapPin size={14} />}
                                            <span>أين انا!</span>
                                        </button>
                                    </div>
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
                                        {(deliveryZones || []).map(zone => (
                                            <option key={zone.id} value={zone.id}>{zone.name} (توصيل: {parseFloat(zone.fee)} ج.م)</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Status Feedback */}
                        {orderType === 'delivery' && (
                            <>
                                {locationMethod === 'fixed' && selectedAreaId && (
                                    <div className="p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-in fade-in">
                                        <CheckCircle2 size={16} className="shrink-0" />
                                        <span>
                                            المنطقة المختارة: {(deliveryZones || []).find(z => z.id === selectedAreaId || z.name === selectedAreaId)?.name || 'المنطقة المحددة'} | رسوم التوصيل: {deliveryFee} ج.م
                                        </span>
                                    </div>
                                )}

                                {(locationMethod === 'gps' || locationMethod === 'map') && location && (
                                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border animate-in fade-in ${deliveryFee > 0
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                        {deliveryFee > 0 ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                                        <span>
                                            {deliveryFee > 0
                                                ? `موقعك ضمن النطاق | المسافة: ${distanceKm.toFixed(1)} كم | رسوم التوصيل: ${deliveryFee} ج.م`
                                                : `خارج النطاق المسموح (${maxDistance || 12} كم). يرجى اختيار منطقة ثابتة أو تغيير الموقع.`}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">تفاصيل العنوان والمبنى</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300 mr-1.5 flex items-center gap-1">
                                    اسم الشارع <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    placeholder="أدخل اسم الشارع بالتفصيل..."
                                    className={getInputClass('street')}
                                    value={addressDetails.street}
                                    onChange={e => handleChange('street', e.target.value)}
                                    onBlur={() => handleBlur('street')}
                                />
                                {touched.street && errors.street && (
                                    <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                                        <AlertCircle size={12} className="shrink-0" />
                                        <span>{errors.street}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 mr-1.5 flex items-center gap-1">
                                        رقم / اسم العمارة <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        placeholder="مثال: عمارة 14 أو برج النور"
                                        className={getInputClass('building')}
                                        value={addressDetails.building}
                                        onChange={e => handleChange('building', e.target.value)}
                                        onBlur={() => handleBlur('building')}
                                    />
                                    {touched.building && errors.building && (
                                        <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                                            <AlertCircle size={12} className="shrink-0" />
                                            <span>{errors.building}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 mr-1.5 flex items-center gap-1">
                                        رقم / اسم الشقة <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        placeholder="مثال: شقة 4 الدور 2"
                                        className={getInputClass('apartment')}
                                        value={addressDetails.apartment}
                                        onChange={e => handleChange('apartment', e.target.value)}
                                        onBlur={() => handleBlur('apartment')}
                                    />
                                    {touched.apartment && errors.apartment && (
                                        <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                                            <AlertCircle size={12} className="shrink-0" />
                                            <span>{errors.apartment}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 3: Payment Method */}
                <div className="bg-dark-900 rounded-2xl sm:rounded-[1.5rem] border border-white/[0.07] p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3 sm:pb-4">
                        <Lock className="text-primary" size={20} />
                        <h3 className="font-bold text-white uppercase tracking-wider text-xs">طريقة الدفع للمطعم</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        {[
                            {
                                id: 'cash',
                                label: 'الدفع كاش',
                                desc: 'نقداً عند الاستلام',
                                icon: Receipt,
                                badge: 'الأسهل',
                                activeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            },
                            {
                                id: 'vodafone_cash',
                                label: 'محفظة كاش',
                                desc: 'فودافون / اتصالات / أورانج',
                                icon: Wallet,
                                badge: 'سريع',
                                activeColor: 'border-primary bg-primary/10 text-primary'
                            },
                            {
                                id: 'instapay',
                                label: 'انستاباي (InstaPay)',
                                desc: 'تحويل بنكي',
                                icon: CreditCard,
                                badge: 'سريع',
                                activeColor: 'border-purple-500 bg-purple-500/10 text-purple-400'
                            }
                        ].map(method => {
                            const IconComponent = method.icon;
                            const isSelected = paymentMethod === method.id;
                            const isPickupCashUnavailable = orderType === 'pickup' && method.id === 'cash';
                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => {
                                        if (isPickupCashUnavailable) {
                                            alert('عفوًا، لا يوجد خيار الدفع النقدي في خدمة استلام من الفرع');
                                            return;
                                        }
                                        if (navigator.vibrate) navigator.vibrate(15);
                                        setPaymentMethod(method.id);
                                    }}
                                    aria-disabled={isPickupCashUnavailable}
                                    className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all text-right flex flex-col justify-between gap-2.5 active:scale-[0.98] ${isPickupCashUnavailable
                                        ? 'opacity-40 grayscale cursor-not-allowed border-white/[0.06] bg-dark-800/40 text-slate-500'
                                        : isSelected
                                            ? method.activeColor + ' shadow-lg shadow-black/40 ring-1 ring-white/10'
                                            : 'border-white/[0.06] bg-dark-800/40 text-slate-400 hover:border-white/15'
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/15' : 'bg-dark-700/50 text-slate-400'
                                            }`}>
                                            <IconComponent size={15} />
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/15 text-white' : 'bg-dark-700 text-slate-500'
                                            }`}>
                                            {method.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-white">{method.label}</h4>
                                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{method.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Fixed Bottom Action Bar for Mobile */}
            <div className="checkout-bottom-bar">
                <div className="max-w-md mx-auto flex gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/review')}
                        className="flex-1 min-h-[52px] sm:h-14 rounded-xl sm:rounded-2xl font-bold border border-white/[0.08] bg-dark-800 text-slate-300 hover:bg-dark-700 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2 text-[15px] sm:text-sm"
                        aria-label="الرجوع لمراجعة السلة"
                    >
                        <ArrowRight size={18} aria-hidden />
                        <span>رجوع للسلة</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!isFormValid()}
                        className="flex-[2] min-h-[52px] sm:h-14 bg-gradient-to-r from-primary to-orange-600 text-white rounded-xl sm:rounded-2xl font-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        aria-label={isFormValid() ? 'المتابعة إلى صفحة الدفع' : 'أكمل الحقول المطلوبة للمتابعة'}
                    >
                        <span className="text-[15px]">تأكيد والمتابعة للدفع</span>
                        <ArrowLeft size={18} className="rtl:rotate-180" aria-hidden />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerPage;
