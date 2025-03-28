import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatItem({ item, onPress }) {
  return (
    <TouchableOpacity 
      className="flex-row items-center p-3 border-b border-action dark:border-secondary"
      onPress={onPress}
    >
      {item.avatar ? (
        <Image 
          source={{ uri: item.avatar }} 
          className="w-14 h-14 rounded-full mr-3"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-surface dark:bg-surface-dark items-center justify-center mr-3">
          <Ionicons name="person" size={30} className="text-primary-dark" />
        </View>
      )}
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center">
          <Text className="font-semibold text-lg text-surface dark:text-primary-dark">{item.name}</Text>
          {item.time && <Text className="text-xs text-secondary dark:text-secondary-dark">{item.time}</Text>}
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-sm text-secondary dark:text-secondary-dark" numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View className="bg-success rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-surface-dark text-xs font-bold">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View className="ml-2 items-end justify-center">
        <Text 
          className={`text-base font-semibold ${item.netBalance < 0 ? 'text-warning' : 'text-action'}`}
        >
          ৳{(item.netBalance || 0).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};