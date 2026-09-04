// Push Notification Service (Firebase Cloud Messaging simulator & web push dispatch)

async function sendPushNotification(deviceToken, title, body, data = {}) {
  try {
    console.log(`[Push Notification Service] Dispatching Push Alert to token: ${deviceToken ? deviceToken.substring(0, 15) : 'SIMULATED_DEVICE'}`);
    console.log(`[Push Notification Payload] Title: "${title}" | Body: "${body}"`);

    // Return payload confirmation
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      title,
      body,
      data
    };
  } catch (err) {
    console.error('[Push Notification Error]:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendPushNotification };
