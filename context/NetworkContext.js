import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

const NetworkContext = createContext();

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState([]);
  const db = getFirestore();

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        syncPendingOperations();
      }
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

    const operations = [...pendingOperations];
    setPendingOperations([]);
    await AsyncStorage.removeItem('pendingOperations');

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'message':
            await setDoc(doc(collection(db, 'chatRooms', operation.chatRoomId, 'messages')), {
              ...operation.data,
              timestamp: new Date(operation.data.timestamp)
            });
            break;
          case 'profile':
            await updateDoc(doc(db, 'users', operation.userId), operation.data);
            break;
          case 'transaction':
            await updateDoc(doc(db, 'chatRooms', operation.chatRoomId), {
              [`balances.${operation.userId}`]: operation.data.balance
            });
            break;
        }
      } catch (error) {
        console.error('Error syncing operation:', error);
        await savePendingOperation(operation);
      }
    }
  };

  const value = {
    isOnline,
    savePendingOperation,
    syncPendingOperations
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}