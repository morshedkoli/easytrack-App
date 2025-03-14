import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getFirestore, collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import LottieView from 'lottie-react-native';

export default function ChatList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Initialize Firestore
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

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
                let balance = 0;
                let partnerBalance = 0;
                
                if (chatRoomDoc.exists()) {
                  const chatRoomData = chatRoomDoc.data();
                  const balances = chatRoomData.balances || { [user.id]: 0, [friendId]: 0 };
                  balance = balances[user.id] || 0;
                  partnerBalance = balances[friendId] || 0;
                }
                
                return {
                  id: friendId,
                  name: friendData.name || friendData.email?.split('@')[0] || 'User',
                  avatar: friendData.profileImage || null,
                  lastMessage: 'Tap to start chatting',
                  time: '',
                  unread: 0,
                  email: friendData.email,
                  balance: chatRoomDoc.exists() ? (chatRoomDoc.data().balances?.[user.id] || 0) : 0,
                  partnerBalance: chatRoomDoc.exists() ? (chatRoomDoc.data().balances?.[friendId] || 0) : 0,
                  netBalance: (chatRoomDoc.exists() ? (chatRoomDoc.data().balances?.[friendId] || 0) : 0) - 
                             (chatRoomDoc.exists() ? (chatRoomDoc.data().balances?.[user.id] || 0) : 0)
                };
              })
          );
        }
      });
      
      // Wait for all balance promises to resolve
      const usersWithBalances = await Promise.all(balancePromises);
      
      setAllUsers(usersWithBalances);
      setChats(usersWithBalances);
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


  const ChatItem = ({ item, onPress }) => {
    return (
      <TouchableOpacity 
        className="flex-row items-center p-3 border-b border-gray-100"
        onPress={onPress}
      >
        {item.avatar ? (
          <Image 
            source={{ uri: item.avatar }} 
            className="w-14 h-14 rounded-full mr-3"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center mr-3">
            <Ionicons name="person" size={30} color="#fff" />
          </View>
        )}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-lg">{item.name}</Text>
            {item.time && <Text className="text-xs text-gray-500">{item.time}</Text>}
          </View>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-gray-600 text-sm" numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View className="bg-green-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Balance Display */}
        <View className="ml-2 items-end justify-center">
          <Text 
            className={`text-base font-semibold ${item.netBalance < 0 ? 'text-red-500' : 'text-green-500'}`}
          >
            ৳{(item.netBalance || 0).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="p-3 bg-gray-50 border-b border-gray-200">
        <View className="flex-row items-center bg-white rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Chat List */}
      {loading ? (
        <View className="flex-1 justify-center items-center bg-white">
          <LottieView
            source={require('../assets/animations/chatlist-loading-animation.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text className="mt-4 text-gray-600">Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem 
              item={item} 
              onPress={() => handleChatPress(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-10">
              <Text className="text-gray-500 text-center">
                No users found. Try a different search or invite friends to join!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUsers(true)}
              colors={['#3b82f6']}
            />
          }
        />
      )}

      {/* New Chat Button */}
      {/* <TouchableOpacity 
        className="absolute bottom-6 right-6 bg-green-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/new-chat')}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity> */}
    </View>
  );
}
