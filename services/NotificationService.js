import * as Notifications from 'expo-notifications';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { router } from 'expo-router';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification press
const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
  const { chatRoomId } = response.notification.request.content.data;
  if (chatRoomId) {
    router.push(`/chat/${chatRoomId}`);
  }
});

export const registerForPushNotificationsAsync = async (userId) => {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return null;
    }
    
    // Get device token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save the token to Firestore
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: token,
    });

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const unregisterForNotificationsAsync = async (userId) => {
  try {
    // Remove the token from Firestore
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: null,
    });

    // Remove notification listener
    notificationListener.remove();
  } catch (error) {
    console.error('Error unregistering for notifications:', error);
  }
};

export const sendPushNotification = async (expoPushToken, senderName, message, amount = null, chatRoomId = null) => {
  try {
    let notificationBody = message;
    let notificationTitle = senderName;

    if (amount) {
      const amountText = amount > 0 ? `+৳${amount}` : `-৳${Math.abs(amount)}`;
      notificationBody = `${message}\n${amountText}`;
      notificationTitle = `${senderName} sent a transaction`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: notificationBody,
        sound: 'default',
        data: {
          message,
          amount,
          chatRoomId,
          type: 'chat_message',
          senderName,
          timestamp: new Date().toISOString()
        },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};