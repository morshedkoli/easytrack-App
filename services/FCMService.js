import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

export const requestUserPermission = async () => {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  }
  return true;
};

export const getFCMToken = async (userId) => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      // Save the token to Firestore
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: fcmToken,
      });
      return fcmToken;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const registerAppWithFCM = async () => {
  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }
};

export const onMessageReceived = (callback) => {
  return messaging().onMessage(async remoteMessage => {
    callback(remoteMessage);
  });
};

export const onBackgroundMessage = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });
};

export const sendFCMNotification = async (fcmToken, senderName, message, amount = null) => {
  try {
    let notificationBody = message;
    if (amount) {
      const amountText = amount > 0 ? `+৳${amount}` : `-৳${Math.abs(amount)}`;
      notificationBody = `${message}\n${amountText}`;
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=YOUR_SERVER_KEY', // Replace with your FCM server key
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: senderName,
          body: notificationBody,
          sound: 'default',
        },
        data: {
          message,
          amount: amount?.toString(),
        },
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    throw error;
  }
};