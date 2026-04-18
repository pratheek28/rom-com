import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/calendar";
import { ProgressBar } from "@/components/progress-bar";
import { ThreeDayLog } from "@/components/three-day-log";
export default function HomeScreen() {
  const [hoursWorked, SetHoursWorked] = useState(-1);
  const [hoursGoal, SetHoursGoal] = useState(-1);
    useEffect(() => {
    try {
      fetch("http://127.0.0.1:8000/workout-goal", {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data.curr_weekly_hours);
          SetHoursWorked(data.curr_weekly_hours);
          SetHoursGoal(data.goal_weekly_hours);
        });
    } catch (e) {
      console.log(e);
    }
  });
  return (
    <View style={styles.container}>
      <ProgressBar
        hoursWorked={hoursWorked}
        hoursGoal={hoursGoal}
      />
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
