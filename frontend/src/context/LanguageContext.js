import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    bookRide: "Book a Ride",
    sendParcel: "Send Parcel",
    myRides: "My Rides",
    myParcels: "My Parcels",
    driverDashboard: "Driver Dashboard",
    adminDashboard: "Admin Dashboard",
    wallet: "Wallet",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    pickup: "Pickup Location",
    drop: "Dropoff Location",
    estimateFare: "Estimate Fare",
    bookNow: "Book Now",
    language: "Language"
  },
  hi: {
    bookRide: "राइड बुक करें",
    sendParcel: "पार्सल भेजें",
    myRides: "मेरी राइड्स",
    myParcels: "मेरे पार्सल",
    driverDashboard: "ड्राइवर डैशबोर्ड",
    adminDashboard: "एडमिन डैशबोर्ड",
    wallet: "वॉलेट",
    login: "लॉग इन",
    signup: "साइन अप",
    logout: "लॉग आउट",
    pickup: "पिकअप स्थान",
    drop: "ड्रॉप स्थान",
    estimateFare: "किराया अनुमानित करें",
    bookNow: "अभी बुक करें",
    language: "भाषा"
  },
  gu: {
    bookRide: "રાઇડ બુક કરો",
    sendParcel: "પાર્સલ મોકલો",
    myRides: "મારી રાઇડ્સ",
    myParcels: "મારા પાર્સલ",
    driverDashboard: "ડ્રાઇવર ડેશબોર્ડ",
    adminDashboard: "એડમિન ડેશબોર્ડ",
    wallet: "વોલેટ",
    login: "લોગિન",
    signup: "સાઇન અપ",
    logout: "લોગ આઉટ",
    pickup: "પિકઅપ સ્થાનાંતર",
    drop: "ડ્રોપ સ્થાન",
    estimateFare: "ભાડું અંદાજિત કરો",
    bookNow: "હવે બુક કરો",
    language: "ભાષા"
  },
  mr: {
    bookRide: "राईड बुक करा",
    sendParcel: "पार्सल पाठवा",
    myRides: "माझ्या राईड्स",
    myParcels: "माझे पार्सल",
    driverDashboard: "ड्रायव्हर डॅशबोर्ड",
    adminDashboard: "ॲडमिन डॅशबोर्ड",
    wallet: "वॉलेट",
    login: "लॉग इन",
    signup: "साइन अप",
    logout: "लॉग आउट",
    pickup: "पिकअप ठिकाण",
    drop: "ड्रॉप ठिकाण",
    estimateFare: "भाडे अंदाज लावा",
    bookNow: "आत्ताच बुक करा",
    language: "भाषा"
  },
  ta: {
    bookRide: "சவாரி புக் செய்ய",
    sendParcel: "பார்சல் அனுப்ப",
    myRides: "எனது சவாரிகள்",
    myParcels: "எனது பார்சல்கள்",
    driverDashboard: "டிரைவர் டாஷ்போர்டு",
    adminDashboard: "நிர்வாகி டாஷ்போர்டு",
    wallet: "வாலட்",
    login: "உள்நுழைக",
    signup: "பதிவு செய்க",
    logout: "வெளியேறு",
    pickup: "பிக்கப் இடம்",
    drop: "டிராப் இடம்",
    estimateFare: "கட்டணம் கணக்கிட",
    bookNow: "இப்போதே புக் செய்க",
    language: "மொழி"
  },
  te: {
    bookRide: "రైడ్ బుక్ చేయండి",
    sendParcel: "పార్శిల్ పంపండి",
    myRides: "నా రైడ్‌లు",
    myParcels: "నా పార్శిల్‌లు",
    driverDashboard: "డ్రైవర్ డాష్‌బోర్డ్",
    adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్",
    wallet: "వాలెట్",
    login: "లాగిన్",
    signup: "సైన్ అప్",
    logout: "లాగ్ అవుట్",
    pickup: "పికప్ ప్రదేశం",
    drop: "డ్రాప్ ప్రదేశం",
    estimateFare: "ఛార్జీని అంచనా వేయండి",
    bookNow: "ఇప్పుడే బుక్ చేయండి",
    language: "భాష"
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
