import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

export default function BalanceCard() {
  const { user } = useAuth();
  const [payable, setPayable] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile data
    const fetchUserProfile = async () => {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.name || userData.email?.split('@')[0] || 'User');
        setUserAvatar(userData.profileImage);
      }
    };

    fetchUserProfile();

    const db = getFirestore();
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(chatRoomsRef, where('participants', 'array-contains', user.id));
    
    // Set up real-time listener for chat rooms
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalPayable = 0;
      let totalReceivable = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const balances = data.balances || {};
        const netBalance = (balances[user.id] || 0) - (balances[data.participants.find(id => id !== user.id)] || 0);

        if (netBalance < 0) {
          totalPayable += Math.abs(netBalance);
        } else {
          totalReceivable += netBalance;
        }
      });

      setPayable(totalPayable);
      setReceivable(totalReceivable);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  return (
    <View className="flex-row justify-between items-center px-4 bg-surface dark:bg-surface-dark rounded-2xl shadow-sm p-4">
      {/* Left side - Balance Information */}
      <View className="flex-1">
        <View className="flex-row items-center mb-4">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-semibold text-text-secondary dark:text-text-secondary-dark">দিবো</Text>
              <Ionicons 
                name='arrow-up-circle'
                size={16} 
                color={payable ? '#ef4444' : '#64748b'}
                style={{ marginLeft: 4 }}
              />
            </View>
            <View className={`rounded-lg p-2 ${payable ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-xl font-bold ${payable ? 'text-warning' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
                ৳{payable.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-semibold text-text-secondary dark:text-text-secondary-dark">পাবো</Text>
              <Ionicons 
                name='arrow-down-circle'
                size={16} 
                color={receivable ? '#10b981' : '#64748b'}
                style={{ marginLeft: 4 }}
              />
            </View>
            <View className={`rounded-lg p-2 ${receivable ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-xl font-bold ${receivable ? 'text-success' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
                ৳{receivable.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Right side - User Profile */}
      <View className="items-end">
        <TouchableOpacity onPress={() => router.push('/profile')}>
          {userAvatar ? (
            <Image 
              source={{ uri: userAvatar }} 
              className="w-12 h-12 rounded-full mb-1"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-background dark:bg-background-dark items-center justify-center mb-1">
              <Ionicons name="person" size={24} color="#64748b" />
            </View>
          )}
        </TouchableOpacity>
        {/* <Text className="text-sm font-medium text-text-primary dark:text-text-primary-dark">{userName}</Text> */}
      </View>
    </View>
  );
}