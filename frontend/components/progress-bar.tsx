import { View, Text } from "react-native";

type GoalCompletionBarProps = {
  goalName: string;
  hoursWorked: number;
  hoursGoal: number;
};

export function ProgressBar({
  goalName,
  hoursWorked,
  hoursGoal,
}: GoalCompletionBarProps) {
  const progress = Math.min(hoursWorked / hoursGoal, 1);
  const percent = Math.round(progress * 100);

  return (
    <View className="w-11/12 mb-12">
      <Text className="text-white text-xl font-semibold text-center w-full mb-3">
        {goalName}
      </Text>
      <View className="w-full h-10 bg-gray-700 rounded-full overflow-hidden">
        <View
          className="h-10 bg-blue-300 rounded-full items-end justify-center"
          style={{ width: `${percent}%` }}
        >
          {percent > 10 && (
            <Text className="text-white  font-bold pr-4">
              {hoursWorked}h / {hoursGoal}h
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
