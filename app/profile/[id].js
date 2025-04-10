import React from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileUser({
            id,
            name: userData.name || userData.email?.split('@')[0] || 'User',
            avatar: userData.profileImage || null,
            email: userData.email || 'Not provided',
            phoneNumber: userData.phoneNumber || 'Not provided'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [id]);

  if (loading || !profileUser) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0084ff" />
        <Text className="mt-4 text-gray-600 text-lg">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen 
        options={{
          title: profileUser.name,
          headerBackTitle: 'Back'
        }} 
      />
      
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View className="items-center mb-6">
          {profileUser.avatar ? (
            <Image
              source={{ uri: profileUser.avatar }}
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
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">Name</Text>
            <Text className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">{profileUser.name}</Text>
          </View>

          <View className="space-y-2">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">Email</Text>
            <Text className="text-lg text-text-primary dark:text-text-primary-dark">{profileUser.email}</Text>
          </View>

          <View className="space-y-2">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">Phone Number</Text>
            <Text className="text-lg text-text-primary dark:text-text-primary-dark">{profileUser.phoneNumber}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}