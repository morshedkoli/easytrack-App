import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import ChatList from "../../components/ChatList";
import BalanceCard from "../../components/BalanceCard";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Appbar, Surface, useTheme } from "react-native-paper";

export default function Home() {
  const theme = useTheme();

  return (
    <Surface className="flex-1">
      <Stack.Screen 
        options={{
          header: () => (
            <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
              <Appbar.Action icon="menu" onPress={() => {}} />
              <Appbar.Content title="Easy Track" titleStyle={{ fontWeight: 'bold', fontSize: 24 }} />
              <Appbar.Action icon="bell" onPress={() => {}} />
            </Appbar.Header>
          )
        }}
      />
      <BalanceCard />
      <ChatList />
    </Surface>
  );
}