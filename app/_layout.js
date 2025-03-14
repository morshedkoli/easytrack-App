import { Tabs } from "expo-router";
import "../global.css";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider } from "../context/AuthContext";
import { Stack } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import * as SplashScreen from "expo-splash-screen";
import CustomSplashScreen from "../components/SplashScreen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate some loading time (3 seconds)
    const timer = setTimeout(() => {
      setIsReady(true);
      SplashScreen.hideAsync();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500); // Small delay after resources are ready
      
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (showSplash) {
    return <CustomSplashScreen />;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: '#fff'
            }
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}
