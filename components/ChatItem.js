import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatItem({ item, onPress }) {
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