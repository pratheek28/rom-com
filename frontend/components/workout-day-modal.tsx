import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";

type Exercise = {
  name: string;
  sets: number;
};

type WorkoutDayModalProps = {
  date: string | null;
  duration?: string;
  exercises?: Exercise[];
  onClose: () => void;
};

export function WorkoutDayModal({ date, duration, exercises = [], onClose }: WorkoutDayModalProps) {
  return (
    <Modal
      visible={!!date}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <TouchableOpacity className="flex-1 bg-black/50" onPress={onClose} />

        <View className="bg-black rounded-t-3xl px-6 pt-6 pb-10">
          <View className="w-10 h-1 bg-white/20 rounded-full self-center mb-5" />

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold">{date}</Text>
            {duration && (
              <Text className="text-white/50 text-sm">{duration}</Text>
            )}
          </View>

          <View className="h-px bg-white/10 mb-4" />

          <ScrollView>
            {exercises.map((exercise, i) => (
              <View key={i} className="flex-row justify-between items-center py-3 border-b border-white/5">
                <Text className="text-white text-sm">{exercise.name}</Text>
                <Text className="text-white/50 text-sm">{exercise.sets} sets</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
