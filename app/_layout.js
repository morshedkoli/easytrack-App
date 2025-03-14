import { Tabs } from "expo-router";
import "../global.css";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider } from "../context/AuthContext";
import { Stack } from "expo-router";

export default function AppLayout() {
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
