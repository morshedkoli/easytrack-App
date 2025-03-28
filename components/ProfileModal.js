import React from 'react';
import { View, Text, Image, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileModal({ isVisible, onClose, user }) {
  if (!user) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center w-full h-full" style={{ zIndex: 9999 }}>
        <View className="bg-white w-[90%] rounded-2xl overflow-hidden max-h-[80%]">
          {/* Header with close button */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Profile Image */}
            <View className="items-center mb-6">
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  className="w-32 h-32 rounded-full"
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-gray-300 items-center justify-center">
                  <Ionicons name="person" size={64} color="#fff" />
                </View>
              )}
            </View>

            {/* User Info */}
            <View className="space-y-4">
              <View className="space-y-2">
                <Text className="text-gray-500 text-sm">Name</Text>
                <Text className="text-lg font-semibold">{user.name}</Text>
              </View>

              <View className="space-y-2">
                <Text className="text-gray-500 text-sm">Email</Text>
                <Text className="text-lg">{user.email || 'Not provided'}</Text>
              </View>

              <View className="space-y-2">
                <Text className="text-gray-500 text-sm">Phone Number</Text>
                <Text className="text-lg">{user.phoneNumber || 'Not provided'}</Text>
              </View>

              <View className="space-y-2">
                <Text className="text-gray-500 text-sm">Balance</Text>
                <Text className={`text-lg font-semibold ${user.netBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ৳{user.netBalance?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}