import { useState } from 'react';
import { View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
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
  const paperTheme = useTheme();

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
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        <View className="flex-1 justify-center">
          <Surface 
            className="rounded-3xl p-8 shadow-lg border border-surface/20 dark:border-surface-dark/20"
            elevation={4}
            style={{ backgroundColor: 'rgba(249, 250, 251, 0.9)' }}
          >
            <View className="items-center mb-6">
              <LottieView
                source={require('../../assets/animations/signup-animation.json')}
                autoPlay
                loop={false}
                style={{ width: 120, height: 120 }}
              />
            </View>

            <Text variant="headlineMedium" style={{ marginBottom: 24, textAlign: 'center', fontWeight: '700', color: '#1d4ed8' }}>Create Account</Text>

            {error ? <Text style={{ color: '#ef4444', marginBottom: 16, textAlign: 'center', fontWeight: '500' }}>{error}</Text> : null}
            {successMessage ? <Text style={{ color: '#10b981', marginBottom: 16, textAlign: 'center', fontWeight: '500' }}>{successMessage}</Text> : null}

            <View className="space-y-4 p-4">
              <View>
                <Text style={{ color: '#6b7280', marginBottom: 8, fontWeight: '500' }}>Email</Text>
                <TextInput
                  mode="outlined"
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
                  left={<TextInput.Icon icon="email" />}
                  outlineColor="#6b7280"
                  activeOutlineColor="#3b82f6"
                  textColor="#1f2937"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View>
                <Text style={{ color: '#6b7280', marginBottom: 8, fontWeight: '500' }}>Password</Text>
                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
                  left={<TextInput.Icon icon="lock" />}
                  outlineColor="#6b7280"
                  activeOutlineColor="#3b82f6"
                  textColor="#1f2937"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View>
                <Text style={{ color: '#6b7280', marginBottom: 8, fontWeight: '500' }}>Confirm Password</Text>
                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  style={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
                  left={<TextInput.Icon icon="lock" />}
                  outlineColor="#6b7280"
                  activeOutlineColor="#3b82f6"
                  textColor="#1f2937"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSignUp}
                disabled={isLoading}
                style={{ marginTop: 16, borderRadius: 8, backgroundColor: '#3b82f6' }}
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}
                icon={isLoading ? null : "account-plus"}
              >
                {isLoading ? <ActivityIndicator color="white" /> : 'Sign Up'}
              </Button>
              
              <View className="flex-row items-center justify-center mt-6">
                <View style={{ height: 1, backgroundColor: 'rgba(107, 114, 128, 0.2)', flex: 1 }} />
                <Text style={{ marginHorizontal: 16, color: '#6b7280', fontSize: 12 }}>OR CONTINUE WITH</Text>
                <View style={{ height: 1, backgroundColor: 'rgba(107, 114, 128, 0.2)', flex: 1 }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 16 }}>
                <TouchableOpacity 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: 'rgba(249, 250, 251, 0.2)', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(249, 250, 251, 0.1)'
                  }}
                >
                  <Ionicons name="logo-google" size={24} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: 'rgba(249, 250, 251, 0.2)', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(249, 250, 251, 0.1)'
                  }}
                >
                  <Ionicons name="logo-twitter" size={24} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: 'rgba(249, 250, 251, 0.2)', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(249, 250, 251, 0.1)'
                  }}
                >
                  <Ionicons name="logo-facebook" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-center mt-6">
                <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity>
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}