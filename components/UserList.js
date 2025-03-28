import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getFirestore, collection, getDocs, query, where, orderBy, doc, updateDoc, getDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import LottieView from 'lottie-react-native';

export default function UserList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  
  // Initialize Firestore
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      fetchFriendsList();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && friendsList) {
      fetchUsers();
    }
  }, [user, friendsList]);
  
  const fetchFriendsList = async () => {
    try {
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFriendsList(userData.friends || []);
      } else {
        await setDoc(userRef, { 
          friends: [], 
          email: user.email, 
          createdAt: serverTimestamp(),
          profileImage: ""
        }, { merge: true });
        setFriendsList([]);
      }
    } catch (error) {
      console.error('Error fetching friends list:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      // Get all users except the current user
      const q = query(usersRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Only add users that have a profile and exclude current user
        if (doc.id !== user.id) { // Exclude current user
          usersList.push({
            id: doc.id,
            name: userData.name || userData.email?.split('@')[0] || 'User',
            avatar: userData.profileImage || null,
            email: userData.email,
            phoneNumber: userData.phoneNumber || 'No phone number',
            isFriend: false // Will be updated after fetching friends list
          });
        }
      });
      
      // Update isFriend status for each user
      const usersWithFriendStatus = usersList.map(userItem => ({
        ...userItem,
        isFriend: friendsList.includes(userItem.id)
      }));
      
      // Filter out users who are already in the friend list
      const filteredUsers = usersWithFriendStatus.filter(userItem => !userItem.isFriend);
      
      setAllUsers(filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(text.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(text.toLowerCase())) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(text.toLowerCase()))
      );
      setUsers(filteredUsers);
    } else {
      setUsers(allUsers);
    }
  };

  const handleUserPress = async (userId, userName) => {
    try {
      // Add user to friends list
      await handleAddFriend(userId, userName);
      
      // Create a unique chat room ID by combining both user IDs (sorted to ensure consistency)
      const participants = [user.id, userId].sort();
      const chatRoomId = participants.join('_');
      
      // Check if the chat room exists
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (!chatRoomDoc.exists()) {
        // Create a new chat room if it doesn't exist
        await setDoc(chatRoomRef, {
          participants,
          balances: {
            [user.id]: 0,
            [userId]: 0
          },
          createdAt: serverTimestamp(),
          lastMessage: 'Chat room created',
          lastMessageTime: serverTimestamp()
        });
      }
      
      // Navigate to chat detail screen with the chat room ID
      router.push(`/chat/${chatRoomId}`);
    } catch (error) {
      console.error('Error handling user press:', error);
      Alert.alert('Error', 'Failed to initialize chat. Please try again.');
    }
  };

  const UserItem = ({ item, onPress }) => {
    return (
      <TouchableOpacity 
        className="flex-row items-center p-3 border-b border-text-secondary dark:border-text-secondary-dark bg-surface dark:bg-surface-dark"
        onPress={() => onPress(item.id, item.name)}
      >
        {item.avatar ? (
          <Image 
            source={{ uri: item.avatar }} 
            className="w-14 h-14 rounded-full mr-3"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-secondary items-center justify-center mr-3">
            <Ionicons name="person" size={30} className="text-text-primary dark:text-text-primary-dark" />
          </View>
        )}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-lg text-text-primary dark:text-text-primary-dark">{item.name}</Text>
          </View>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm" numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          {item.phoneNumber && (
            <Text className="text-text-secondary dark:text-text-secondary-dark text-xs">
              {item.phoneNumber}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleAddFriend = async (userId, userName) => {
    if (addingFriend) return;
    
    try {
      setAddingFriend(true);
      
      // Check if already a friend
      if (friendsList.includes(userId)) {
        Alert.alert('Already Friends', `${userName} is already in your friends list.`);
        return;
      }
      
      // Update current user's friends list in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        friends: arrayUnion(userId)
      });

      // Update the other user's friends list
      const otherUserRef = doc(db, 'users', userId);
      await updateDoc(otherUserRef, {
        friends: arrayUnion(user.id)
      });
      
      // Create or initialize chat room
      const participants = [user.id, userId].sort();
      const chatRoomId = participants.join('_');
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (!chatRoomDoc.exists()) {
        await setDoc(chatRoomRef, {
          participants: participants,
          balances: {
            [user.id]: 0,
            [userId]: 0
          },
          createdAt: serverTimestamp(),
          lastMessage: 'Chat room created',
          lastMessageTime: serverTimestamp()
        });
      }
      
      // Update local state
      const updatedFriendsList = [...friendsList, userId];
      setFriendsList(updatedFriendsList);
      
      // No need to manually update users list here as the useEffect will trigger fetchUsers
      
      // Alert.alert('Friend Added', `${userName} has been added to your friends list.`);
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    } finally {
      setAddingFriend(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFriendsList();
      // fetchUsers will be called automatically by the useEffect
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
     

      {/* User List */}
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        {/* Search Bar */}
        <View className="p-3 bg-surface dark:bg-surface-dark border-b border-border dark:border-border-dark">
          <View className="flex-row items-center bg-surface-secondary dark:bg-surface-secondary-dark rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} className="text-text-secondary dark:text-text-secondary-dark" />
            <TextInput
              className="flex-1 ml-2 text-base text-text-primary dark:text-text-primary-dark"
              placeholder="Search users"
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" className="text-action dark:text-action-dark" />
          </View>
        ) : users.length === 0 ? (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-lg text-center">
              No users found
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={({ item }) => <UserItem item={item} onPress={handleUserPress} />}
            keyExtractor={(item) => item.id}
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchUsers}
                colors={['#4f46e5']}
              />
            }
          />
        )}
      </View>
    </View>
  );
}