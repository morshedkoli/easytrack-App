import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPushNotification } from '../services/NotificationService';
import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { Alert, ToastAndroid, Platform } from 'react-native';

const NetworkContext = createContext();

// Storage keys for cached data
const STORAGE_KEYS = {
  PENDING_OPERATIONS: 'pendingOperations',
  CHAT_LISTS: 'cachedChatLists',
  MESSAGES: 'cachedMessages',
  LAST_SYNC: 'lastSyncTime',
  OFFLINE_MESSAGES: 'offlineMessages',
  MESSAGE_QUEUE: 'messageQueue'
};

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [cachedChatLists, setCachedChatLists] = useState([]);
  const [cachedMessages, setCachedMessages] = useState({});
  const [messageQueue, setMessageQueue] = useState({});
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [offlineMessagesCount, setOfflineMessagesCount] = useState(0);
  const [lastNetworkChangeTime, setLastNetworkChangeTime] = useState(null);

  // Show network status notification to user
  const showNetworkNotification = (title, message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM
      );
    } else {
      // For iOS and other platforms
      Alert.alert(title, message, [{ text: 'OK' }]);
    }
  };

  // Monitor network state with improved error handling
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const now = new Date();
      setIsOnline(state.isConnected);
      setOfflineMode(!state.isConnected);
      setLastNetworkChangeTime(now);
      
      // Show notification to user about network status change
      if (state.isConnected && wasOffline) {
        showNetworkNotification('Connection Restored', 'You are back online. Your messages will be synchronized.');
        console.log('Connection restored. Syncing pending operations...');
        // Delay sync operation to allow Firestore connection to stabilize
        setTimeout(() => {
          syncPendingOperations();
          syncOfflineMessages();
        }, 2000); // 2-second delay
      } else if (!state.isConnected && !wasOffline) {
        showNetworkNotification('Offline Mode', 'You are now offline. Messages will be sent when connection is restored.');
      }
    });

    // Check connection status immediately
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
      setOfflineMode(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Load cached data from storage
  useEffect(() => {
    loadPendingOperations();
    loadCachedData();
    loadMessageQueue();
    loadOfflineMessageCount();
  }, []);
  
  // Load offline message count
  const loadOfflineMessageCount = async () => {
    try {
      const count = await AsyncStorage.getItem('offlineMessageCount');
      if (count) {
        setOfflineMessagesCount(parseInt(count, 10));
      }
    } catch (error) {
      console.error('Error loading offline message count:', error);
    }
  };

  const loadPendingOperations = async () => {
    try {
      const operations = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
      if (operations) {
        setPendingOperations(JSON.parse(operations));
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  };
  
  const loadCachedData = async () => {
    try {
      // Load cached chat lists
      const chatLists = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_LISTS);
      if (chatLists) {
        setCachedChatLists(JSON.parse(chatLists));
      }
      
      // Load cached messages
      const messages = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (messages) {
        setCachedMessages(JSON.parse(messages));
      }
      
      // Load last sync time
      const syncTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (syncTime) {
        setLastSyncTime(JSON.parse(syncTime));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };
  
  const loadMessageQueue = async () => {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_QUEUE);
      if (queue) {
        setMessageQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Error loading message queue:', error);
    }
  };

  const savePendingOperation = async (operation) => {
    try {
      const newOperations = [...pendingOperations, operation];
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(newOperations));
      setPendingOperations(newOperations);
      
      // If this is a message operation, also add to the message queue for UI updates
      if (operation.type === 'message') {
        await addMessageToQueue(operation.chatRoomId, operation.data);
      }
    } catch (error) {
      console.error('Error saving pending operation:', error);
    }
  };
  
  // Add a message to the offline queue and update UI
  const addMessageToQueue = async (chatRoomId, messageData) => {
    try {
      // Create a copy of the current message queue
      const updatedQueue = { ...messageQueue };
      
      // Initialize the chat room queue if it doesn't exist
      if (!updatedQueue[chatRoomId]) {
        updatedQueue[chatRoomId] = [];
      }
      
      // Add the message to the queue with a local ID
      const localMessage = {
        ...messageData,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pending: true,
        timestamp: new Date(messageData.timestamp),
        queuedAt: new Date().toISOString()
      };
      
      updatedQueue[chatRoomId].push(localMessage);
      
      // Update state and storage
      setMessageQueue(updatedQueue);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify(updatedQueue));
      
      // Also update the cached messages to show in UI immediately
      await updateCachedMessages(chatRoomId, localMessage);
      
      // Increment and save offline message count
      const newCount = offlineMessagesCount + 1;
      setOfflineMessagesCount(newCount);
      await AsyncStorage.setItem('offlineMessageCount', newCount.toString());
      
      // Show notification to user
      if (offlineMode) {
        showNetworkNotification('Message Queued', 'Your message will be sent when you are back online.');
      }
      
      return localMessage;
    } catch (error) {
      console.error('Error adding message to queue:', error);
      return null;
    }
  };
  
  // Update cached messages with a new message
  const updateCachedMessages = async (chatRoomId, newMessage) => {
    try {
      const currentMessages = cachedMessages[chatRoomId] || [];
      const updatedMessages = [...currentMessages, newMessage];
      
      // Update the cached messages
      const updatedCache = { ...cachedMessages, [chatRoomId]: updatedMessages };
      setCachedMessages(updatedCache);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Error updating cached messages:', error);
    }
  };
  
  // Cache chat lists for offline access
  const cacheChatLists = async (chatLists) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_LISTS, JSON.stringify(chatLists));
      setCachedChatLists(chatLists);
      
      // Update last sync time
      const now = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(now));
      setLastSyncTime(now);
    } catch (error) {
      console.error('Error caching chat lists:', error);
    }
  };
  
  // Cache messages for a specific chat room
  const cacheMessages = async (chatRoomId, messages) => {
    try {
      const updatedMessages = { ...cachedMessages, [chatRoomId]: messages };
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));
      setCachedMessages(updatedMessages);
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  };
  
  // Get cached messages for a specific chat room
  const getCachedMessages = (chatRoomId) => {
    return cachedMessages[chatRoomId] || [];
  };
  
  // Get cached chat lists
  const getCachedChatLists = () => {
    return cachedChatLists || [];
  };

  const syncPendingOperations = async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    console.log(`Syncing ${pendingOperations.length} pending operations`);
    setSyncInProgress(true);
    setSyncStatus('Syncing pending operations...');
    
    // Create a copy of operations to process
    const operations = [...pendingOperations];
    
    // Track successfully processed operations
    const successfulOperations = [];
    const failedOperations = [];
    
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'message':
            await setDoc(doc(collection(db, 'chatRooms', operation.chatRoomId, 'messages')), {
              ...operation.data,
              timestamp: new Date(operation.data.timestamp),
              offlineCreated: true
            });
            
            // Send notification for the message if it contains sender info
            if (operation.senderInfo) {
              try {
                await sendPushNotification(
                  operation.receiverId,
                  operation.senderInfo.name || operation.senderInfo.email?.split('@')[0] || 'User',
                  operation.data.text,
                  operation.data.amount || null,
                  operation.data.transactionType || null
                );
              } catch (notificationError) {
                console.error('Error sending pending notification:', notificationError);
              }
            }
            break;
          case 'profile':
            await updateDoc(doc(db, 'users', operation.userId), operation.data);
            break;
          case 'transaction':
            await updateDoc(doc(db, 'chatRooms', operation.chatRoomId), {
              [`balances.${operation.userId}`]: operation.data.balance
            });
            break;
          case 'chatRoom':
            // Handle chat room updates
            await updateDoc(doc(db, 'chatRooms', operation.chatRoomId), operation.data);
            break;
        }
        
        // If we get here, the operation was successful
        successfulOperations.push(operation);
      } catch (error) {
        console.error('Error syncing operation:', error);
        failedOperations.push(operation);
      }
    }
    
    // Update pending operations to only include failed ones
    if (failedOperations.length > 0) {
      setPendingOperations(failedOperations);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(failedOperations));
      console.log(`${successfulOperations.length} operations synced, ${failedOperations.length} failed`);
      setSyncStatus(`Synced ${successfulOperations.length} operations, ${failedOperations.length} failed`);
    } else {
      // All operations succeeded, clear the list
      setPendingOperations([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OPERATIONS);
      console.log(`All ${successfulOperations.length} operations synced successfully`);
      setSyncStatus(`All ${successfulOperations.length} operations synced successfully`);
    }
    setSyncInProgress(false);
  };
  
  // Sync offline messages from the message queue
  const syncOfflineMessages = async () => {
    if (!isOnline) return;
    
    // Check if there are any messages in the queue
    const queueEntries = Object.entries(messageQueue);
    if (queueEntries.length === 0) return;
    
    setSyncInProgress(true);
    setSyncStatus('Syncing offline messages...');
    console.log('Syncing offline messages...');
    
    let successCount = 0;
    let failCount = 0;
    let failedMessages = [];
    
    // Process each chat room's message queue
    for (const [chatRoomId, messages] of queueEntries) {
      if (!messages || messages.length === 0) continue;
      
      // Process each message in the queue
      for (const message of messages) {
        try {
          // Add the message to Firestore
          const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
          await addDoc(messagesRef, {
            ...message,
            timestamp: new Date(message.timestamp),
            pending: false,
            offlineCreated: true,
            syncedAt: new Date()
          });
          
          // Update the chat room with the last message
          const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
          await updateDoc(chatRoomRef, {
            lastMessage: message.text || 'Sent a message',
            lastMessageTime: serverTimestamp(),
            lastSyncTime: serverTimestamp()
          });
          
          successCount++;
        } catch (error) {
          console.error('Error syncing offline message:', error);
          failCount++;
          failedMessages.push({
            chatRoomId,
            messageId: message.id,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Clear the message queue after syncing
    if (successCount > 0) {
      setMessageQueue({});
      setOfflineMessagesCount(0);
      await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGE_QUEUE);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MESSAGE_COUNT, '0');
      
      // Show a success message
      if (failCount === 0) {
        setSyncStatus(`All ${successCount} offline messages synced successfully`);
        console.log(`All ${successCount} offline messages synced successfully`);
      } else {
        setSyncStatus(`Synced ${successCount} messages, ${failCount} failed`);
        console.log(`Synced ${successCount} messages, ${failCount} failed`);
        
        // Store failed messages for later retry
        await AsyncStorage.setItem('failedMessages', JSON.stringify(failedMessages));
      }
      
      // Show a notification to the user
      showNetworkNotification(
        'Messages Synchronized',
        `${successCount} offline messages have been synchronized.`
      );
    }
    
    setSyncInProgress(false);
  };

  const value = {
    isOnline,
    offlineMode,
    savePendingOperation,
    syncPendingOperations,
    syncOfflineMessages,
    pendingOperationsCount: pendingOperations.length,
    cacheChatLists,
    cacheMessages,
    getCachedMessages,
    getCachedChatLists,
    lastSyncTime,
    addMessageToQueue,
    updateCachedMessages,
    messageQueue,
    syncInProgress,
    syncStatus,
    offlineMessagesCount,
    showNetworkNotification,
    lastNetworkChangeTime
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}