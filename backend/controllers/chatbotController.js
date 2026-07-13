const SYSTEM_INSTRUCTION = `
You are TripzyBot, the official AI assistant of the Tripzy Ride-Sharing and Parcel-Delivery Platform.
Here are the official Tripzy platform policies and details:
1. Fares & Surge: Standard rates apply off-peak. Peak Hours (8:30-10:00 AM & 6:00-8:30 PM) apply a 1.5x surge. Late Night (10:00 PM - 6:00 AM) starts at 1.3x and goes up to 1.6x.
2. Luggage fees: Small luggage is free (1.0x). Medium luggage is 1.5x (50% extra). Large luggage is 1.8x (80% extra).
3. Wallet: Users can deposit up to ₹10,000 of simulated currency to pay for rides.
4. Cancellations: Cancellations on Tripzy are 100% free!
5. Voice Booking: Allows users to speak routes in English, Hindi, or Gujarati.
6. Safety Shield: Features real-time GPS coordinate sharing, driver name, vehicle plate, phone, and driver license number.
7. Ride Pooling: Share rides to save 30% to 50% on fare.

You must answer any general questions (travel advice, packing tips, coding, math, general knowledge) in addition to Tripzy questions. Keep answers friendly, helpful, and concise (under 3-4 sentences if possible). Always respond in the language the user is chatting in (English, Hindi, or Gujarati).
`;

const chatWithAI = async (req, res) => {
  try {
    const { message, lang } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Chatbot] GEMINI_API_KEY is not configured in .env. Falling back to rule-based responses.');
      return res.json({ 
        reply: getFallbackResponse(message, lang || 'en'),
        simulated: true 
      });
    }

    // Call free Gemini-3.5-Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Chatbot] Gemini API error:', errText);
      return res.json({ 
        reply: getFallbackResponse(message, lang || 'en'),
        simulated: true 
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse(message, lang || 'en');
    res.json({ reply: replyText.trim() });
  } catch (e) {
    console.error('[Chatbot] Exception:', e.message);
    res.json({ reply: getFallbackResponse(req.body.message || '', req.body.lang || 'en'), simulated: true });
  }
};

