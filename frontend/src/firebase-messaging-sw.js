// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCs8pqo77KTaRzotBtXBYGuPpxagrv7dG8',
  authDomain: 'chat-real-time-403ab.firebaseapp.com',
  projectId: 'chat-real-time-403ab',
  storageBucket: 'chat-real-time-403ab.firebasestorage.app',
  messagingSenderId: '460589228398',
  appId: '1:460589228398:web:c8c1cc8279c7f4612ce17f',
  measurementId: 'G-7FMM7HWV9Q',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.data?.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
    const { conversationId } = event.notification.data;
    event.notification.close();

    // Mở conversation khi click thông báo
    event.waitUntil(clients.openWindow(`http://localhost:4200/messages`));
});
