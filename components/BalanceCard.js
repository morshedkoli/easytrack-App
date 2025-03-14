import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function BalanceCard() {
  const { user } = useAuth();
  const [payable, setPayable] = useState(0);
  const [receivable, setReceivable] = useState(0);

  useEffect(() => {
    const fetchBalances = async () => {
      const db = getFirestore();
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(chatRoomsRef, where('participants', 'array-contains', user.id));
      
      const snapshot = await getDocs(q);
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
    };

    if (user) fetchBalances();
  }, [user]);

  return (
    <View className="flex-row justify-between px-4">
      <TouchableOpacity 
        className="bg-white rounded-2xl p-4 flex-1 mr-2 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-gray-700">Payable</Text>
          <Ionicons 
            name='arrow-up-circle'
            size={24} 
            color={payable ? '#ef4444' : '#64748b'}
          />
        </View>
        <Text 
          className={`text-2xl font-bold ${payable ? 'text-red-500' : 'text-slate-500'}`}
        >
          ${payable.toFixed(2)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-white rounded-2xl p-4 flex-1 ml-2 shadow-sm"
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-gray-700">Receivable</Text>
          <Ionicons 
            name='arrow-down-circle'
            size={24} 
            color={receivable ? '#22c55e' : '#64748b'}
          />
        </View>
        <Text 
          className={`text-2xl font-bold ${receivable ? 'text-green-500' : 'text-slate-500'}`}
        >
          ${receivable.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}