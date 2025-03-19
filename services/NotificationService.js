import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async (userId) => {
  try {
    // Check if we have permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If no existing permission, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the token that uniquely identifies this device
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save the token to Firestore
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: token,
    });

    // Configure notifications for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
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

    // Unregister from receiving notifications
    await Notifications.getExpoPushTokenAsync().then(async ({ data: token }) => {
      // Unregister the token from Expo's push notification service
      await fetch('https://exp.host/--/api/v2/push/token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
        }),
      });
    });
  } catch (error) {
    console.error('Error unregistering for notifications:', error);
  }
};

export const sendPushNotification = async (expoPushToken, senderName, message, amount = null) => {
  try {
    let notificationBody = message;
    if (amount) {
      const amountText = amount > 0 ? `+৳${amount}` : `-৳${Math.abs(amount)}`;
      notificationBody = `${message}\n${amountText}`;
    }

    const notificationMessage = {
      to: expoPushToken,
      sound: 'default',
      title: senderName,
      body: notificationBody,
      data: { message, amount },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationMessage),
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};