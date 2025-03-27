import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Configure notification behavior for handling both foreground and background notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // Handle chat messages differently when app is in foreground
    if (data.type === 'chat_message') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldSetBadge: true
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Configure notification channel for Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Chat Messages',
    description: 'Notifications for new chat messages and transactions',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    enableVibrate: true,
    enableLights: true,
  });
}

// Set up notification response handler
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'chat_message' && data.chatRoomId) {
    // Navigate to chat screen when notification is tapped
    router.push(`/chat/${data.chatRoomId}`);
  }
});

export const registerForPushNotificationsAsync = async (userId) => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Chat Messages',
      description: 'Notifications for new chat messages and transactions',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      enableLights: true,
    });
  }
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
    // In newer versions of expo-constants, the path to access projectId has changed
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.manifest?.extra?.eas?.projectId || 
                      "c75cf83e-278b-4028-a14b-f63089fc88e2"; // Fallback to the projectId from app.json
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;

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

export const sendPushNotification = async (expoPushToken, senderName, message, amount = null, chatRoomId = null) => {
  try {
    if (!expoPushToken) {
      console.log('No push token found');
      return;
    }

    let notificationBody = message;
    let notificationTitle = senderName;

    if (amount) {
      const amountText = amount > 0 ? `+৳${amount}` : `-৳${Math.abs(amount)}`;
      notificationBody = `${message}\n${amountText}`;
      notificationTitle = `${senderName} sent a transaction`;
    }

    const notificationMessage = {
      to: expoPushToken,
      sound: Platform.OS === 'android' ? 'default' : 'default',
      title: notificationTitle,
      subtitle: amount ? 'New Transaction' : 'New Message',
      body: notificationBody,
      data: { 
        message,
        amount,
        chatRoomId,
        type: 'chat_message',
        senderName,
        timestamp: new Date().toISOString()
      },
      priority: 'high',
      badge: 1,
      channelId: 'default',
      categoryId: amount ? 'transaction' : 'message',
      mutableContent: true,
      autoDismiss: true
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