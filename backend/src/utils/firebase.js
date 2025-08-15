const admin = require('../config/firebase/firebase');

const sendPushNotification = async ({ 
    userId,
    title,
    body,
    conversationId, // using click to this conversation
    token 
  }) => {
  console.log(`Sending FCM to user: ${userId}, title: ${title}, body: ${body}, conversationId: ${conversationId}, token: ${token}`);
  if (!token || typeof token !== 'string' || token.trim() === '') {
    console.error(`Invalid FCM token for user ${userId}:`, token);
    return;
  }
  const message = {
    data: { title, body },
    token: token.trim(),
  };

  console.log(message);

  try {
    await admin.messaging().send(message);
    console.log(`Sent FCM to user: ${userId}`);
  } catch (error) {
    console.error('FCM error:', error);
  }
};

module.exports = {
  sendPushNotification,
};
