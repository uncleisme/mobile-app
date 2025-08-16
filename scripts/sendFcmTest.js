/*
Usage:
  1) npm i firebase-admin --save-dev
  2) Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path
  3) Run: node scripts/sendFcmTest.js <projectId> <targetToken> [title] [body] [url]
Example:
  node scripts/sendFcmTest.js propmanager-7677c "YOUR_TOKEN" "Test" "Hello from FCM" "/work-orders"
*/

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS env var is required (path to service account JSON).');
  process.exit(1);
}

const [,, projectId, token, title = 'Test', body = 'Hello', url = '/'] = process.argv;
if (!projectId || !token) {
  console.error('Usage: node scripts/sendFcmTest.js <projectId> <targetToken> [title] [body] [url]');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

(async () => {
  try {
    const message = {
      token,
      notification: { title, body },
      data: { url },
    };
    const res = await admin.messaging().send(message);
    console.log('Sent message ID:', res);
  } catch (e) {
    console.error('Send failed:', e);
    process.exit(1);
  }
})();
