import { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LottieView from 'lottie-react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, isLoading, user } = useAuth();

  if (user) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <ActivityIndicator size="large" color="#4f46e5" />
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
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        <View className="flex-1 justify-center ">
          <View className="bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-lg rounded-3xl p-8 shadow-lg border border-surface/20 dark:border-surface-dark/20">
            <View className="items-center mb-6">
              <LottieView
                source={require('../../assets/animations/signin-animation.json')}
                autoPlay
                loop={false}
                style={{ width: 120, height: 120 }}
              />
            </View>

            <Text variant="displaySmall" style={{ marginBottom: 24, textAlign: 'center', fontWeight: '700' }} className="text-primary dark:text-text-primary-dark">Easy Track</Text>

            {error ? <Text className="text-warning dark:text-warning-dark mb-4 text-center font-medium">{error}</Text> : null}

            <View className="space-y-4">
              <View>
                <Text className="text-secondary dark:text-secondary-dark mb-2 font-medium">Email</Text>
                <TextInput
                  mode="outlined"
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ backgroundColor: 'transparent' }}
                  left={<TextInput.Icon icon="email" color={Platform.OS === 'ios' ? '#64748b' : undefined} className="text-secondary dark:text-secondary-dark" />}
                  theme={{
                    colors: {
                      primary: '#4f46e5', // action color
                      surface: '#ffffff', // surface color
                      onSurface: '#0f172a', // text-primary color
                      placeholder: '#64748b', // text-secondary color
                      outline: '#64748b', // text-secondary color for border
                    },
                    dark: {
                      colors: {
                        primary: '#4f46e5', // action color
                        surface: '#1e293b', // surface-dark color
                        onSurface: '#ffffff', // text-primary-dark color
                        placeholder: '#94a3b8', // text-secondary-dark color
                        outline: '#94a3b8', // text-secondary-dark color for border
                      }
                    }
                  }}
                  className="border-text-secondary dark:border-text-secondary-dark bg-surface/50 dark:bg-surface-dark/50"
                />
              </View>

              <View>
                <Text className="text-secondary dark:text-secondary-dark mb-2 font-medium">Password</Text>
                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{ backgroundColor: 'transparent' }}
                  left={<TextInput.Icon icon="lock" color={Platform.OS === 'ios' ? '#64748b' : undefined} className="text-secondary dark:text-secondary-dark" />}
                  theme={{
                    colors: {
                      primary: '#4f46e5', // action color
                      surface: '#ffffff', // surface color
                      onSurface: '#0f172a', // text-primary color
                      placeholder: '#64748b', // text-secondary color
                      outline: '#64748b', // text-secondary color for border
                    },
                    dark: {
                      colors: {
                        primary: '#4f46e5', // action color
                        surface: '#1e293b', // surface-dark color
                        onSurface: '#ffffff', // text-primary-dark color
                        placeholder: '#94a3b8', // text-secondary-dark color
                        outline: '#94a3b8', // text-secondary-dark color for border
                      }
                    }
                  }}
                  className="border-text-secondary dark:border-text-secondary-dark bg-surface/50 dark:bg-surface-dark/50"
                />
                <TouchableOpacity className="mt-2 self-end">
                  <Link href="/(auth)/forgot-password" className="text-action dark:text-action-dark font-medium flex-row items-center">
                    <Ionicons name="help-circle-outline" size={16} className="text-action dark:text-secondary" style={{ marginRight: 4 }} />
                    <Text className="text-action dark:text-action-dark font-medium">Forgot Password?</Text>
                  </Link>
                </TouchableOpacity>
              </View>

              <Button
                mode="contained"
                onPress={handleSignIn}
                disabled={isLoading}
                style={{ marginTop: 16, borderRadius: 8 }} 
                className="bg-action dark:bg-action shadow-sm"
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}
                icon={isLoading ? null : "login"}
              >
                {isLoading ? <ActivityIndicator color="white" /> : 'Sign In'}
              </Button>

              <View className="flex-row justify-center mt-8">
                <Text className="text-secondary dark:text-secondary-dark">Don't have an account? </Text>
                <Link href="/(auth)/sign-up" className="text-action dark:text-secondary font-semibold">
                  Sign Up
                </Link>
              </View>
              
              <View className="flex-row items-center justify-center mt-6">
                <View className="h-px bg-text-secondary/20 dark:bg-text-secondary-dark/20 flex-1" />
                <Text className="mx-4 text-text-secondary dark:text-text-secondary-dark text-xs">OR CONTINUE WITH</Text>
                <View className="h-px bg-text-secondary/20 dark:bg-text-secondary-dark/20 flex-1" />
              </View>
              
              <View className="flex-row justify-center space-x-4 mt-6">
                <TouchableOpacity className="w-12 h-12 rounded-full bg-surface/20 dark:bg-surface-dark/20 backdrop-blur-lg items-center justify-center border border-surface/10 dark:border-surface-dark/10">
                  <Ionicons name="logo-google" size={24} className="text-action dark:text-secondary" />
                </TouchableOpacity>
                <TouchableOpacity className="w-12 h-12 rounded-full bg-surface/20 dark:bg-surface-dark/20 backdrop-blur-lg items-center justify-center border border-surface/10 dark:border-surface-dark/10">
                  <Ionicons name="logo-apple" size={24} className="text-action dark:text-secondary" />
                </TouchableOpacity>
                <TouchableOpacity className="w-12 h-12 rounded-full bg-surface/20 dark:bg-surface-dark/20 backdrop-blur-lg items-center justify-center border border-surface/10 dark:border-surface-dark/10">
                  <Ionicons name="logo-facebook" size={24} className="text-action dark:text-secondary" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
