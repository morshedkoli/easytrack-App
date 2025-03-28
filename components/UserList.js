import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
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
      // First add the user as a friend if not already a friend
      if (!friendsList.includes(userId) && !addingFriend) {
        setAddingFriend(true);
        
        // Update current user's friends list in Firestore
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          friends: arrayUnion(userId)
        });
        
        // Also update the other user's friends list to include current user (bidirectional relationship)
        const otherUserRef = doc(db, 'users', userId);
        await updateDoc(otherUserRef, {
          friends: arrayUnion(user.id)
        });
        
        // Update local state
        const updatedFriendsList = [...friendsList, userId];
        setFriendsList(updatedFriendsList);
        
        // Show a brief notification
        Alert.alert('Friend Added', `${userName} has been added to your friends list.`);
        
        setAddingFriend(false);
      }
      
      // Initialize chat room before navigating
      // Create a unique chat room ID by combining both user IDs (sorted to ensure consistency)
      const participants = [user.id, userId].sort();
      const chatRoomId = participants.join('_');
      
      // Check if the chat room exists
      const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
      
      if (!chatRoomDoc.exists()) {
        // Create a new chat room if it doesn't exist
        await setDoc(doc(db, 'chatRooms', chatRoomId), {
          participants,
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: serverTimestamp(),
          balances: { [user.id]: 0, [userId]: 0 } // Initialize balances for both users
        });
        
        console.log('Created new chat room:', chatRoomId);
      } else {
        console.log('Chat room already exists:', chatRoomId);
      }
      
      // Then navigate to chat
      router.push(`/chat/${chatRoomId}`);
    } catch (error) {
      console.error('Error adding friend and navigating to chat:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
      setAddingFriend(false);
    }
  };
  
  const handleAddFriend = async (userId, userName) => {
    if (addingFriend) return;
    
    try {
      setAddingFriend(true);
      
      // Check if already a friend
      if (friendsList.includes(userId)) {
        return;
      }
      
      // Update current user's friends list in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        friends: arrayUnion(userId)
      });
      
      // Also update the other user's friends list to include current user (bidirectional relationship)
      const otherUserRef = doc(db, 'users', userId);
      await updateDoc(otherUserRef, {
        friends: arrayUnion(user.id)
      });
      
      // Update local state
      const updatedFriendsList = [...friendsList, userId];
      setFriendsList(updatedFriendsList);
      
      // No need to manually update users list here as the useEffect will trigger fetchUsers
      
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    } finally {
      setAddingFriend(false);
    }
  };

  const UserItem = ({ item }) => {
    return (
      <View className="flex-row items-center p-3 border-b border-gray-100">
        <TouchableOpacity 
          className="flex-1 flex-row items-center"
          onPress={() => handleUserPress(item.id, item.name)}
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
          </View>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-gray-600 text-sm" numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          {item.phoneNumber && (
            <Text className="text-gray-500 text-xs">
              {item.phoneNumber}
            </Text>
          )}
        </View>
        </TouchableOpacity>
      </View>
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
            placeholder="Search users"
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

      {/* User List */}
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
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserItem 
              item={item} 
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-10">
              <Text className="text-gray-500 text-center">
                No users found. Try a different search.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}