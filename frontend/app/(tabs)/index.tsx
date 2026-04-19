import { StyleSheet, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { Calendar } from "@/components/calendar";
import { ProgressBar } from "@/components/progress-bar";
import { ThreeDayLog } from "@/components/three-day-log";
import { WorkoutDayModal } from "@/components/workout-day-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen() {
  const [hoursWorked, SetHoursWorked] = useState(-1);
  const [hoursGoal, SetHoursGoal] = useState(-1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("name").then((name: string | null) => {
        if (name) {
          fetch("https://rom-com.onrender.com/workout-goal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          })
            .then((response) => response.json())
            .then((data) => {
              SetHoursWorked(data.curr_weekly_hours);
              SetHoursGoal(data.goal_weekly_hours);
            })
            .catch((e) => {
              console.warn("[home] workout-goal fetch failed:", e);
              SetHoursWorked(0);
              SetHoursGoal(0);
            });
        } else {
          SetHoursWorked(-1);
          SetHoursGoal(-1);
        }
      });
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {hoursWorked >= 0 ? (
          <ProgressBar hoursWorked={hoursWorked} hoursGoal={hoursGoal} />
        ) : (
          <Text className="text-white text-xl font-semibold text-center mb-20">
            Loading Data...
          </Text>
        )}
        <Calendar
          markedDates={{
            "2026-04-18": { marked: true, dotColor: "#3b82f6" },
            "2026-04-22": { marked: true, dotColor: "#3b82f6" },
          }}
          onDayPress={(date) => setSelectedDate(date)}
        />
        <ThreeDayLog
          sessions={[
            {
              date: "Apr 18, 2026",
              duration: "52 min",
              exercises: [
                { name: "Bench Press", sets: 4 },
                { name: "Incline Dumbbell", sets: 3 },
                { name: "Cable Fly", sets: 3 },
              ],
            },
            {
              date: "Apr 22, 2026",
              duration: "45 min",
              exercises: [
                { name: "Squat", sets: 5 },
                { name: "Leg Press", sets: 4 },
                { name: "Leg Curl", sets: 3 },
              ],
            },
            {
              date: "Apr 16, 2026",
              duration: "40 min",
              exercises: [
                { name: "Pull Ups", sets: 4 },
                { name: "Barbell Row", sets: 4 },
                { name: "Lat Pulldown", sets: 3 },
              ],
            },
          ]}
        />
        <WorkoutDayModal
          date={selectedDate}
          duration="52 min"
          exercises={[
            { name: "Bench Press", sets: 4 },
            { name: "Incline Dumbbell", sets: 3 },
            { name: "Cable Fly", sets: 3 },
            { name: "Tricep Pushdown", sets: 3 },
          ]}
          onClose={() => setSelectedDate(null)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
});
