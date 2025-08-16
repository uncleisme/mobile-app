import { supabase } from './supabaseClient';

// Minimal shape to avoid importing full Firebase types everywhere
let messaging: import('firebase/messaging').Messaging | null = null;
let firebaseApp: import('firebase/app').FirebaseApp | null = null;

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidPublicKey: string; // Web Push key
};

export class PushService {
  static initFirebase(config: FirebaseWebConfig) {
    if (firebaseApp) return;
    const { initializeApp, getApps } = require('firebase/app');
    const { getMessaging } = require('firebase/messaging');

    const apps = getApps();
    firebaseApp = apps.length ? apps[0] : initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    messaging = getMessaging(firebaseApp);
  }

  static async registerForPush(config: FirebaseWebConfig, userId: string) {
    if (!firebaseApp || !messaging) this.initFirebase(config);
    if (!messaging) return null;

    // Register dedicated Firebase messaging service worker
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const { getToken, onMessage } = require('firebase/messaging');

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: config.vapidPublicKey,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      await this.saveToken(userId, token, 'web');
    }

    // Foreground messages handling (optional UI hook)
    onMessage(messaging, (payload: any) => {
      // No-op: you can route this to a toast/snackbar if desired
      console.debug('FCM foreground message:', payload);
    });

    return token;
  }

  static async saveToken(userId: string, token: string, platform: 'web') {
    // Upsert by unique token per user
    await supabase
      .from('push_tokens')
      .upsert(
        [{ user_id: userId, token, platform }],
        { onConflict: 'token' }
      );
  }
}
