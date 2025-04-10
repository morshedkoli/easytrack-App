import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the token
 */
export async function registerForPushNotificationsAsync(userId) {
  let token;

  // Check if this is a physical device (notifications won't work in simulators)
  if (Device.isDevice) {
    // Check if we have permission, if not request it
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If we still don't have permission, we can't proceed
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the Expo push token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'c75cf83e-278b-4028-a14b-f63089fc88e2', // From app.json
    })).data;

    // Save the token to the user's document in Firestore
    if (userId && token) {
      await saveUserPushToken(userId, token);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  // Set up notification categories/channels for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * Save the user's push token to Firestore
 */
async function saveUserPushToken(userId, token) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        pushToken: token,
        tokenUpdatedAt: new Date()
      });
    } else {
      // Create new user document with token
      await setDoc(userRef, {
        pushToken: token,
        tokenUpdatedAt: new Date(),
        createdAt: new Date()
      }, { merge: true });
    }
    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(receiverId, senderName, message, amount = null, transactionType = null) {
  try {
    // Get the receiver's push token
    const receiverRef = doc(db, 'users', receiverId);
    const receiverDoc = await getDoc(receiverRef);
    
    if (!receiverDoc.exists()) {
      console.log('Receiver document not found');
      return;
    }
    
    const receiverData = receiverDoc.data();
    const pushToken = receiverData.pushToken;
    
    if (!pushToken) {
      console.log('No push token found for receiver');
      return;
    }

    // Prepare notification content
    let title = `Message from ${senderName}`;
    let body = message;

    // If there's a transaction, include it in the notification
    if (amount) {
      const amountText = parseFloat(amount).toFixed(2);
      const symbol = transactionType === 'add' ? '+' : '-';
      title = `${senderName} sent a transaction`;
      body = `${symbol} ৳${amountText}${message ? ` - ${message}` : ''}`;
    }

    // Send the notification
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        data: { 
          senderId: receiverId,
          amount,
          transactionType,
          message
        },
      }),
    });

    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(navigation) {
  // Handle notifications that are received while the app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Handle notifications that are tapped by the user
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;
    console.log('Notification tapped:', data);
    
    // Navigate to the chat screen if we have a senderId
    if (data.senderId) {
      // Navigate to the chat screen
      navigation.navigate('chat', { id: data.senderId });
    }
  });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}