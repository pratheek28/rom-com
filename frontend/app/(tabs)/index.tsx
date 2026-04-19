import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { Calendar } from "@/components/calendar";
import { ProgressBar } from "@/components/progress-bar";
import { ThreeDayLog } from "@/components/three-day-log";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from "@react-navigation/native";
import { WorkoutDayModal } from "@/components/workout-day-modal";



export default function HomeScreen() {
  const [hoursWorked, SetHoursWorked] = useState(-1); //For pushing
  const [hoursGoal, SetHoursGoal] = useState(-1);
    useFocusEffect(
      useCallback(() => {
      AsyncStorage.getItem('name').then(name => {
        if (name) {
          fetch("https://rom-com.onrender.com/workout-goal", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data.curr_weekly_hours);
              SetHoursWorked(data.curr_weekly_hours);
              SetHoursGoal(data.goal_weekly_hours);
            });
        }
      });
    }, [])
  )
  return (
    <View style={styles.container}>
      {hoursWorked > 0 ? <ProgressBar hoursWorked={hoursWorked} hoursGoal={hoursGoal} /> : <Text className="text-white text-xl font-semibold text-center mb-20">Loading Data...</Text>}
      <Calendar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
  },
});
