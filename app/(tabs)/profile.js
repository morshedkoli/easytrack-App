import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../services/NotificationService';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Surface, Text, TextInput, Button, Avatar, IconButton, ActivityIndicator, Card } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { isOnline, savePendingOperation } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Initialize Firestore
  const db = getFirestore();

  useEffect(() => {
    // Only attempt to check user profile if user is defined and has an id
    if (user && user.id) {
      checkUserProfile();
      registerForPushNotificationsAsync(user.id);
    }
  }, [user]);

  const checkUserProfile = async () => {
    try {
      setLoading(true);
      // Ensure user exists before proceeding
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setProfileExists(true);
        const userData = userDoc.data();
        setName(userData.name || '');
        setPhoneNumber(userData.phoneNumber || '');
        setProfileImage(userData.profileImage || null);
      } else {
        await setDoc(userRef, {
          name: '',
          phoneNumber: '',
          
          profileImage: "",
          friends: [],
          createdAt: serverTimestamp()
        }, { merge: true });
        setProfileExists(true);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;
        const base64Image = result.assets[0].base64;
        
        // Upload to ImgBB
        const imgbbResponse = await uploadToImgBB(base64Image);
        
        if (imgbbResponse && imgbbResponse.url) {
          // Store the image URL in state
          setProfileImage(imgbbResponse.url);
          // Save the image URL to the profile along with existing name and phone number
          await updateProfileWithImage(imgbbResponse.url);
        } else {
          Alert.alert('Error', 'Failed to get image URL from server');
        }
        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick or upload image');
      setUploadingImage(false);
    }
  };
  
  const uploadToImgBB = async (base64Image) => {
    try {
      const apiKey = '707ad238025806ece51d9e63679151f7'; // Replace with your actual ImgBB API key
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('image', base64Image);
      
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.success) {
        // Return both display URL and delete URL for better image management
        return {
          url: response.data.data.display_url || response.data.data.url, // Prefer display_url if available
          delete_url: response.data.data.delete_url,
          thumb_url: response.data.data.thumb?.url // Include thumbnail if available
        };
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      throw error;
    }
  };
  
  const updateProfileWithImage = async (imageUrl) => {
    try {
      const userRef = doc(db, 'users', user.id);
      
      // Create a profile data object with the image URL and current name/phone
      const profileData = {
        profileImage: imageUrl,
        updatedAt: new Date(),
      };
      
      // If we're editing, include the current name and phone number
      if (isEditing) {
        profileData.name = name;
        profileData.phoneNumber = phoneNumber;
      }
      
      if (profileExists) {
        await updateDoc(userRef, profileData);
      } else {
        // For new profiles, add creation date, email, and empty fields if not editing
        profileData.email = user.email;
        profileData.createdAt = new Date();
        
        if (!isEditing) {
          profileData.name = '';
          profileData.phoneNumber = '';
        }
        
        await setDoc(userRef, profileData);
        setProfileExists(true);
      }
      
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error updating profile with image:', error);
      Alert.alert('Error', 'Failed to update profile with image');
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const userRef = doc(db, 'users', user.id);
      
      // Create a profile data object with all necessary fields
      const profileData = {
        name,
        phoneNumber,
        updatedAt: new Date(),
      };
      
      // Only add the profile image if it exists
      if (profileImage) {
        profileData.profileImage = profileImage;
      }
      
      if (!isOnline) {
        // Store operation for later sync
        await savePendingOperation({
          type: 'profile',
          userId: user.id,
          data: profileData
        });
        setIsEditing(false);
        Alert.alert('Success', 'Profile will be updated when online');
      } else {
        // Create or update the profile
        if (profileExists) {
          await updateDoc(userRef, profileData);
        } else {
          // For new profiles, add creation date and email
          profileData.email = user.email;
          profileData.createdAt = new Date();
          await setDoc(userRef, profileData);
          setProfileExists(true);
        }
        
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-action/90 to-secondary/90">
      <View className="items-center p-6 pb-8">
        <View className="relative mb-4">
          <Avatar.Image
            size={120}
            source={profileImage ? { uri: profileImage } : undefined}
            style={{
              backgroundColor: '#e2e8f0',
              borderWidth: 4,
              borderColor: 'rgba(255,255,255,0.3)',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5
            }}
          >
            {!profileImage && (
              <Text style={{ color: '#64748b', fontSize: 32 }}>
                {(name || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </Avatar.Image>
          {uploadingImage && (
            <ActivityIndicator
              animating={true}
              color="#ffffff"
              style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -12 }}
            />
          )}
          <IconButton
            icon="camera"
            iconColor="#ffffff"
            size={24}
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              backgroundColor: '#4f46e5',
              borderWidth: 3,
              borderColor: '#ffffff',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84
            }}
            onPress={pickImage}
            disabled={uploadingImage}
          />
        </View>
        <Text className="text-2xl font-bold text-white mb-1">
          @{name || user?.email?.split('@')[0] || 'user'}
        </Text>
        <Text className="text-white/80 text-base">{user?.email}</Text>
        <TouchableOpacity
          className="mt-4 bg-red-500/20 hover:bg-red-500/30 px-6 py-2 rounded-full flex-row items-center"
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', onPress: signOut, style: 'destructive' }
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 ml-2 font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View className="flex-1 bg-surface dark:bg-surface-dark rounded-t-3xl px-4 pt-6">
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-circle-outline" size={24} color="#4f46e5" />
            <Text className="text-xl font-bold ml-2 text-text-primary dark:text-text-primary-dark">Account Info</Text>
            {!isEditing && (
              <IconButton
                icon="pencil-outline"
                iconColor="#4f46e5"
                size={20}
                style={{ marginLeft: 'auto' }}
                onPress={() => setIsEditing(true)}
              />
            )}
          </View>
          
          <View className="space-y-4">
            <View className="flex-row items-center bg-background/50 dark:bg-background-dark/50 p-4 rounded-xl">
              <Ionicons name="person-outline" size={20} color="#64748b" />
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                disabled={!isEditing}
                mode="flat"
                className="flex-1 ml-3"
                underlineColor="transparent"
                activeUnderlineColor="#4f46e5"
                textColor="#0f172a"
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
            <View className="flex-row items-center bg-background/50 dark:bg-background-dark/50 p-4 rounded-xl">
              <Ionicons name="call-outline" size={20} color="#64748b" />
              <TextInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                disabled={!isEditing}
                mode="flat"
                className="flex-1 ml-3"
                underlineColor="transparent"
                activeUnderlineColor="#4f46e5"
                textColor="#0f172a"
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
          </View>
          
          {isEditing && (
            <View className="flex-row justify-end gap-3 mt-6">
              <Button
                mode="outlined"
                onPress={() => {
                  setIsEditing(false);
                  checkUserProfile();
                }}
                textColor="#64748b"
                style={{
                  borderColor: '#e2e8f0',
                  borderRadius: 8
                }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={saveProfile}
                loading={loading}
                buttonColor="#4f46e5"
                style={{ borderRadius: 8 }}
              >
                Save
              </Button>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}