import { View, Text } from "react-native";
import UserList from "../../components/UserList";

export default function UserListScreen() {
  return (
    <View className="flex-1 bg-white pt-safe">
      <View className="bg-blue-500 p-4">
        <Text className="text-2xl font-bold text-white text-center">All Users</Text>
      </View>
      
      <UserList />
    </View>
  );
}