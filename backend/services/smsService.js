/**
 * Tripzy SMS Gateway Service
 * Supports Twilio and Fast2SMS APIs
 */

async function sendSMS(to, body, otp) {
  const {
    TWILIO_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE,
    FAST2SMS_API_KEY
  } = process.env;

  // 1. Try Twilio Gateway
  if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    try {
      console.log(`[SMS Service] Dispatching via Twilio to ${to}...`);
      const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', TWILIO_PHONE);
      params.append('Body', body);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params
        }
      );

      if (response.ok) {
        console.log(`[SMS Service] Twilio SMS sent successfully.`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[SMS Service] Twilio failed:`, errText);
      }
    } catch (err) {
      console.error(`[SMS Service] Twilio exception:`, err.message);
    }
  }

  // 2. Try Fast2SMS Gateway (popular in India, no country code required)
  if (FAST2SMS_API_KEY) {
    try {
      // Extract last 10 digits for Indian numbers
      const sanitizedPhone = to.replace(/\D/g, '').slice(-10);
      console.log(`[SMS Service] Dispatching via Fast2SMS to ${sanitizedPhone}...`);
      
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${sanitizedPhone}`;
      const response = await fetch(url);
      
      const resData = await response.json();
      if (response.ok && resData.return) {
        console.log(`[SMS Service] Fast2SMS sent successfully.`);
        return true;
      } else {
        console.error(`[SMS Service] Fast2SMS failed:`, resData);
      }
    } catch (err) {
      console.error(`[SMS Service] Fast2SMS exception:`, err.message);
    }
  }

  console.log(`[SMS Service] No active SMS gateway credentials. Falling back to console simulation.`);
  console.log(`💬 SIMULATED SMS to ${to}: ${body}`);
  return false;
}

module.exports = { sendSMS };
