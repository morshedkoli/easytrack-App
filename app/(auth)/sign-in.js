import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, isLoading } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setError(''); // Clear previous errors

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      {/* REMOVED Stack.Screen declaration */}
      {/* Lottie Animation */}
      <View className="items-center mb-4">
        <LottieView
          source={require('../../assets/animations/signin-animation.json')}
          autoPlay
          loop={false}
          style={{ width: 150, height: 150 }}
        />
      </View>
      
      <Text className="text-3xl font-bold mb-6 text-center">Sign In</Text>

      {/* Error Message */}
      {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}
      
      {/* Email Input */}
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
      
      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-gray-700 mb-2">Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 bg-gray-50"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity className="mt-2 self-end">
          <Link href="/(auth)/forgot-password" className="text-blue-500 text-sm">
            Forgot Password?
          </Link>
        </TouchableOpacity>
      </View>
      
      {/* Sign In Button */}
      <TouchableOpacity 
        className="bg-blue-500 rounded-lg p-4 items-center mb-4"
        onPress={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">Sign In</Text>
        )}
      </TouchableOpacity>
      
      {/* Sign Up Link */}
      <View className="flex-row justify-center">
        <Text className="text-gray-600">Don't have an account? </Text>
        <Link href="/(auth)/sign-up" className="text-blue-500 font-semibold">
          Sign Up
        </Link>
      </View>
    </View>
  );
}
