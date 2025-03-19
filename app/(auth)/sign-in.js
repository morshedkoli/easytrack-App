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
      
      <Text variant="displaySmall" style={{ marginBottom: 16, textAlign: 'center' }}>Sign In</Text>

      {/* Error Message */}
      {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}
      
      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-2">Email</Text>
        <TextInput
          mode="outlined"
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ marginBottom: 16 }}
        />
      </View>
      
      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-gray-700 mb-2">Password</Text>
        <TextInput
          mode="outlined"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: 16 }}
        />
        <TouchableOpacity className="mt-2 self-end">
          <Link href="/(auth)/forgot-password" className="text-blue-500 text-sm">
            Forgot Password?
          </Link>
        </TouchableOpacity>
      </View>
      
      {/* Sign In Button */}
      <Button 
        mode="contained" 
        onPress={handleSignIn}
        disabled={isLoading}
        style={{ marginBottom: 16 }}
        contentStyle={{ paddingVertical: 8 }}
      >
        {isLoading ? <ActivityIndicator color="white" /> : 'Sign In'}
      </Button>
      
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
