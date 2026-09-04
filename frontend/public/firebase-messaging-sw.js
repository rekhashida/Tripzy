// Firebase Cloud Messaging Service Worker for Tripzy Mobile Shell
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyTripzyMobileApiKey2026",
  authDomain: "tripzy-mobility.firebaseapp.com",
  projectId: "tripzy-mobility",
  storageBucket: "tripzy-mobility.appspot.com",
  messagingSenderId: "928961312935",
  appId: "1:928961312935:web:tripzymobileapp2026"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM Service Worker] Received background message: ', payload);
    const notificationTitle = payload.notification?.title || 'Tripzy Update';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new update from Tripzy.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[FCM Service Worker] Firebase init fallback mode active.');
}
