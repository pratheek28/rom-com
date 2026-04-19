import { View, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type GoalCompletionBarProps = {
  hoursWorked: number;
  hoursGoal: number;
  streak?: number;
};

export function ProgressBar({ hoursWorked, hoursGoal, streak = 12 }: GoalCompletionBarProps) {
  const progress = Math.min(hoursWorked / hoursGoal, 1);
  const percent = Math.round(progress * 100);

  return (
    <View className="w-11/12 mb-12">
      <View className="flex-row items-center justify-center gap-2 mb-3">
        <Text className="text-white text-xl font-semibold">Weekly Goal</Text>
        <MaterialCommunityIcons name="fire" size={26} color="#f97316" />
        <Text className="text-orange-400 text-xl font-bold">{streak}</Text>
      </View>
      <View className="w-full h-10 bg-gray-700 rounded-full overflow-hidden">
        <View
          className="h-10 bg-blue-500 rounded-full items-end justify-center"
          style={{ width: `${percent}%` }}
        >
          {percent > 10 && (
            <Text className="text-white font-bold pr-4">
              {hoursWorked}h / {hoursGoal}h
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
