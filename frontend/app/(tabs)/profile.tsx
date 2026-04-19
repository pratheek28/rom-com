import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Button,
} from 'react-native';
import ProfilePic from '@/components/profilepic';
import { useState, useEffect } from 'react';
import { Dropdown } from 'react-native-element-dropdown';

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
];

const data = [
  { label: 'John Doe', value: 'John Doe' },
  { label: 'Jane Doe', value: 'Jane Doe' },
];

type UserDataRow = { sex: string; height: string; user_weight: string };

export default function ProfileScreen() {
  const people = [
    { name: 'Alice', img: require('../../assets/images/coach1.png') },
    { name: 'Bob', img: require('../../assets/images/coach1.png') },
  ];
  const [language, setLanguage] = useState('English');
  const [showPicker, setShowPicker] = useState(false);
  const [userData, setUserData] = useState<UserDataRow | null>(null);
  const [name, setName] = useState<string | null>(null);

  function getUserData(userName: string) {
    AsyncStorage.setItem('name', userName);
    fetch('https://rom-com.onrender.com/get-user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName }),
    })
      .then((response) => response.json())
      .then((d) => {
        console.log(d);
        setUserData(d);
      })
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    AsyncStorage.getItem('name').then((saved: string | null) => {
      if (saved) {
        setName(saved);
        getUserData(saved);
      }
    });
  }, []);

  const profileRows = userData
    ? [
        { label: 'Sex', value: userData.sex },
        { label: 'Height', value: userData.height },
        { label: 'Weight', value: userData.user_weight },
      ]
    : [];

  return (
    <ScrollView className="flex-1 bg-zinc-900">
      <View className="flex-row items-center px-6 pt-20 pb-8 gap-4">
        <ProfilePic />
        <View className="flex w-2/3">
          {name ? (
            <Text className="text-white text-2xl font-bold">{name}</Text>
          ) : (
            <Dropdown
              data={data}
              placeholder="Select User"
              labelField="label"
              valueField="value"
              onChange={(item: { label: string; value: string }) => {
                setName(item.value);
                getUserData(item.value);
              }}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 10,
                borderWidth: 1,
                paddingHorizontal: 10,
                borderColor: '#6b7280',
              }}
            />
          )}
        </View>
      </View>

      <View className="mx-6 h-px bg-white/10 mb-8" />

      <View className="px-6 gap-8">
        {profileRows.map(({ label, value }) => (
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
            <View key={index} style={{ alignItems: 'center' }}>
              <Image
                source={person.img}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
              <Text style={{ marginTop: 8, fontSize: 14, color: 'white' }}>
                {person.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="px-6 gap-4 mt-5">
        <Text className="text-white text-2xl font-bold">Language</Text>

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="flex-row justify-between items-center bg-white/5 rounded-2xl px-5 py-4"
        >
          <Text className="text-white text-sm font-semibold">{language}</Text>
          <Text className="text-white/50 text-sm">▼</Text>
        </TouchableOpacity>

        <Modal visible={showPicker} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            <View
              style={{
                backgroundColor: '#18181b',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 32,
              }}
            >
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
                    onPress={() => {
                      setLanguage(item);
                      setShowPicker(false);
                    }}
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

      <View className="mx-6 h-px bg-white/10 my-8" />

      <View className="px-6 gap-8 mb-10">
        <Button
          title="Logout"
          onPress={() => {
            AsyncStorage.removeItem('name');
            setName(null);
            setUserData(null);
          }}
        />
      </View>
    </ScrollView>
  );
}
