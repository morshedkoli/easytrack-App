import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatItem({ item, onPress }) {
  return (
    <TouchableOpacity 
      className="flex-row items-center p-3 border-b border-secondary/20 dark:border-secondary/30 bg-surface dark:bg-surface-dark"
      onPress={onPress}
    >
      {item.avatar ? (
        <Image 
          source={{ uri: item.avatar }} 
          className="w-14 h-14 rounded-full mr-3"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-secondary/20 dark:bg-secondary/30 items-center justify-center mr-3">
          <Ionicons name="person" size={30} color="#64748b" />
        </View>
      )}
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="font-semibold text-lg text-text-primary dark:text-text-primary-dark">{item.name}</Text>
            {item.cached && (
              <View className="ml-2 bg-warning/20 px-1 rounded flex-row items-center">
                <Ionicons name="cloud-offline" size={12} color="#f59e0b" />
                <Text className="text-xs text-warning ml-1">Offline</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-text-secondary dark:text-text-secondary-dark">{item.time}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <View className="flex-row items-center flex-1">
            {item.pendingMessages > 0 && (
              <View className="mr-1">
                <Ionicons name="time-outline" size={14} color="#f59e0b" />
              </View>
            )}
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm flex-1" numberOfLines={1}>
              {item.lastMessage}
              {item.pendingMessages > 0 && ` (${item.pendingMessages} pending)`}
            </Text>
          </View>
          {item.unread > 0 && (
            <View className="bg-primary rounded-full w-6 h-6 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">{item.unread}</Text>
            </View>
          )}
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className={`text-sm font-medium ${item.netBalance < 0 ? 'text-warning' : item.netBalance > 0 ? 'text-success' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
            {item.netBalance !== 0 ? `৳${Math.abs(item.netBalance).toFixed(2)} ${item.netBalance < 0 ? 'due' : 'owed'}` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}