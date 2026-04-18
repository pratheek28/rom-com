import { StyleSheet, View, Text} from "react-native";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/calendar";
import { ProgressBar } from "@/components/progress-bar";
import { ThreeDayLog } from "@/components/three-day-log";
export default function HomeScreen() {
  const [hoursWorked, SetHoursWorked] = useState(-1);
  const [hoursGoal, SetHoursGoal] = useState(-1);
<<<<<<< HEAD
  useEffect(() => {
    const url =
      process.env.EXPO_PUBLIC_WORKOUT_GOAL_URL ??
      "http://127.0.0.1:8000/workout-goal";

    fetch(url, { method: "POST" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
=======
    useEffect(() => {
    try {
      fetch("https://rom-com.onrender.com/workout-goal", {
        method: "POST",
>>>>>>> 40b664826bed87ed57aef72cc8e60f51c38aec02
      })
      .then((data) => {
        SetHoursWorked(data.curr_weekly_hours);
        SetHoursGoal(data.goal_weekly_hours);
      })
      .catch((e) => {
        console.warn("[home] workout-goal fetch failed:", e);
        SetHoursWorked(0);
        SetHoursGoal(0);
      });
  }, []);
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
