import { useState } from 'react';
import { View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gradient-to-b from-action to-secondary dark:from-primary dark:to-surface-dark"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        <View className="flex-1 justify-center">
          <View className="bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-lg rounded-3xl p-8 shadow-lg">
            <View className="items-center mb-6">
              <LottieView
                source={require('../../assets/animations/signup-animation.json')}
                autoPlay
                loop={false}
                style={{ width: 120, height: 120 }}
              />
            </View>

            <Text variant="displaySmall" style={{ marginBottom: 24, textAlign: 'center', color: '#0f172a', fontWeight: '700' }} className="text-primary dark:text-text-primary-dark">Create Account</Text>

            {error ? <Text className="text-red-600 mb-4 text-center font-medium">{error}</Text> : null}
            {successMessage ? <Text className="text-green-500 mb-4 text-center font-medium">{successMessage}</Text> : null}

            <View className="space-y-4">
              <View>
                <Text className="text-text-secondary dark:text-text-secondary-dark mb-2 font-medium">Email</Text>
                <TextInput
                  mode="outlined"
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ backgroundColor: 'transparent' }}
                  theme={{ colors: { primary: '#4f46e5' } }}
                  left={<TextInput.Icon icon="email" />}
                />
              </View>

              <View>
                <Text className="text-text-secondary dark:text-text-secondary-dark mb-2 font-medium">Password</Text>
                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{ backgroundColor: 'transparent' }}
                  theme={{ colors: { primary: '#4f46e5' } }}
                  left={<TextInput.Icon icon="lock" />}
                />
              </View>

              <View>
                <Text className="text-text-secondary dark:text-text-secondary-dark mb-2 font-medium">Confirm Password</Text>
                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  style={{ backgroundColor: 'transparent' }}
                  theme={{ colors: { primary: '#4f46e5' } }}
                  left={<TextInput.Icon icon="lock" />}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSignUp}
                disabled={isLoading}
                style={{ marginTop: 16 }} className="bg-action dark:bg-action"
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}
              >
                {isLoading ? <ActivityIndicator color="white" /> : 'Sign Up'}
              </Button>

              <View className="flex-row justify-center space-x-4 mt-6">
                <TouchableOpacity className="w-12 h-12 rounded-full bg-surface/20 dark:bg-surface-dark/20 backdrop-blur-lg items-center justify-center">
                  <Ionicons name="logo-google" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="w-12 h-12 rounded-full bg-surface/20 dark:bg-surface-dark/20 backdrop-blur-lg items-center justify-center">
                  <Ionicons name="logo-twitter" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="w-12 h-12 rounded-full bg-surface/20 dark:bg-surface-dark/20 backdrop-blur-lg items-center justify-center">
                  <Ionicons name="logo-facebook" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-center mt-6">
                <Text className="text-text-primary-dark">Already have an account? </Text>
                <Link href="/(auth)/sign-in" className="text-action dark:text-secondary font-semibold">
                  Sign In
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}