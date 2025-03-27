import { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, isLoading, user } = useAuth();

  if (user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

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
                source={require('../../assets/animations/signin-animation.json')}
                autoPlay
                loop={false}
                style={{ width: 120, height: 120 }}
              />
            </View>

            <Text variant="displaySmall" style={{ marginBottom: 24, textAlign: 'center', color: '#0f172a', fontWeight: '700' }} className="text-primary dark:text-text-primary-dark">Easy Track</Text>

            {error ? <Text className="text-red-600 mb-4 text-center font-medium">{error}</Text> : null}

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
             
                  theme={{ colors: { primary: '#4f46e5', surface: '#ffffff', onSurface: '#0f172a' }, dark: { colors: { primary: '#4f46e5', surface: '#1e293b', onSurface: '#ffffff' } } }}
                />
              </View>

              <View>
                <Text className="text-text-secondary dark:text-text-secondary-dark mb-2 font-medium">Password</Text>
                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{ backgroundColor: 'transparent' }}
               
                  theme={{ colors: { primary: '#4f46e5', surface: '#ffffff', onSurface: '#0f172a' }, dark: { colors: { primary: '#4f46e5', surface: '#1e293b', onSurface: '#ffffff' } } }}
                />
                <TouchableOpacity className="mt-2 self-end">
                  <Link href="/(auth)/forgot-password" className="text-action dark:text-secondary font-medium">
                    Forgot Password?
                  </Link>
                </TouchableOpacity>
              </View>

              <Button
                mode="contained"
                onPress={handleSignIn}
                disabled={isLoading}
                style={{ marginTop: 8 }} className="bg-action dark:bg-action"
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}
              >
                {isLoading ? <ActivityIndicator color="white" /> : 'Sign In'}
              </Button>

              <View className="flex-row justify-center mt-6">
                <Text className="text-text-primary-dark">Don't have an account? </Text>
                <Link href="/(auth)/sign-up" className="text-action dark:text-secondary font-semibold">
                  Sign Up
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
