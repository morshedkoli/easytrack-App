import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, doc, getDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';

const MessageItem = ({ message, currentUserId }) => {
  const isMe = message.senderId === currentUserId;
  
  return (
    <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <View 
        className={`rounded-2xl p-3 max-w-[80%] ${isMe ? 'bg-green-100' : 'bg-white border border-gray-200'}`}
      >
        {message.amount && (
          <View className={`mb-2 p-2 rounded ${message.transactionType === 'add' ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`text-base font-bold ${message.transactionType === 'add' ? 'text-green-600' : 'text-red-600'}`}>
              {message.transactionType === 'add' ? '+' : '-'} ৳{parseFloat(message.amount).toFixed(2)}
            </Text>
          </View>
        )}
        <Text className="text-gray-800 text-base">{message.text}</Text>
        <Text className="text-xs text-gray-500 text-right mt-1">{message.date} {message.time}</Text>
      </View>
    </View>
  );
};

export default function ChatDetail() {
  const { id: chatRoomId } = useLocalSearchParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('add');
  const [messages, setMessages] = useState([]);
  const [chatPartner, setChatPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [partnerBalance, setPartnerBalance] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [currentUserBalance, setCurrentUserBalance] = useState(0);
  
  // Add a ref for the FlatList to control scrolling
  const flatListRef = useRef(null);
  
  // Initialize Firestore
  const db = getFirestore();

  useEffect(() => {
    if (user && chatRoomId) {
      fetchChatRoomDetails();
      subscribeToMessages();
    }
  }, [user, chatRoomId]);

  const fetchChatRoomDetails = async () => {
    try {
      // Get chat room document
      const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
      
      if (!chatRoomDoc.exists()) {
        console.error('Chat room not found');
        return;
      }

      
      
      const chatRoomData = chatRoomDoc.data();
      const otherUserId = chatRoomData.participants.find(id => id !== user.id);

      // Get balances from chatroom document
      const balances = chatRoomData.balances || {};
      setCurrentUserBalance(balances[user.id] || 0);
      setPartnerBalance(balances[otherUserId] || 0);
      
      // Find the other participant (not the current user)
      
      
      
      if (otherUserId) {
        // Get the other user's profile
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        
        if (otherUserDoc.exists()) {
          const userData = otherUserDoc.data();
          setChatPartner({
            id: otherUserId,
            name: userData.name || userData.email?.split('@')[0] || 'User',
            avatar: userData.profileImage || null,
            status: 'online' // You could implement real status tracking later
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat room details:', error);
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp ? new Date(data.timestamp.toDate()) : new Date();
        
        // Format date as "15 Mar 2025"
        const day = timestamp.getDate();
        const month = timestamp.toLocaleString('en-US', { month: 'short' });
        const year = timestamp.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;
        
        messageList.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          amount: data.amount,
          transactionType: data.transactionType,
          date: formattedDate,
          time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });
      
      setMessages(messageList);
      setLoading(false);
      
      // Scroll to the bottom when new messages arrive - improved with immediate attempt
      if (flatListRef.current && messageList.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
        // Also try with a slight delay to ensure rendering is complete
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  };

  const sendMessage = async () => {
    if (message.trim() === '' && !amount) return;
    if (isSending) return;
    
    setIsSending(true);
    
    try {
      const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
      const userRef = doc(db, 'users', user.id);
      const partnerRef = doc(db, 'users', chatPartner.id);
      
      let messageData = {
        text: message,
        senderId: user.id,
        timestamp: serverTimestamp(),
      };

      if (amount) {
        const amountNum = parseFloat(amount);
        messageData = {
          ...messageData,
          amount: amountNum,
          transactionType
        };
        // Update user's balance in chatroom
        const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
        const chatRoomDoc = await getDoc(chatRoomRef);
        const balances = chatRoomDoc.data()?.balances || {};
        const currentUserBalance = balances[user.id] || 0;
        const partnerUserBalance = balances[chatPartner.id] || 0;
        
        // Update local state with latest balances
        setCurrentUserBalance(currentUserBalance);
        setPartnerBalance(partnerUserBalance);

        // Calculate new balances based on transaction type
        const newUserBalance = transactionType === 'add' 
          ? currentUserBalance + amountNum 
          : currentUserBalance - amountNum;
        
     
        // Update both user balances in the chatroom
        await updateDoc(chatRoomRef, {
          [`balances.${user.id}`]: newUserBalance,
        });

        setBalance(newUserBalance );
        setCurrentUserBalance(currentUserBalance);
        setPartnerBalance(partnerUserBalance);
      }
      
      // Add the message to the messages collection
      await addDoc(messagesRef, messageData);
      
      // Update the chatRoom document with the last message and timestamp
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(chatRoomRef, {
        lastMessage: message.trim() || (amount ? `${transactionType === 'add' ? '+' : '-'} ৳${parseFloat(amount).toFixed(2)}` : 'Sent an empty message'),
        lastMessageTime: serverTimestamp()
      });
      
      setMessage('');
      setAmount('');
      
      // Scroll to bottom immediately after sending a message
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
        // Also try with a slight delay to ensure rendering is complete
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      fetchChatRoomDetails();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LottieView
          source={require('../../assets/animations/chat-loading-animation.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text className="mt-4 text-gray-600 text-lg font-medium">Loading chat...</Text>
        <Text className="mt-2 text-gray-500 text-sm">Please wait while we fetch your messages</Text>
      </View>
    );
  }

  if (!chatPartner && loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0084ff" />
        <Text className="mt-4 text-gray-600 text-lg">Loading chat partner...</Text>
      </View>
    );
  }

  if (!chatPartner) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#0084ff" />
      <Text className="mt-4 text-gray-600 text-lg">Loading chat partner...</Text>
    </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <View className="flex-row items-center">
              {chatPartner.avatar ? (
                <Image 
                  source={{ uri: chatPartner.avatar }} 
                  className="w-10 h-10 rounded-full mr-2"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center mr-2">
                  <Ionicons name="person" size={18} color="#fff" />
                </View>
              )}
              <View>
                <Text className="font-semibold text-lg">{chatPartner.name}</Text>
                <Text className="text-xs text-gray-500">{chatPartner.status}</Text>
              </View>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#0084ff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row items-center mr-4">
              <Text className={`text-lg font-semibold ${currentUserBalance - partnerBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                ৳{(currentUserBalance - partnerBalance).toFixed(2)}
              </Text>
             
            </View>
          ),
        }}
      />
      
      <View className="flex-1 bg-gray-50 p-3">
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">No messages yet. Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageItem message={item} currentUserId={user.id} />}
            contentContainerStyle={{ paddingBottom: 10 }}
            inverted={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            initialNumToRender={messages.length}
            maxToRenderPerBatch={10}
            windowSize={10}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          />
        )}
      </View>
      
      <View className="bg-white p-3 border-t border-gray-200">
        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center bg-gray-100 rounded-lg p-2">
            <TouchableOpacity 
              onPress={() => setTransactionType('add')}
              className={`px-4 py-2 rounded-md ${transactionType === 'add' ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <Text className={`text-base font-medium ${transactionType === 'add' ? 'text-white' : 'text-gray-600'}`}>দিলাম</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTransactionType('subtract')}
              className={`px-4 py-2 rounded-md ml-2 ${transactionType === 'subtract' ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <Text className={`text-base font-medium ${transactionType === 'subtract' ? 'text-white' : 'text-gray-600'}`}>পেলাম</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="ml-3 bg-gray-100 rounded-lg px-5 py-4 flex-1 text-base"
            placeholder="টাকার পরিমাণ"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-row items-start mb-4">
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-5 py-4 mx-2 min-h-[100] text-base"
            placeholder="মেসেজ লিখেন"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity onPress={sendMessage} disabled={isSending} className="mt-2">
            <View className={`w-20 h-20 rounded-full items-center justify-center ${isSending ? 'bg-gray-400' : 'bg-green-500'}`}>
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={40} color="white" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}