import { Text, View, ScrollView, Image, TouchableOpacity, Modal, FlatList } from 'react-native';
import ProfilePic from '@/components/profilepic';
import { useState } from 'react';

const LANGUAGES = [
  "English", "Spanish", "French", "German",
  "Italian", "Portuguese", "Russian", "Chinese"
];

export default function ProfileScreen() {
  const people = [
    { name: "Alice", img: require("../../assets/images/coach1.png") },
    { name: "Bob", img: require("../../assets/images/coach1.png") },
  ];
  const [language, setLanguage] = useState("English");
  const [showPicker, setShowPicker] = useState(false);

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
          { label: 'Height', value: "9' 11''" },
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

      <View className="px-6 gap-8 mt-10">
        <Text className="text-white text-2xl font-bold">Personalize your Coach</Text>
        <View className="flex-row items-center gap-8">
          {people.map((person, index) => (
            <View key={index} style={{ alignItems: "center" }}>
              <Image
                source={person.img}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
              <Text style={{ marginTop: 8, fontSize: 14, color: "white" }}>
                {person.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="px-6 gap-4 mt-5 mb-10">
        <Text className="text-white text-2xl font-bold">Language</Text>

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="flex-row justify-between items-center bg-white/5 rounded-2xl px-5 py-4"
        >
          <Text className="text-white text-sm font-semibold">{language}</Text>
          <Text className="text-white/50 text-sm">▼</Text>
        </TouchableOpacity>

        <Modal visible={showPicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View style={{ backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/10">
                <Text className="text-white text-lg font-bold">Select Language</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text className="text-white/50 text-sm">Done</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={LANGUAGES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { setLanguage(item); setShowPicker(false); }}
                    className="px-6 py-4 flex-row justify-between items-center"
                  >
                    <Text className="text-white text-base">{item}</Text>
                    {language === item && <Text className="text-blue-400">✓</Text>}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}