import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import LottieView from 'lottie-react-native';
import ChatItem from './ChatItem';

export default function ChatList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { offlineMode, getCachedChatLists, cacheChatLists, isOnline, messageQueue } = useNetwork();
  
  // Firestore is initialized in firebase/firestore.js with offline persistence

  useEffect(() => {
    if (user) {
      fetchUsers();
      // Set up real-time listeners for chat rooms
      const unsubscribe = setupChatRoomListeners();
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [user]);
  
  // Use cached chat lists when offline
  useEffect(() => {
    if (offlineMode) {
      const cachedChats = getCachedChatLists();
      if (cachedChats && cachedChats.length > 0) {
        // Mark chats as cached when in offline mode
        const markedChats = cachedChats.map(chat => {
          // Check if there are pending messages for this chat
          const pendingMessages = messageQueue[chat.id] || [];
          return {
            ...chat,
            cached: true,
            pendingMessages: pendingMessages.length,
            lastSyncTime: chat.lastSyncTime || 'Unknown'
          };
        });
        setAllUsers(markedChats);
        setChats(markedChats);
        setLoading(false);
      }
    }
  }, [offlineMode, getCachedChatLists, messageQueue]);

  const setupChatRoomListeners = () => {
    if (!user || !user.id) return;

    // Set up a direct listener on the chatRooms collection where the user is a participant
    // This is similar to how BalanceCard.js listens for updates
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(chatRoomsRef, where('participants', 'array-contains', user.id));
    
    // This single listener will update whenever any chat room changes
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Get the current user's friends list to ensure we have all friend data
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const friendsList = userData.friends || [];
      
      // Create a map to store updated chat data
      const updatedChatsMap = new Map();
      
      // Process all chat rooms from the snapshot
      const chatRoomPromises = snapshot.docs.map(async (chatRoomDoc) => {
        const chatRoomData = chatRoomDoc.data();
        const participants = chatRoomData.participants || [];
        const friendId = participants.find(id => id !== user.id);
        
        if (!friendId || !friendsList.includes(friendId)) return null;
        
        // Get friend's user data
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) return null;
        
        const friendData = friendDoc.data();
        const balances = chatRoomData.balances || { [user.id]: 0, [friendId]: 0 };
        const netBalance = balances[user.id] - balances[friendId];
        
        // Create updated chat object
        const lastMessageTime = chatRoomData.lastMessageTime ? chatRoomData.lastMessageTime.toDate() : new Date(0);
        
        updatedChatsMap.set(friendId, {
          id: friendId,
          name: friendData.name || friendData.email?.split('@')[0] || 'User',
          avatar: friendData.profileImage || null,
          lastMessage: chatRoomData.lastMessage || 'Tap to start chatting',
          time: lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          lastMessageTime: lastMessageTime,
          unread: 0,
          email: friendData.email,
          netBalance: netBalance
        });
      });
      
      // Wait for all promises to resolve
      await Promise.all(chatRoomPromises);
      
      // Convert map to array and sort by lastMessageTime
      const updatedChats = Array.from(updatedChatsMap.values())
        .filter(chat => chat !== null)
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      
      // Update both state variables with the new data
      setAllUsers(updatedChats);
      setChats(updatedChats);
      
      // Cache chat lists for offline use
      if (isOnline) {
        cacheChatLists(updatedChats);
      }
    });

    return unsubscribe;
  };
  

  const fetchUsers = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      
      // First, get the current user's friends list
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('User document not found');
        // Initialize empty arrays to prevent rendering issues
        setAllUsers([]);
        setChats([]);
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const friendsList = userData.friends || [];
      
      if (friendsList.length === 0) {
        // No friends yet
        setAllUsers([]);
        setChats([]);
        setLoading(false);
        return;
      }
      
      // Now fetch only the users who are in the friends list
      const usersRef = collection(db, 'users');
      const usersList = [];
      
      // Use Promise.all to fetch all friend documents in parallel
      const friendPromises = friendsList.map(friendId => getDoc(doc(db, 'users', friendId)));
      const friendDocs = await Promise.all(friendPromises);
      
      // Create an array to store promises for fetching chat room balances
      const balancePromises = [];
      
      friendDocs.forEach((docSnapshot) => {
        if (docSnapshot.exists()) {
          const friendData = docSnapshot.data();
          const friendId = docSnapshot.id;
          
          // Create a unique chat room ID by combining both user IDs (sorted to ensure consistency)
          const participants = [user.id, friendId].sort();
          const chatRoomId = participants.join('_');
          
          // Add promise to fetch chat room data
          balancePromises.push(
            getDoc(doc(db, 'chatRooms', chatRoomId))
              .then(chatRoomDoc => {
                let netBalance = 0;
                let lastMessageTime = null;
                let lastMessage = 'Tap to start chatting';
                
                if (chatRoomDoc.exists()) {
                  const chatRoomData = chatRoomDoc.data();
                  const balances = chatRoomData.balances || { [user.id]: 0, [friendId]: 0 };
                  // Calculate net balance
                  netBalance = balances[user.id] - balances[friendId];
                  
                  // Get last message time for sorting
                  if (chatRoomData.lastMessageTime) {
                    lastMessageTime = chatRoomData.lastMessageTime.toDate();
                  }
                  
                  // Get last message if available
                  if (chatRoomData.lastMessage) {
                    lastMessage = chatRoomData.lastMessage;
                  }
                }
                
                return {
                  id: friendId,
                  name: friendData.name || friendData.email?.split('@')[0] || 'User',
                  avatar: friendData.profileImage || null,
                  lastMessage: lastMessage,
                  time: lastMessageTime ? lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
                  lastMessageTime: lastMessageTime || new Date(0), // Use epoch time if no messages yet
                  unread: 0,
                  email: friendData.email,
                  netBalance: netBalance
                };
              })
          );
        }
      });
      
      // Wait for all balance promises to resolve
      const usersWithBalances = await Promise.all(balancePromises);
      
      // Sort users by lastMessageTime (most recent first)
      const sortedUsers = [...usersWithBalances].sort((a, b) => {
        return b.lastMessageTime - a.lastMessageTime;
      });
      
      setAllUsers(sortedUsers);
      setChats(sortedUsers);
      
      // Cache chat lists for offline access
      if (isOnline) {
        cacheChatLists(sortedUsers);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filteredChats = allUsers.filter(chat => 
        chat.name.toLowerCase().includes(text.toLowerCase()) ||
        (chat.email && chat.email.toLowerCase().includes(text.toLowerCase()))
      );
      setChats(filteredChats);
    } else {
      setChats(allUsers);
    }
  };

  const handleChatPress = async (chatId) => {
    try {
      // Check if a chat room already exists between the current user and the tapped user
      const chatRoomsRef = collection(db, 'chatRooms');
      
      // Create a unique chat room ID by combining both user IDs (sorted to ensure consistency)
      const participants = [user.id, chatId].sort();
      const chatRoomId = participants.join('_');
      
      // Check if the chat room exists
      const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
      
      if (!chatRoomDoc.exists()) {
        // Create a new chat room if it doesn't exist
        await setDoc(doc(db, 'chatRooms', chatRoomId), {
          participants,
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: serverTimestamp()
        });
        
        console.log('Created new chat room:', chatRoomId);
      } else {
        console.log('Chat room already exists:', chatRoomId);
      }
      
      // Navigate to chat detail screen with the chat room ID
      router.push(`/chat/${chatRoomId}`);
    } catch (error) {
      console.error('Error handling chat press:', error);
    }
  };




  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      {/* Offline Banner */}
      {offlineMode && (
        <View className="bg-warning/20 px-3 py-2 flex-row items-center justify-center">
          <Ionicons name="cloud-offline" size={18} color="#f59e0b" />
          <Text className="ml-2 text-warning font-medium">Offline Mode - Viewing cached data</Text>
        </View>
      )}
      
      {/* Search Bar */}
      <View className="p-4 bg-surface dark:bg-surface-dark">
        <View className="flex-row items-center bg-background dark:bg-background-dark rounded-lg px-4 py-2">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-text-primary dark:text-text-primary-dark"
            placeholder="Search chats"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Chat List */}
      {loading ? (
        <View className="flex-1 justify-center items-center bg-surface dark:bg-surface-dark">
          <Text className="mt-4 text-text-secondary dark:text-text-secondary-dark">Loading users...</Text>
        </View>
      ) : (
        <FlatList
          className="bg-surface dark:bg-surface-dark"
          data={chats}
          extraData={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem 
              item={item} 
              onPress={() => handleChatPress(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-10">
              <Text className="text-text-secondary dark:text-text-secondary-dark text-center">
                No users found. Try a different search or invite friends to join!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUsers(true)}
              colors={['#2563eb']}
            />
          }
        />
      )}

     
    </View>
  );
}