// Standard multi-lingual keyword responses fallback if no Gemini key is set
const getFallbackResponse = (query, lang) => {
  const q = query.toLowerCase();
  
  const botResponses = {
    en: {
      default: "I'm TripzyBot! 🤖🚗 You can ask me anything about the Tripzy platform (fares, luggage fees, digital wallet, pooling, safety, voice booking, etc.).",
      surge: "🔥 Fares are calculated dynamically. Fares are standard off-peak. During Peak Hours (8:30–10:00 AM & 6:00–8:30 PM), a 1.5x multiplier applies. Late-night rides (10 PM–6 AM) start with a 1.3x multiplier.",
      luggage: "📦 Luggage pricing is automatically added based on bag sizes:\n• Small: 1.0x (Free)\n• Medium: 1.5x (50% extra)\n• Large: 1.8x (80% extra).",
      wallet: "💳 The Tripzy Digital Wallet lets you load simulated funds (up to ₹10,000) and pay instantly for bookings. Click your balance in the navbar to top up!",
      pool: "👥 Ride Pooling matches you with users heading in the same direction, saving you 30% to 50% on fare!",
      voice: "🎙️ Go to the Voice tab, click the microphone, and speak your route (e.g. 'from Gotri to Vrundavan') to book hands-free.",
      safety: "🛡️ Safety is our top priority. During active rides, use the Safety Shield to share driver details and live coordinates with emergency contacts, or press the SOS button to alert the admin.",
      login: "🔑 You can sign in using your official Google Account or via passwordless Mobile OTP verification. Twilio sends a physical SMS code to your phone.",
      cancel: "❌ Cancellations on Tripzy are 100% free! You can cancel a pending or assigned ride at any time from your dashboard without any penalty.",
      driver: "🚕 Drivers enjoy premium benefits, live job queues, and an earnings dashboard. Register as a driver or log in to view job history.",
      admin: "👑 The Admin dashboard monitors total users, completed rides, delivered parcels, total revenue, and allows triggering user reactivation campaigns."
    },
    hi: {
      default: "मैं ट्रिपजीबॉट हूँ! 🤖🚗 आप मुझसे ट्रिपजी प्लेटफॉर्म (किराया, सामान शुल्क, डिजिटल वॉलेट, पूलिंग, सुरक्षा, आवाज बुकिंग आदि) के बारे में कुछ भी पूछ सकते हैं।",
      surge: "🔥 किराए की गणना गतिशील रूप से की जाती है। सामान्य समय में मानक दरें लागू होती हैं। पीक आवर्स (सुबह 8:30–10:00 और शाम 6:00–8:30) के दौरान 1.5 गुना किराया लगता है। देर रात की सवारी (रात 10 बजे से सुबह 6 बजे) 1.3 गुना सर्ज से शुरू होती है।",
      luggage: "📦 सामान के आकार के आधार पर मूल्य निर्धारण स्वचालित रूप से जोड़ा जाता है:\n• छोटा: 1.0x (मुफ्त)\n• मध्यम: 1.5x (50% अतिरिक्त)\n• बड़ा: 1.8x (80% अतिरिक्त)।",
      wallet: "💳 ट्रिपजी डिजिटल वॉलेट आपको सिम्युलेटेड फंड (₹10,000 तक) लोड करने और तुरंत भुगतान करने की अनुमति देता है। टॉप अप करने के लिए नेविगेशन बार में अपने बैलेंस पर क्लिक करें!",
      pool: "👥 राइड पूलिंग आपको एक ही दिशा में जाने वाले उपयोगकर्ताओं से मिलाती है, जिससे आपके किराए में 30% से 50% की बचत होती है!",
      voice: "🎙️ वॉयस टैब पर जाएं, माइक्रोफ़ोन पर क्लिक करें, और हैंड्स-फ्री बुक करने के लिए अपना मार्ग बोलें (जैसे 'गोत्री से वृन्दावन)।",
      safety: "🛡️ सुरक्षा हमारी सर्वोच्च प्राथमिकता है। सक्रिय सवारी के दौरान, आपातकालीन संपर्कों के साथ ड्राइवर विवरण और लाइव स्थान साझा करने के लिए सेफ्टी शील्ड का उपयोग करें, या व्यवस्थापक को सचेत करने के लिए एसओएस बटन दबाएं।",
      login: "🔑 आप अपने आधिकारिक Google खाते का उपयोग करके या मोबाइल ओटीपी सत्यापन के माध्यम से साइन इन कर सकते हैं। ट्विलियो आपके फोन पर एक भौतिक एसएमएस कोड भेजता है।",
      cancel: "❌ ट्रिपजी पर रद्दीकरण 100% मुफ्त है! आप बिना किसी शुल्क के किसी भी समय अपनी सवारी रद्द कर सकते हैं।",
      driver: "🚕 ड्राइवरों को लाइव जॉब कतारें और कमाई का डैशबोर्ड मिलता है। ड्राइवर के रूप में पंजीकरण करें या लॉग इन करें।",
      admin: "👑 व्यवस्थापक डैशबोर्ड उपयोगकर्ताओं, सवारी, पार्सल, कुल राजस्व की निगरानी करता है और एसएमएस अभियान शुरू कर सकता है।"
    },
    gu: {
      default: "હું ટ્રિપઝીબોટ છું! 🤖🚗 તમે મને ટ્રિપઝી પ્લેટફોર્મ (ભાડું, સામાન ફી, ડિજિટલ વૉલેટ, પૂલિંગ, સુરક્ષા, અવાજ બુકિંગ વગેરે) વિશે કંઈપણ પૂછી શકો છો.",
      surge: "🔥 ભાડાની ગણતરી ગતિશીલ રીતે થાય છે. પીક અવર્સ (સવારે 8:30-10:00 અને સાંજે 6:00-8:30) દરમિયાન 1.5 ગણું ભાડું લાગે છે. મોડી રાત્રે (રાત્રે 10 થી સવારે 6) 1.3 ગણો ચાર્જ લાગે છે.",
      luggage: "📦 સામાનના કદના આધારે કિંમત ઉમેરવામાં આવે છે:\n• નાનું: 1.0x (મફત)\n• મધ્યમ: 1.5x (50% વધારાનું)\n• મોટું: 1.8x (80% વધારાનું).",
      wallet: "💳 ટ્રિપઝી ડિજિટલ વૉલેટ તમને ક્રેડિટ લોડ કરવા (₹10,000 સુધી) અને બુકિંગ માટે ત્વરિત ચુકવણી કરવા દે છે. ટોપ અપ કરવા માટે નેવબારમાં તમારા બેલેન્સ પર ક્લિક કરો!",
      pool: "👥 રાઇડ પૂલિંગ તમને એક જ દિશામાં જતા મુસાફરો સાથે જોડે છે, જેથી તમારા ભાડામાં 30% થી 50% સુધીની બચત થાય છે!",
      voice: "🎙️ વોઇસ ટેબ પર જાઓ, માઇક્રોફોન પર ક્લિક કરો અને હેન્ડ્સ-ફ્રી બુક કરવા માટે તમારો માર્ગ બોલો (જેમ કે 'ગોત્રી થી વૃંદાવન').",
      safety: "🛡️ સુરક્ષા અમારી પ્રાથમિકતા છે. ચાલુ સવારી દરમિયાન, ઇમરજન્સી કોન્ટેક્ટ સાથે વિગતો શેર કરવા માટે સેફ્ટી શીલ્ડનો ઉપયોગ કરો અથવા એડમિનને જાણ કરવા એસઓએસ બટન દબાવો.",
      login: "🔑 તમે તમારા ગૂગલ એકાઉન્ટ અથવા મોબાઇલ ઓટીપી દ્વારા સાઇન ઇન કરી શકો છો. ટ્વિલિયો તમારા ફોન પર એસએમએસ કોડ મોકલે છે.",
      cancel: "❌ ટ્રિપઝી પર રાઇડ કેન્સલેશન 100% મફત છે! તમે કોઈ પણ વધારાના ચાર્જ વગર ગમે ત્યારે રાઇડ કેન્સલ કરી શકો છો.",
      driver: "🚕 ડ્રાઇવરોને લાઈવ જોબ કતાર અને કમાણીનું ડેશબોર્ડ મળે છે. ડ્રાઇવર તરીકે રજીસ્ટર કરો અથવા લોગ ઇન કરો.",
      admin: "👑 એડમિન ડેશબોર્ડ વપરાશકર્તાઓ, રાઇડ્સ, પાર્સલ, કુલ આવકની દેખરેખ રાખે છે અને એસએમએસ મોકલી શકે છે."
    }
  };

  const currentRes = botResponses[lang] || botResponses['en'];

  if (q.includes('surge') || q.includes('price') || q.includes('fare') || q.includes('cost') || q.includes('किराया') || q.includes('ભાડું') || q.includes('દર')) {
    return currentRes.surge;
  }
  if (q.includes('luggage') || q.includes('bag') || q.includes('size') || q.includes('unused') || q.includes('सामान') || q.includes('સામાન')) {
    return currentRes.luggage;
  }
  if (q.includes('wallet') || q.includes('pay') || q.includes('balance') || q.includes('card') || q.includes('वॉलेट') || q.includes('વૉલેટ')) {
    return currentRes.wallet;
  }
  if (q.includes('pool') || q.includes('share') || q.includes('co-passenger') || q.includes('पूल') || q.includes('પૂલ')) {
    return currentRes.pool;
  }
  if (q.includes('voice') || q.includes('mic') || q.includes('speak') || q.includes('आवाज') || q.includes('અવાજ')) {
    return currentRes.voice;
  }
  if (q.includes('safety') || q.includes('sos') || q.includes('emergency') || q.includes('police') || q.includes('सुरक्षा') || q.includes('આપત્તિ') || q.includes('સુરક્ષા')) {
    return currentRes.safety;
  }
  if (q.includes('login') || q.includes('google') || q.includes('otp') || q.includes('sms') || q.includes('लॉगिन') || q.includes('લોગિન')) {
    return currentRes.login;
  }
  if (q.includes('cancel') || q.includes('delete') || q.includes('refund') || q.includes('रद्द') || q.includes('કેન્સલ')) {
    return currentRes.cancel;
  }
  if (q.includes('driver') || q.includes('earn') || q.includes('job') || q.includes('ड्राइवर') || q.includes('ડ્રાઇવર')) {
    return currentRes.driver;
  }
  if (q.includes('admin') || q.includes('manage') || q.includes('व्यवस्थापक') || q.includes('એડમિન')) {
    return currentRes.admin;
  }

  return currentRes.default;
};

module.exports = { chatWithAI };
