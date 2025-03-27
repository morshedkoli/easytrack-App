import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../../context/AuthContext";
import ChatList from "../../components/ChatList";
import BalanceCard from "../../components/BalanceCard";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";

export default function Home() {

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark pt-safe">
      <Stack.Screen 
        options={{
          headerTitle: "Easy Track",
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
          headerStyle: {
            backgroundColor: '#4f46e5',
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerLeft: () => (
            <Ionicons name="menu-outline" size={28} color="#fff" style={{ marginLeft: 10 }} />
          ),
          headerRight: () => (
            <Ionicons name="notifications-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
          ),
        }}
      />
      <BalanceCard />

      <ChatList />
    </View>
  );
}