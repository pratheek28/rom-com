import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfilePic() {
  return (
    <View className="flex flex-col items-start justify-start w-1/10 h-full pl-4">
      <Ionicons name="person-circle-outline" size={60} color="#6b7280" />
    </View>
  );
}