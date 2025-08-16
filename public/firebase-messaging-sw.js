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
  apiKey: 'AIzaSyCHpJHzj_lY5uGTzAlBJYNxVkGU4gue4n4',
  authDomain: 'propmanager-7677c.firebaseapp.com',
  projectId: 'propmanager-7677c',
  storageBucket: 'propmanager-7677c.firebasestorage.app',
  messagingSenderId: '958691733281',
  appId: '1:958691733281:web:4dbbc987051305c0751860',
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
