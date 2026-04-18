import { View, Text } from "react-native";

type Exercise = {
  name: string;
  sets: number;
};

type WorkoutSession = {
  date: string;
  duration: string;
  exercises: Exercise[];
};

type ThreeDayLogProps = {
  sessions: WorkoutSession[];
};

export function ThreeDayLog({ sessions = [] }: ThreeDayLogProps) {
  const recent = sessions.slice(-3).reverse();

  return (
    <View className="w-11/12 gap-4 pt-10">
      <Text className="text-white text-lg font-semibold mb-1">Last 3 Sessions</Text>
      {recent.map((session, index) => (
        <View key={index} className="bg-white/5 rounded-2xl px-5 py-4 gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-white font-semibold text-base">{session.date}</Text>
            <Text className="text-white/50 text-sm">{session.duration}</Text>
          </View>

          <View className="h-px bg-white/10" />

          {session.exercises.map((exercise, i) => (
            <View key={i} className="flex-row justify-between items-center">
              <Text className="text-white/80 text-sm">{exercise.name}</Text>
              <Text className="text-white/50 text-sm">{exercise.sets} sets</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
