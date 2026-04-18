import { Text, View, ScrollView } from 'react-native';
import ProfilePic from '@/components/profilepic';

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-zinc-900">
      <View className="flex-row items-center px-6 pt-20 pb-8 gap-4">
        <ProfilePic />
        <View>
          <Text className="text-white text-2xl font-bold">John Doe</Text>
          <Text className="text-white/40 text-sm">@johndoe</Text>
        </View>
      </View>

      <View className="mx-6 h-px bg-white/10 mb-8" />

      <View className="px-6 gap-8">
        {[
          { label: 'Sex', value: 'Male' },
          { label: 'Height', value: '9\' 11\'\'' },
          { label: 'Weight', value: '10075 lb' },
          { label: 'Date of Birth', value: 'Jan 12, 1994' },
        ].map(({ label, value }) => (
          <View
            key={label}
            className="flex-row justify-between items-center bg-white/5 rounded-2xl px-5 py-4"
          >
            <Text className="text-white/50 text-sm">{label}</Text>
            <Text className="text-white text-sm font-semibold">{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}