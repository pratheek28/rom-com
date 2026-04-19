import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, ScrollView } from 'react-native';
import ProfilePic from '@/components/profilepic';
import { useState, useEffect } from 'react';
import { Dropdown } from 'react-native-element-dropdown';

const data = [
  { label: 'John Doe', value: "John Doe" },
  { label: 'Jane Doe', value: "Jane Doe" },
]

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('name').then(saved => {
      if (saved) {
        setName(saved);
        getUserData(saved);
      }
    });
  }, []);

  function getUserData(name: string) { //For pushing purposes
    AsyncStorage.setItem('name', name);
    fetch('https://rom-com.onrender.com/get-user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setUserData(data);
      })
      .catch(error => console.error(error));
  }

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
              onChange={(item) => {
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
        {userData && [
          { label: 'Sex', value: userData.sex },
          { label: 'Height', value: userData.height },
          { label: 'Weight', value: userData.user_weight },
        ].map(({ label, value }) => (
          <View key={label} className="flex-row justify-between items-center bg-white/5 rounded-2xl px-5 py-4">
            <Text className="text-white/50 text-sm">{label}</Text>
            <Text className="text-white text-sm font-semibold">{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
