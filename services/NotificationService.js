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

// Track last notification timestamp to prevent duplicate notifications
let lastNotificationTimestamp = 0;

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
    
    // Clear any old notifications when registering
    await Notifications.dismissAllNotificationsAsync();

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
    // Check if expoPushToken exists - only send to recipient
    if (!expoPushToken) {
      console.log('No push token available for recipient');
      return;
    }
    
    // Get current timestamp
    const currentTime = new Date().getTime();
    
    // Prevent duplicate notifications within 2 seconds
    if (currentTime - lastNotificationTimestamp < 2000) {
      console.log('Skipping duplicate notification');
      return;
    }
    
    // Get the current user's push token to avoid sending notifications to self
    const currentUserToken = await Notifications.getExpoPushTokenAsync().then(token => token.data).catch(() => null);
    
    // If the recipient token is the same as the current user's token, don't send notification
    if (currentUserToken && expoPushToken === currentUserToken) {
      console.log('Avoiding sending notification to self');
      return;
    }
    
    // Update last notification timestamp
    lastNotificationTimestamp = currentTime;
    
    let notificationBody = message;
    let notificationTitle = senderName;

    if (amount) {
      const amountText = amount > 0 ? `+৳${amount}` : `-৳${Math.abs(amount)}`;
      notificationBody = `${message}\nAmount: ${amountText}`;
      notificationTitle = `${senderName}`;
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