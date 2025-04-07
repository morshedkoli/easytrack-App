import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../services/NotificationService';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Surface, Text, TextInput, Button, Avatar, IconButton, ActivityIndicator, Card, Divider, useTheme } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';

export default function Profile() {
  // Define theme colors based on tailwind config
  const themeColors = {
    primary: '#1d4ed8',
    secondary: '#0e7490',
    action: '#3b82f6',
    surface: '#f9fafb',
    surfaceDark: '#e5e7eb',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    error: '#ef4444',
    success: '#10b981',
  };
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
      <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.surface }}>
        <ActivityIndicator size="large" color={themeColors.action} />
        <Text variant="bodyMedium" style={{ marginTop: 16, color: themeColors.textSecondary }}>Loading profile...</Text>
      </Surface>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: themeColors.surface }}>
      <Surface style={{ elevation: 0, backgroundColor: themeColors.surface }}>
        <Card style={{ margin: 16, backgroundColor: themeColors.surface, elevation: 1 }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{ position: 'relative', marginBottom: 16 }}>
              <Avatar.Image
                size={120}
                source={profileImage ? { uri: profileImage } : undefined}
                style={{
                  backgroundColor: themeColors.surfaceDark,
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
                  <Text style={{ fontSize: 32, color: themeColors.textPrimary }}>
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
                mode="contained"
                style={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  backgroundColor: themeColors.action,
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
            <Text 
              variant="headlineMedium" 
              style={{
                fontWeight: 'bold',
                marginBottom: 4,
                color: themeColors.textPrimary,
              }}
            >
              @{name || user?.email?.split('@')[0] || 'user'}
            </Text>
            <Text variant="bodyMedium" style={{ color: themeColors.textSecondary, marginBottom: 16 }}>
              {user?.email}
            </Text>
            <Button
              mode="contained-tonal"
              icon="logout"
              buttonColor="rgba(239, 68, 68, 0.1)"
              textColor={themeColors.error}
              style={{ borderRadius: 24 }}
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
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      
        <Card style={{ margin: 16, marginTop: 8, backgroundColor: themeColors.surface, elevation: 1 }}>
          <Card.Title 
            title="Account Info" 
            titleStyle={{ color: themeColors.textPrimary, fontWeight: 'bold' }}
            right={(props) => !isEditing && (
              <IconButton
                {...props}
                icon="pencil"
                iconColor={themeColors.textSecondary}
                style={{ backgroundColor: themeColors.surfaceDark }}
                onPress={() => setIsEditing(true)}
              />
            )}
          />
          <Card.Content>
            <Surface style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: themeColors.surfaceDark, 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12 
            }}>
              <Ionicons name="person-outline" size={20} color={themeColors.textSecondary} />
              {isEditing ? (
                <TextInput
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  mode="flat"
                  style={{ 
                    flex: 1, 
                    marginLeft: 12, 
                    backgroundColor: 'transparent'
                  }}
                  textColor={themeColors.textPrimary}
                  underlineColor="transparent"
                  activeUnderlineColor={themeColors.action}
                  theme={{ colors: { onSurfaceVariant: themeColors.textSecondary } }}
                />
              ) : (
                <Text variant="bodyLarge" style={{ flex: 1, marginLeft: 12, color: themeColors.textPrimary }}>
                  {name || 'Not provided'}
                </Text>
              )}
            </Surface>
            
            <Surface style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: themeColors.surfaceDark, 
              padding: 16, 
              borderRadius: 12 
            }}>
              <Ionicons name="call-outline" size={20} color={themeColors.textSecondary} />
              {isEditing ? (
                <TextInput
                  label="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  mode="flat"
                  style={{ 
                    flex: 1, 
                    marginLeft: 12, 
                    backgroundColor: 'transparent'
                  }}
                  textColor={themeColors.textPrimary}
                  underlineColor="transparent"
                  activeUnderlineColor={themeColors.action}
                  theme={{ colors: { onSurfaceVariant: themeColors.textSecondary } }}
                />
              ) : (
                <Text variant="bodyLarge" style={{ flex: 1, marginLeft: 12, color: themeColors.textPrimary }}>
                  {phoneNumber || 'Not provided'}
                </Text>
              )}
            </Surface>
          </Card.Content>
        </Card>
      
      {isEditing && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, margin: 16 }}>
          <Button
            mode="outlined"
            onPress={() => {
              setIsEditing(false);
              checkUserProfile();
            }}
            textColor={themeColors.textSecondary}
            style={{
              borderColor: themeColors.surfaceDark,
              borderRadius: 8
            }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={saveProfile}
            loading={loading}
            buttonColor={themeColors.action}
            style={{ borderRadius: 8 }}
          >
            Save
          </Button>
        </View>
      )}
      </Surface>
    </ScrollView>
  );
}