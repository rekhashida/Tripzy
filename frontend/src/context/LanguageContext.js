import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    book_ride: "Book a Ride",
    parcel_delivery: "Parcel Delivery",
    ride_pooling: "Ride Pooling",
    voice_booking: "Voice Booking",
    my_rides: "My Rides",
    my_parcels: "My Parcels",
    dashboard: "Dashboard",
    job_history: "Job History",
    deliveries: "Deliveries",
    wallet: "Wallet",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout"
  },
  hi: {
    book_ride: "राइड बुक करें",
    parcel_delivery: "पार्सल डिलीवरी",
    ride_pooling: "राइड पूल",
    voice_booking: "वॉइस बुकिंग",
    my_rides: "मेरी राइड्स",
    my_parcels: "मेरे पार्सल",
    dashboard: "डैशबोर्ड",
    job_history: "कार्य इतिहास",
    deliveries: "डिलीवरी",
    wallet: "वॉलेट",
    login: "लॉग इन",
    signup: "साइन अप",
    logout: "लॉग आउट"
  },
  gu: {
    book_ride: "રાઇડ બુક કરો",
    parcel_delivery: "પાર્સલ ડિલિવરી",
    ride_pooling: "રાઇડ પૂલિંગ",
    voice_booking: "વોઇસ બુકિંગ",
    my_rides: "મારી રાઇડ્સ",
    my_parcels: "મારા પાર્સલ",
    dashboard: "ડેશબોર્ડ",
    job_history: "કાર્ય ઇતિહાસ",
    deliveries: "ડિલિવરી",
    wallet: "વોલેટ",
    login: "લોગિન",
    signup: "સાઇન અપ",
    logout: "લોગ આઉટ"
  },
  mr: {
    book_ride: "राईड बुक करा",
    parcel_delivery: "पार्सल डिलिव्हरी",
    ride_pooling: "राईड पुलिंग",
    voice_booking: "वॉईस बुकिंग",
    my_rides: "माझ्या राईड्स",
    my_parcels: "माझे पार्सल",
    dashboard: "डॅशबोर्ड",
    job_history: "काम इतिहास",
    deliveries: "डिलिव्हरी",
    wallet: "वॉलेट",
    login: "लॉग इन",
    signup: "साइन अप",
    logout: "लॉग आउट"
  },
  ta: {
    book_ride: "சவாரி புக்",
    parcel_delivery: "பார்சல் டெலிவரி",
    ride_pooling: "ரைடு பூலிங்",
    voice_booking: "வாய்ஸ் புக்கிங்",
    my_rides: "எனது சவாரிகள்",
    my_parcels: "எனது பார்சல்கள்",
    dashboard: "டாஷ்போர்டு",
    job_history: "வேலை வரலாறு",
    deliveries: "டெலிவரிகள்",
    wallet: "வாலட்",
    login: "உள்நுழைக",
    signup: "பதிவு செய்க",
    logout: "வெளியேறு"
  },
  te: {
    book_ride: "రైడ్ బుక్ చేయండి",
    parcel_delivery: "పార్శిల్ డెలివరీ",
    ride_pooling: "రైడ్ పూలింగ్",
    voice_booking: "వాయిస్ బుకింగ్",
    my_rides: "నా రైడ్‌లు",
    my_parcels: "నా పార్శిల్‌లు",
    dashboard: "డాష్‌బోర్డ్",
    job_history: "పని చరిత్ర",
    deliveries: "డెలివరీలు",
    wallet: "వాలెట్",
    login: "లాగిన్",
    signup: "సైన్ అప్",
    logout: "లాగ్ అవుట్"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: Object.keys(translations) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
