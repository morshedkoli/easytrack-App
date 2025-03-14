import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    <View className="flex-1 bg-white p-6 justify-center">
      {/* REMOVED Stack.Screen declaration */}
      <View className="items-center mb-4">
        <LottieView
          source={require('../../assets/animations/signup-animation.json')}
          autoPlay
          loop={false}
          style={{ width: 150, height: 150 }}
        />
      </View>
      
      <Text className="text-3xl font-bold mb-6 text-center">Create Account</Text>
      
      {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}
      {successMessage ? <Text className="text-green-500 mb-4 text-center">{successMessage}</Text> : null}
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-2">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 bg-gray-50"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-2">Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 bg-gray-50"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      
      <View className="mb-6">
        <Text className="text-gray-700 mb-2">Confirm Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 bg-gray-50"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>
      
      <TouchableOpacity 
        className="bg-blue-500 rounded-lg p-4 items-center mb-4"
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">Sign Up</Text>
        )}
      </TouchableOpacity>
      
      <View className="flex-row justify-center">
        <Text className="text-gray-600">Already have an account? </Text>
        <Link href="/(auth)/sign-in" className="text-blue-500 font-semibold">
          Sign In
        </Link>
      </View>
    </View>
  );
}