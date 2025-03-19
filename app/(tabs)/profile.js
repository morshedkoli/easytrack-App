import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Surface, Text, TextInput, Button, Avatar, IconButton, ActivityIndicator, Card } from 'react-native-paper';

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
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Surface style={{ backgroundColor: '#ffffff', padding: 24, alignItems: 'center', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <IconButton
          icon="logout"
          iconColor="#64748b"
          size={24}
          style={{ position: 'absolute', top: 8, right: 8 }}
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
        />
        <Avatar.Image
          size={96}
          source={profileImage ? { uri: profileImage } : require('../../assets/images/default-avatar.png')}
          style={{ backgroundColor: '#e2e8f0', marginBottom: 16 }}
        />
        {uploadingImage && (
          <ActivityIndicator
            animating={true}
            color="#64748b"
            style={{ position: 'absolute', top: 60 }}
          />
        )}
        <IconButton
          icon="camera"
          iconColor="#ffffff"
          size={24}
          style={{ position: 'absolute', bottom: 70, right: '35%', backgroundColor: '#3b82f6' }}
          onPress={pickImage}
          disabled={uploadingImage}
        />
        <Text variant="headlineSmall" style={{ color: '#1e293b', marginBottom: 4 }}>
          {name || user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text variant="bodyMedium" style={{ color: '#64748b' }}>{user?.email}</Text>
      </Surface>
      
      <View style={{ padding: 16, backgroundColor: 'white' }}>
        <Card style={{ marginBottom: 16, elevation: 1, backgroundColor: '#ffffff', borderRadius: 12 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text variant="titleLarge" style={{ color: '#1e293b' }}>Personal Information</Text>
              {!isEditing && (
                <IconButton
                  icon="pencil"
                  mode="contained"
                  containerColor="#3b82f6"
                  iconColor="white"
                  size={20}
                  onPress={() => setIsEditing(true)}
                />
              )}
            </View>
            
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              disabled={!isEditing}
              mode="outlined"
              style={{ marginBottom: 16, backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#3b82f6"
              textColor="#1e293b"
            />
            <TextInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              disabled={!isEditing}
              mode="outlined"
              style={{ marginBottom: 16, backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#3b82f6"
              textColor="#1e293b"
            />
            {isEditing && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsEditing(false);
                    checkUserProfile();
                  }}
                  textColor="#64748b"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={saveProfile}
                  loading={loading}
                  buttonColor="#3b82f6"
                >
                  Save
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}