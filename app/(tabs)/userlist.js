import { View, Text } from "react-native";
import UserList from "../../components/UserList";

export default function UserListScreen() {
  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark pt-safe">
      <View className="bg-action p-4">
        <Text className="text-2xl font-bold text-surface dark:text-surface-dark text-center">All Users</Text>
      </View>
      
      <UserList />
    </View>
  );
}