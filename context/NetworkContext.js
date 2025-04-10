import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPushNotification } from '../services/NotificationService';
import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firestore';

const NetworkContext = createContext();

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);

  // Monitor network state with improved error handling
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      setIsOnline(state.isConnected);
      setOfflineMode(!state.isConnected);
      
      // If we're coming back online after being offline
      if (state.isConnected && wasOffline) {
        console.log('Connection restored. Syncing pending operations...');
        // Delay sync operation to allow Firestore connection to stabilize
        setTimeout(() => {
          syncPendingOperations();
        }, 2000); // 2-second delay
      }
    });

    // Check connection status immediately
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
      setOfflineMode(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Load pending operations from storage
  useEffect(() => {
    loadPendingOperations();
  }, []);

  const loadPendingOperations = async () => {
    try {
      const operations = await AsyncStorage.getItem('pendingOperations');
      if (operations) {
        setPendingOperations(JSON.parse(operations));
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  };

  const savePendingOperation = async (operation) => {
    try {
      const newOperations = [...pendingOperations, operation];
      await AsyncStorage.setItem('pendingOperations', JSON.stringify(newOperations));
      setPendingOperations(newOperations);
    } catch (error) {
      console.error('Error saving pending operation:', error);
    }
  };

  const syncPendingOperations = async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    console.log(`Syncing ${pendingOperations.length} pending operations`);
    
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
      await AsyncStorage.setItem('pendingOperations', JSON.stringify(failedOperations));
      console.log(`${successfulOperations.length} operations synced, ${failedOperations.length} failed`);
    } else {
      // All operations succeeded, clear the list
      setPendingOperations([]);
      await AsyncStorage.removeItem('pendingOperations');
      console.log(`All ${successfulOperations.length} operations synced successfully`);
    }
  };

  const value = {
    isOnline,
    offlineMode,
    savePendingOperation,
    syncPendingOperations,
    pendingOperationsCount: pendingOperations.length
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}