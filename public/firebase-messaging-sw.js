/*
  Firebase Messaging Service Worker for Web Push
  Fill the Firebase config below with the same values as src/config/firebase.ts
*/

// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// TODO: Replace with your Firebase web app config
// You must keep these in sync with src/config/firebase.ts
self.firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// eslint-disable-next-line no-undef
firebase.initializeApp(self.firebaseConfig);
// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  // Customize notification here
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    data: payload.data || {},
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
