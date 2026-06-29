import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Nav
    book_ride: "Book Ride",
    parcel_delivery: "Parcel Delivery",
    voice_booking: "Voice Booking",
    ride_pooling: "Ride Pooling",
    my_rides: "My Rides",
    my_parcels: "My Parcels",
    dashboard: "Dashboard",
    logout: "Logout",
    login: "Login",
    register: "Register",
    admin: "Admin",
    deliveries: "Deliveries",
    job_history: "Job History",
    
    // Fares / Info
    pickup: "Pickup Location",
    drop: "Drop Location",
    est_fare: "Estimated Fare",
    distance: "Distance",
    duration: "Duration",
    
    // Voice Page
    voice_title: "Voice-Based Booking",
    voice_desc: 'Use your voice to book a ride. Speak your route (e.g., "from Gotri to Vrundavan Circle") and confirm the locations.',
    voice_start: "Start Recording",
    voice_stop: "Stop Recording",
    voice_parse: "Parse Voice Input",
    voice_placeholder: "Speak or type: 'from Gotri to Vrundavan Circle'",
    voice_verify: "Verify & Edit Locations",
    voice_book_now: "Book Ride Now",
    
    // Chatbot
    bot_welcome: "Hi there! I am your Tripzy Assistant 🤖. How can I help you today?",
    bot_faq_surge: "Tell me about surge pricing",
    bot_faq_luggage: "What are the luggage pricing rules?",
    bot_faq_eco: "What is eco savings?",
    bot_faq_wallet: "How does the digital wallet work?",
    bot_ask_placeholder: "Ask a question..."
  },
  hi: {
    // Nav
    book_ride: "सवारी बुक करें",
    parcel_delivery: "पार्सल डिलीवरी",
    voice_booking: "आवाज बुकिंग",
    ride_pooling: "सवारी शेयरिंग",
    my_rides: "मेरी सवारियां",
    my_parcels: "मेरे पार्सल",
    dashboard: "डैशबोर्ड",
    logout: "लॉगआउट",
    login: "लॉगिन",
    register: "पंजीकरण",
    admin: "एडमिन",
    deliveries: "डिलीवरी",
    job_history: "नौकरी इतिहास",
    
    // Fares
    pickup: "पिकअप स्थान",
    drop: "ड्रॉप स्थान",
    est_fare: "अनुमानित किराया",
    distance: "दूरी",
    duration: "समय",
    
    // Voice Page
    voice_title: "आवाज-आधारित बुकिंग",
    voice_desc: 'सवारी बुक करने के लिए अपनी आवाज का उपयोग करें। अपना मार्ग बोलें (जैसे, "गोत्री से वृन्दावन सर्कल") और स्थानों की पुष्टि करें।',
    voice_start: "रिकॉर्डिंग शुरू करें",
    voice_stop: "रिकॉर्डिंग रोकें",
    voice_parse: "आवाज इनपुट पार्स करें",
    voice_placeholder: "बोलें या लिखें: 'गोत्री से वृन्दावन सर्कल'",
    voice_verify: "स्थान सत्यापित और संपादित करें",
    voice_book_now: "अब सवारी बुक करें",
    
    // Chatbot
    bot_welcome: "नमस्ते! मैं आपका ट्रिपजी सहायक हूँ 🤖। आज मैं आपकी क्या मदद कर सकता हूँ?",
    bot_faq_surge: "मुझे सर्ज प्राइसिंग के बारे में बताएं",
    bot_faq_luggage: "सामान मूल्य निर्धारण के नियम क्या हैं?",
    bot_faq_eco: "पर्यावरण बचत क्या है?",
    bot_faq_wallet: "डिजिटल वॉलेट कैसे काम करता है?",
    bot_ask_placeholder: "कोई प्रश्न पूछें..."
  },
  gu: {
    // Nav
    book_ride: "સવારી બુક કરો",
    parcel_delivery: "પાર્સલ ડિલિવરી",
    voice_booking: "અવાજ બુકિંગ",
    ride_pooling: "રાઇડ પૂલિંગ",
    my_rides: "મારી સવારીઓ",
    my_parcels: "મારા પાર્સલ",
    dashboard: "ડેશબોર્ડ",
    logout: "લોગઆઉટ",
    login: "લોગિન",
    register: "રજીસ્ટર",
    admin: "એડમિન",
    deliveries: "ડિલિવરી",
    job_history: "કામ નો ઇતિહાસ",
    
    // Fares
    pickup: "પીકઅપ સ્થાન",
    drop: "ડ્રોપ સ્થાન",
    est_fare: "અંદાજિત ભાડું",
    distance: "અંતર",
    duration: "સમય",
    
    // Voice Page
    voice_title: "અવાજ-આધારિત બુકિંગ",
    voice_desc: 'સવારી બુક કરવા માટે તમારા અવાજનો ઉપયોગ કરો. તમારો માર્ગ બોલો (જેમ કે, "ગોત્રી થી વૃંદાવન સર્કલ") અને સ્થાનોની પુષ્ટિ કરો.',
    voice_start: "રેકોર્ડિંગ શરૂ કરો",
    voice_stop: "રેકોર્ડિંગ બંધ કરો",
    voice_parse: "અવાજ ઇનપુટ વિશ્લેષણ કરો",
    voice_placeholder: "બોલો અથવા લખો: 'ગોત્રી થી વૃંદાવન સર્કલ'",
    voice_verify: "સ્થાન ચકાસો અને સંપાદિત કરો",
    voice_book_now: "હમણાં રાઇડ બુક કરો",
    
    // Chatbot
    bot_welcome: "નમસ્તે! હું તમારો ટ્રિપઝી સહાયક છું 🤖. આજે હું તમારી શું મદદ કરી શકું?",
    bot_faq_surge: "મને સર્જ પ્રાઇસીંગ વિશે જણાવો",
    bot_faq_luggage: "સામાનની કિંમતના નિયમો શું છે?",
    bot_faq_eco: "ઇકો બચત શું છે?",
    bot_faq_wallet: "ડિજિટલ વૉલેટ કેવી રીતે કામ કરે છે?",
    bot_ask_placeholder: "કોઈ પ્રશ્ન પૂછો..."
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('tripzy_lang') || 'en');

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('tripzy_lang', newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
