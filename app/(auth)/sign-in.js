import { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';

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
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white p-6 justify-center">
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
      
      <Text variant="displaySmall" style={{ marginBottom: 16, textAlign: 'center', color: '#1a365d', fontWeight: '600' }}>Sign In</Text>

      {/* Error Message */}
      {error ? <Text className="text-red-500 mb-4 text-center font-medium">{error}</Text> : null}

      {/* Email Input */}
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
      
      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Password</Text>
        <TextInput
          mode="outlined"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
          theme={{ colors: { primary: '#3b82f6' } }}
        />
        <TouchableOpacity className="mt-2 self-end">
          <Link href="/(auth)/forgot-password" className="text-blue-600 font-medium hover:text-blue-700">
            Forgot Password?
          </Link>
        </TouchableOpacity>
      </View>
      
      {/* Sign In Button */}
      <Button 
        mode="contained" 
        onPress={handleSignIn}
        disabled={isLoading}
        style={{ marginBottom: 16, backgroundColor: '#3b82f6' }}
        contentStyle={{ paddingVertical: 8 }}
        labelStyle={{ fontSize: 16, fontWeight: '600' }}
      >
        {isLoading ? <ActivityIndicator color="white" /> : 'Sign In'}
      </Button>
      
      {/* Sign Up Link */}
      <View className="flex-row justify-center">
        <Text className="text-gray-700">Don't have an account? </Text>
        <Link href="/(auth)/sign-up" className="text-blue-600 font-semibold hover:text-blue-700">
          Sign Up
        </Link>
      </View>
    </View>
  );
}
