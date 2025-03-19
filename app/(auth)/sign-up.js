import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signUp, isLoading } = useAuth();

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    const result = await signUp(email.trim(), password.trim());
    
    if (!result.success) {
      setError(result.error || 'Failed to sign up');
    } else {
      setSuccessMessage('Account created successfully! Redirecting...');
    }
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white p-6 justify-center">
      {/* REMOVED Stack.Screen declaration */}
      <View className="items-center mb-4">
        <LottieView
          source={require('../../assets/animations/signup-animation.json')}
          autoPlay
          loop={false}
          style={{ width: 150, height: 150 }}
        />
      </View>
      
      <Text variant="displaySmall" style={{ marginBottom: 16, textAlign: 'center', color: '#1a365d', fontWeight: '600' }}>Create Account</Text>
      
      {error ? <Text className="text-red-500 mb-4 text-center font-medium">{error}</Text> : null}
      {successMessage ? <Text className="text-green-500 mb-4 text-center font-medium">{successMessage}</Text> : null}
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-2 font-medium">Email</Text>
        <TextInput
          mode="outlined"
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
          theme={{ colors: { primary: '#3b82f6' } }}
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-2 font-medium">Password</Text>
        <TextInput
          mode="outlined"
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
          theme={{ colors: { primary: '#3b82f6' } }}
        />
      </View>
      
      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Confirm Password</Text>
        <TextInput
          mode="outlined"
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
          theme={{ colors: { primary: '#3b82f6' } }}
        />
      </View>
      
      <Button 
        mode="contained" 
        onPress={handleSignUp}
        disabled={isLoading}
        style={{ marginBottom: 16, backgroundColor: '#3b82f6' }}
        contentStyle={{ paddingVertical: 8 }}
        labelStyle={{ fontSize: 16, fontWeight: '600' }}
      >
        {isLoading ? <ActivityIndicator color="white" /> : 'Sign Up'}
      </Button>
      
      <View className="flex-row justify-center">
        <Text className="text-black">Already have an account? </Text>
        <Link href="/(auth)/sign-in" className="text-blue-600 font-semibold hover:text-blue-700">
          Sign In
        </Link>
      </View>
    </View>
  );
}