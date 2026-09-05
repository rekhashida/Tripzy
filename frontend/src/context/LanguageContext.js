import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
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
    logout: "Logout",
    welcome: "Welcome",
    profile: "Profile",

    // Home Page
    hero_title: "Smart Mobility & Multimodal Logistics Platform",
    hero_subtitle: "Negotiate custom ride fares, optimize multi-stop parcel delivery, and save up to 65% with AI multimodal route planning.",
    get_started: "Get Started Now",
    explore_services: "Explore Services",
    smart_bidding_title: "Smart Price Bidding",
    smart_bidding_desc: "Propose your own fare offer and receive instant counter-bids from nearby drivers in real-time.",
    multimodal_title: "AI Multimodal Planner",
    multimodal_desc: "Combine Auto-Rickshaws, Metro transit, and E-Bikes for maximum travel cost savings.",
    parcel_tsp_title: "Multi-Stop Parcel TSP",
    parcel_tsp_desc: "Greedy route optimization for multi-package drop-offs with dual OTP handover security.",
    sos_safety_title: "SOS Audio Emergency",
    sos_safety_desc: "Instant 10-second Web Audio microphone stream broadcasted to emergency contacts and police.",

    // Ride Booking & Bidding
    pickup_location: "Pickup Location",
    dropoff_location: "Dropoff Location",
    enter_pickup: "Enter pickup address or click map",
    enter_dropoff: "Enter dropoff destination",
    select_vehicle: "Select Vehicle Type",
    est_base_fare: "Estimated Base Fare",
    your_bid_offer: "Your Fare Bid Offer (₹)",
    submit_bid: "Broadcast Fare Bid Offer",
    counter_offer_received: "Driver Counter-Offer Received!",
    accept_counter: "Accept Counter Bid",
    decline: "Decline",
    match_confirmed: "Ride Match Confirmed! OTP:",
    
    // Multimodal Planner
    multimodal_planner_title: "AI Multimodal Intermodal Route Search",
    direct_cab_option: "Option A: Direct Cab / Taxi",
    multimodal_recommended: "Option B: Tripzy Multimodal Combination (Recommended)",
    save_savings: "Save Up To 79%",
    book_multimodal: "Book Multimodal Trip",

    // Parcel Delivery
    sender_location: "Pickup / Sender Warehouse Address",
    add_drop_stop: "Add Parcel Drop Location",
    package_details: "Package Weight & Category",
    run_tsp_optimizer: "Run TSP Route Optimizer",
    optimized_sequence: "Optimized Route Sequence",
    confirm_parcel_dispatch: "Confirm Optimized Parcel Dispatch",

    // Auth & General
    email_or_phone: "Email or Mobile Number",
    password: "Password",
    full_name: "Full Name",
    role: "User Role",
    rider_role: "Rider / Passenger",
    driver_role: "Driver Captain",
    submit: "Submit",
    cancel: "Cancel"
  },

  hi: {
    // Navigation
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
    logout: "लॉग आउट",
    welcome: "स्वागत है",
    profile: "प्रोफ़ाइल",

    // Home Page
    hero_title: "स्मार्ट मोबिलिटी और मल्टीमॉडल लॉजिस्टिक्स प्लेटफॉर्म",
    hero_subtitle: "किराया मोलभाव करें, मल्टी-स्टॉप पार्सल डिलीवरी को अनुकूलित करें और 65% तक की बचत करें।",
    get_started: "अभी शुरू करें",
    explore_services: "सेवाएं देखें",
    smart_bidding_title: "स्मार्ट फेयर बिडिंग",
    smart_bidding_desc: "अपना किराया प्रस्तावित करें और ड्राइवरों से रीयल-टाइम काउंटर ऑफर प्राप्त करें।",
    multimodal_title: "एआई मल्टीमॉडल प्लानर",
    multimodal_desc: "ऑटो, मेट्रो और ई-बाइक को मिलाकर अपनी यात्रा लागत कम करें।",
    parcel_tsp_title: "मल्टी-स्टॉप पार्सल टीएसपी",
    parcel_tsp_desc: "दोहरे ओटीपी सुरक्षा के साथ मल्टी-पैकेज डिलीवरी रूट अनुकूलन।",
    sos_safety_title: "एसओएस ऑडियो आपातकालीन",
    sos_safety_desc: "आपातकालीन संपर्कों को 10-सेकंड का लाइव ऑडियो रिकॉर्डिंग स्ट्रीम भेजें।",

    // Ride Booking & Bidding
    pickup_location: "पिकअप स्थान",
    dropoff_location: "ड्रॉपऑफ स्थान",
    enter_pickup: "पिकअप पता दर्ज करें",
    enter_dropoff: "गंतव्य दर्ज करें",
    select_vehicle: "वाहन प्रकार चुनें",
    est_base_fare: "अनुमानित आधार किराया",
    your_bid_offer: "आपकी किराया बोली (₹)",
    submit_bid: "बोली ऑफ़र प्रसारित करें",
    counter_offer_received: "ड्राइवर काउंटर-ऑफ़र प्राप्त हुआ!",
    accept_counter: "काउंटर बोली स्वीकार करें",
    decline: "अस्वीकार करें",
    match_confirmed: "राइड मैच की पुष्टि हो गई! ओटीपी:",
    
    // Multimodal Planner
    multimodal_planner_title: "एआई मल्टीमॉडल इंटरमॉडल रूट खोज",
    direct_cab_option: "विकल्प A: सीधी कैब / टैक्सी",
    multimodal_recommended: "विकल्प B: ट्रिपज़ी मल्टीमॉडल संयोजन (अनुशंसित)",
    save_savings: "79% तक बचाएं",
    book_multimodal: "मल्टीमॉडल यात्रा बुक करें",

    // Parcel Delivery
    sender_location: "पिकअप / प्रेषक गोदाम पता",
    add_drop_stop: "पार्सल ड्रॉप स्थान जोड़ें",
    package_details: "पैकेज वजन और श्रेणी",
    run_tsp_optimizer: "टीएसपी रूट ऑप्टिमाइज़र चलाएं",
    optimized_sequence: "अनुकूलित मार्ग अनुक्रम",
    confirm_parcel_dispatch: "अनुकूलित पार्सल प्रेषण की पुष्टि करें",

    // Auth & General
    email_or_phone: "ईमेल या मोबाइल नंबर",
    password: "पासवर्ड",
    full_name: "पूरा नाम",
    role: "उपयोगकर्ता भूमिका",
    rider_role: "राइडर / यात्री",
    driver_role: "ड्राइवर कैप्टन",
    submit: "सबमिट करें",
    cancel: "रद्द करें"
  },

  gu: {
    // Navigation
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
    logout: "લોગ આઉટ",
    welcome: "સ્વાગત છે",
    profile: "પ્રોફાઇલ",

    // Home Page
    hero_title: "સ્માર્ટ મોબિલિટી અને મલ્ટીમોડલ લોજિસ્ટિક્સ પ્લેટફોર્મ",
    hero_subtitle: "કસ્ટમ ભાડાની દરખાસ્ત કરો, મલ્ટિ-સ્ટોપ ડિલિવરી ઑપ્ટિમાઇઝ કરો અને 65% સુધી બચત કરો.",
    get_started: "હમણાં શરૂ કરો",
    explore_services: "સેવાઓ જુઓ",
    smart_bidding_title: "સ્માર્ટ પ્રાઇસ બિડિંગ",
    smart_bidding_desc: "તમારું ભાડું ઓફર કરો અને ડ્રાઇવરો પાસેથી રિયલ-ટાઇમ કાઉન્ટર ઑફર્સ મેળવો.",
    multimodal_title: "એઆઇ મલ્ટીમોડલ પ્લાનર",
    multimodal_desc: "ઓટો, મેટ્રો અને ઇ-બાઇકને જોડીને તમારો મુસાફરી ખર્ચ ઘટાડો.",
    parcel_tsp_title: "મલ્ટી-સ્ટોપ પાર્સલ ટીએસપી",
    parcel_tsp_desc: "ડ્યુઅલ ઓટીપી સુરક્ષા સાથે મલ્ટિ-પેકેજ ડિલિવરી રૂટ ઓપ્ટિમાઇઝેશન.",
    sos_safety_title: "એસઓએસ ઓડિયો ઇમરજન્સી",
    sos_safety_desc: "ઇમરજન્સી કોન્ટેક્ટ્સને 10-સેકન્ડનો લાઇવ ઓડિયો સ્ટ્રીમ મોકલો.",

    // Ride Booking & Bidding
    pickup_location: "પીકઅપ સ્થળ",
    dropoff_location: "ડ્રોપઓફ સ્થળ",
    enter_pickup: "પીકઅપ સરનામું દાખલ કરો",
    enter_dropoff: "મંજિલ દાખલ કરો",
    select_vehicle: "વાહન પ્રકાર પસંદ કરો",
    est_base_fare: "અંદાજિત મૂળ ભાડું",
    your_bid_offer: "તમારી ભાડાની બોલી (₹)",
    submit_bid: "બોલી ઑફર સબમિટ કરો",
    counter_offer_received: "ડ્રાઇવર કાઉન્ટર-ઑફર મળી!",
    accept_counter: "કાઉન્ટર બોલી સ્વીકારો",
    decline: "અસ્વીકાર કરો",
    match_confirmed: "રાઇડ મેચ કન્ફર્મ થઈ! ઓટીપી:",

    // Multimodal Planner
    multimodal_planner_title: "એઆઇ મલ્ટીમોડલ રૂટ સર્ચ",
    direct_cab_option: "વિકલ્પ A: ડાયરેક્ટ કેબ / ટેક્સી",
    multimodal_recommended: "વિકલ્પ B: ટ્રિપઝી મલ્ટીમોડલ કોમ્બિનેશન (ભલામણ કરેલ)",
    save_savings: "79% સુધી બચાવો",
    book_multimodal: "મલ્ટીમોડલ ટ્રિપ બુક કરો",

    // Parcel Delivery
    sender_location: "પીકઅપ / મોકલનાર ગોડાઉન સરનામું",
    add_drop_stop: "પાર્સલ ડ્રોપ સ્થળ ઉમેરો",
    package_details: "પેકેજ વજન અને કેટેગરી",
    run_tsp_optimizer: "ટીએસપી રૂટ ઓપ્ટિમાઇઝર ચલાવો",
    optimized_sequence: "ઓપ્ટિમાઇઝ રૂટ ક્રમ",
    confirm_parcel_dispatch: "ઓપ્ટિમાઇઝ પાર્સલ રવાના કન્ફર્મ કરો",

    // Auth & General
    email_or_phone: "ઇમેઇલ અથવા મોબાઇલ નંબર",
    password: "પાસવર્ડ",
    full_name: "પૂરું નામ",
    role: "વપરાશકર્તા ભૂમિકા",
    rider_role: "રાઇડર / મુસાફર",
    driver_role: "ડ્રાઇવર કેપ્ટન",
    submit: "સબમિટ કરો",
    cancel: "રદ કરો"
  },

  mr: {
    // Navigation
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
    logout: "लॉग आउट",
    welcome: "स्वागत आहे",
    profile: "प्रोफाइल",

    // Home Page
    hero_title: "स्मार्ट मोबिलिटी आणि मल्टीमॉडल लॉजिस्टिक्स प्लॅटफॉर्म",
    hero_subtitle: "भाडे वाटाघाटी करा, मल्टी-स्टॉप पार्सल डिलिव्हरी सुलभ करा आणि ६५% पर्यंत बचत करा.",
    get_started: "आत्ताच सुरू करा",
    explore_services: "सेवा पहा",
    smart_bidding_title: "स्मार्ट प्राइस बिडिंग",
    smart_bidding_desc: "तुमची भाडे ऑफर द्या आणि ड्रायव्हर्सकडून रीअल-टाइम काउंटर ऑफर्स मिळवा.",
    multimodal_title: "एआय मल्टीमॉडल प्लॅनर",
    multimodal_desc: "ऑटो, मेट्रो आणि ई-बाइक जोडून प्रवास खर्च कमी करा.",
    parcel_tsp_title: "मल्टी-स्टॉप पार्सल टीएसपी",
    parcel_tsp_desc: "ड्युअल ओटीपी सुरक्षेसह मल्टी-पॅकेज डिलिव्हरी मार्ग ऑप्टिमायझेशन.",
    sos_safety_title: "एसओएस ऑडिओ आपत्कालीन",
    sos_safety_desc: "आपत्कालीन संपर्कांना १०-सेकंदाचा लाइव्ह ऑडिओ प्रवाह पाठवा.",

    // Ride Booking & Bidding
    pickup_location: "पिकअप स्थान",
    dropoff_location: "ड्रॉपऑफ स्थान",
    enter_pickup: "पिकअप पत्ता प्रविष्ट करा",
    enter_dropoff: "गंतव्य प्रविष्ट करा",
    select_vehicle: "वाहन प्रकार निवडा",
    est_base_fare: "अंदाजित मूळ भाडे",
    your_bid_offer: "तुमची भाडे बोली (₹)",
    submit_bid: "बोली ऑफर सबमिट करा",
    counter_offer_received: "ड्रायव्हर काउंटर-ऑफर प्राप्त झाली!",
    accept_counter: "काउंटर बोली स्वीकारा",
    decline: "नकार द्या",
    match_confirmed: "राईड मॅच कन्फर्म झाली! ओटीपी:",

    // Multimodal Planner
    multimodal_planner_title: "एआय मल्टीमॉडल रूट शोध",
    direct_cab_option: "पर्याय A: थेट कॅब / टॅक्सी",
    multimodal_recommended: "पर्याय B: ट्रिपझी मल्टीमॉडल संयोजन (शिफारस केलेले)",
    save_savings: "७९% पर्यंत वाचवा",
    book_multimodal: "मल्टीमॉडल ट्रिप बुक करा",

    // Parcel Delivery
    sender_location: "पिकअप / प्रेषक गोदाम पत्ता",
    add_drop_stop: "पार्सल ड्रॉप स्थान जोडा",
    package_details: "पॅकेज वजन आणि श्रेणी",
    run_tsp_optimizer: "टीएसपी रूट ऑप्टिमायझर चालवा",
    optimized_sequence: "ऑप्टिमाइझ केलेला मार्ग क्रम",
    confirm_parcel_dispatch: "पार्सल पाठवण्याची पुष्टी करा",

    // Auth & General
    email_or_phone: "ईमेल किंवा मोबाईल नंबर",
    password: "पासवर्ड",
    full_name: "पूर्ण नाव",
    role: "वापरकर्ता भूमिका",
    rider_role: "रायडर / प्रवासी",
    driver_role: "ड्रायव्हर कॅप्टन",
    submit: "सबमिट करा",
    cancel: "रद्द करा"
  },

  ta: {
    // Navigation
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
    logout: "வெளியேறு",
    welcome: "வரவேற்கிறோம்",
    profile: "சுயவிவரம்",

    // Home Page
    hero_title: "ஸ்மார்ட் மொபிலிட்டி & மல்டிமாடல் லாஜிஸ்டிக்ஸ் தள",
    hero_subtitle: "சவாரி கட்டணத்தை பேரம் பேசுங்கள், பார்சல் விநியோகத்தை மேம்படுத்துங்கள், 65% சேமிக்கவும்.",
    get_started: "இப்போது தொடங்குங்கள்",
    explore_services: "சேவைகளைப் பார்க்கவும்",
    smart_bidding_title: "ஸ்மார்ட் விலை பிட்டிங்",
    smart_bidding_desc: "உங்கள் சொந்த கட்டணத்தை பரிந்துரைத்து, ஓட்டுநர்களிடமிருந்து சலுகைகளைப் பெறுங்கள்.",
    multimodal_title: "ஏஐ மல்டிமாடல் பிளானர்",
    multimodal_desc: "ஆட்டோ, மெட்ரோ மற்றும் மின்-பைக் இணைத்து பயணச் செலவைக் குறைக்கவும்.",
    parcel_tsp_title: "மல்டி-ஸ்டாப் பார்சல் டிஎஸ்பி",
    parcel_tsp_desc: "இரட்டை ஓடிபி பாதுகாப்புடன் பல பார்சல் விநியோக பாதை உகப்பாக்கம்.",
    sos_safety_title: "எஸ்ஓஎஸ் ஆடியோ அவசரநிலை",
    sos_safety_desc: "அவசர தொடர்புகளுக்கு 10 வினாடி நேரடி ஆடியோ பதிவை அனுப்பவும்.",

    // Ride Booking & Bidding
    pickup_location: "பிக்கப் இடம்",
    dropoff_location: "டிராப் இடம்",
    enter_pickup: "பிக்கப் முகவரியை உள்ளிடவும்",
    enter_dropoff: "சேருமிடத்தை உள்ளிடவும்",
    select_vehicle: "வாகன வகையைத் தேர்ந்தெடுக்கவும்",
    est_base_fare: "மதிப்பிடப்பட்ட அடிப்படை கட்டணம்",
    your_bid_offer: "உங்கள் கட்டண ஏலம் (₹)",
    submit_bid: "ஏல சலுகையை அனுப்பவும்",
    counter_offer_received: "ஓட்டுநர் எதிர் சலுகை வந்தது!",
    accept_counter: "எதிர் ஏலத்தை ஏற்கவும்",
    decline: "நிராகரி",
    match_confirmed: "சவாரி உறுதி செய்யப்பட்டது! OTP:",

    // Multimodal Planner
    multimodal_planner_title: "ஏஐ மல்டிமாடல் பாதை தேடல்",
    direct_cab_option: "விருப்பம் A: நேரடி டாக்சி",
    multimodal_recommended: "விருப்பம் B: ட்ரிப்ஸி மல்டிமாடல் இணைப்பு (பரிந்துரைக்கப்பட்டது)",
    save_savings: "79% வரை சேமிக்கவும்",
    book_multimodal: "பயணத்தை புக் செய்யவும்",

    // Parcel Delivery
    sender_location: "பிக்கப் முகவரி",
    add_drop_stop: "பார்சல் டிராப் இடத்தை சேர்க்கவும்",
    package_details: "பார்சல் எடை விவரங்கள்",
    run_tsp_optimizer: "டிஎஸ்பி பாதையை இயக்கு",
    optimized_sequence: "உகந்த பாதை வரிசை",
    confirm_parcel_dispatch: "பார்சல் அனுப்பலை உறுதிசெய்",

    // Auth & General
    email_or_phone: "மின்னஞ்சல் அல்லது தொலைபேசி எண்",
    password: "கடவுச்சொல்",
    full_name: "முழு பெயர்",
    role: "பயனர் பங்கு",
    rider_role: "பயணி",
    driver_role: "ஓட்டுநர்",
    submit: "சமர்ப்பி",
    cancel: "ரத்து செய்"
  },

  te: {
    // Navigation
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
    logout: "లాగ్ అవుట్",
    welcome: "స్వాగతం",
    profile: "ప్రొఫైల్",

    // Home Page
    hero_title: "స్మార్ట్ మొబిలిటీ & మల్టీమోడల్ లాజిస్టిక్స్ ప్లాట్‌ఫారమ్",
    hero_subtitle: "రైడ్ ధరను బేరం ఆడండి, పార్శిల్ డెలివరీని ఆప్టిమైజ్ చేయండి మరియు 65% వరకు ఆదా చేయండి.",
    get_started: "ఇప్పుడే ప్రారంభించండి",
    explore_services: "సేవలను చూడండి",
    smart_bidding_title: "స్మార్ట్ ధర బిడ్డింగ్",
    smart_bidding_desc: "మీ స్వంత రవాణా ధరను ప్రతిపాదించండి మరియు డ్రైవర్ల నుండి ప్రత్యక్ష ఆఫర్‌లను పొందండి.",
    multimodal_title: "ఏఐ మల్టీమోడల్ ప్లానర్",
    multimodal_desc: "ఆటో, మెట్రో మరియు ఇ-బైక్‌ను కలపడం ద్వారా ప్రయాణ ఖర్చును తగ్గించండి.",
    parcel_tsp_title: "మల్టీ-స్టాప్ పార్శిల్ టీఎస్‌పీ",
    parcel_tsp_desc: "ద్వంద్వ ఓటీపీ భద్రతతో బహుళ పార్శిల్ డెలివరీ రూట్ ఆప్టిమైజేషన్.",
    sos_safety_title: "ఎస్ఓఎస్ ఆడియో ఎమర్జెన్సీ",
    sos_safety_desc: "అత్యవసర పరిచయాలకు 10-సెకన్ల లైవ్ ఆడియో రికార్డింగ్‌ను పంపండి.",

    // Ride Booking & Bidding
    pickup_location: "పికప్ స్థానం",
    dropoff_location: "డ్రాప్ స్థానం",
    enter_pickup: "పికప్ చిరునామాను నమోదు చేయండి",
    enter_dropoff: "గమ్యస్థానాన్ని నమోదు చేయండి",
    select_vehicle: "వాహనం రకాన్ని ఎంచుకోండి",
    est_base_fare: "అంచనా వేసిన మూల ధర",
    your_bid_offer: "మీ ధర బిడ్ (₹)",
    submit_bid: "బిడ్ ఆఫర్‌ను పంపండి",
    counter_offer_received: "డ్రైవర్ కౌంటర్-ఆఫర్ వచ్చింది!",
    accept_counter: "కౌంటర్ బిడ్‌ను అంగీకరించండి",
    decline: "తిరస్కరించండి",
    match_confirmed: "రైడ్ మ్యాచ్ ఖరారైంది! ఓటీపీ:",

    // Multimodal Planner
    multimodal_planner_title: "ఏఐ మల్టీమోడల్ రూట్ సెర్చ్",
    direct_cab_option: "ఎంపిక A: నేరుగా క్యాబ్ / టాక్సీ",
    multimodal_recommended: "ఎంపిక B: ట్రిప్జీ మల్టీమోడల్ కలయిక (సిఫార్సు చేయబడింది)",
    save_savings: "79% వరకు ఆదా చేయండి",
    book_multimodal: "మల్టీమోడల్ ట్రిప్ బుక్ చేయండి",

    // Parcel Delivery
    sender_location: "పికప్ / పంపినవారి గిడ్డంగి చిరునామా",
    add_drop_stop: "పార్శిల్ డ్రాప్ స్థానాన్ని జోడించండి",
    package_details: "పార్శిల్ బరువు వివరాలు",
    run_tsp_optimizer: "టీఎస్‌పీ రూట్ ఆప్టిమైజర్‌ను రన్ చేయండి",
    optimized_sequence: "ఆప్టిమైజ్ చేసిన రూట్ సీక్వెన్స్",
    confirm_parcel_dispatch: "పార్శిల్ డిస్పాచ్‌ను ఖరారు చేయండి",

    // Auth & General
    email_or_phone: "ఈమెయిల్ లేదా మొబైల్ సంఖ్య",
    password: "పాస్‌వర్డ్",
    full_name: "పూర్తి పేరు",
    role: "వినియోగదారు పాత్ర",
    rider_role: "ప్రయాణీకుడు",
    driver_role: "డ్రైవర్",
    submit: "సమర్పించండి",
    cancel: "రద్దు చేయండి"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('tripzy_lang') || 'en';
  });

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      localStorage.setItem('tripzy_lang', newLang);
    }
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLang: changeLanguage, 
      changeLanguage, 
      t, 
      languages: Object.keys(translations) 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
