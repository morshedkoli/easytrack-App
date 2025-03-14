import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, Stack, router } from 'expo-router';
import { auth } from '../../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import LottieView from 'lottie-react-native';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage('Password reset email sent! Check your inbox.');
      // Clear the email field after successful submission
      setEmail('');
    } catch (error) {
      let errorMessage = 'Failed to send reset email';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <View className="items-center mb-4">
        <LottieView
          source={require('../../assets/animations/signin-animation.json')}
          autoPlay
          loop={false}
          style={{ width: 150, height: 150 }}
        />
      </View>
      
      <Text className="text-3xl font-bold mb-6 text-center">Reset Password</Text>
      
      {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}
      {successMessage ? <Text className="text-green-500 mb-4 text-center">{successMessage}</Text> : null}
      
      <View className="mb-6">
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
      
      <TouchableOpacity 
        className="bg-blue-500 rounded-lg p-4 items-center mb-4"
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">Send Reset Link</Text>
        )}
      </TouchableOpacity>
      
      <View className="flex-row justify-center">
        <Text className="text-gray-600">Remember your password? </Text>
        <Link href="/(auth)/sign-in" className="text-blue-500 font-semibold">
          Sign In
        </Link>
      </View>
    </View>
  );
}