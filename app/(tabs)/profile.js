import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function Profile() {
  const { user, signOut } = useAuth();
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
    <ScrollView className="flex-1 bg-white">
      <View className="bg-blue-500 p-6 items-center">
        <TouchableOpacity onPress={pickImage} disabled={uploadingImage}>
          {uploadingImage ? (
            <View className="w-24 h-24 rounded-full bg-gray-300 items-center justify-center border-2 border-white">
              <ActivityIndicator color="#fff" />
            </View>
          ) : profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              className="w-24 h-24 rounded-full border-2 border-white" 
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-300 items-center justify-center border-2 border-white">
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        <Text className="text-white text-xl font-bold mt-2">
          {name || user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text className="text-white text-sm opacity-80">{user?.email}</Text>
      </View>
      
      <View className="p-4">
        <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">Personal Information</Text>
          
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Name</Text>
            <TextInput
              className={`border rounded-lg p-3 ${isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              editable={isEditing}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Email</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              value={user?.email}
              editable={false}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Phone Number</Text>
            <TextInput
              className={`border rounded-lg p-3 ${isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>
          
          {isEditing ? (
            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity 
                className="bg-gray-200 rounded-lg px-4 py-2"
                onPress={() => {
                  setIsEditing(false);
                  if (profileExists) {
                    checkUserProfile(); // Reset to original values only if profile exists
                  } else {
                    setName('');
                    setPhoneNumber('');
                  }
                }}
              >
                <Text className="text-gray-800">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-blue-500 rounded-lg px-4 py-2"
                onPress={saveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity 
                className="bg-blue-500 rounded-lg p-3 items-center mb-3"
                onPress={() => setIsEditing(true)}
              >
                <Text className="text-white font-semibold">Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-green-500 rounded-lg p-3 items-center"
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Change Profile Picture</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          className="bg-red-500 rounded-lg p-3 items-center mb-8"
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
          <Text className="text-white font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}