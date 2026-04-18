import { StyleSheet, View } from 'react-native';
import { Calendar } from "@/components/calendar";
import { ProgressBar } from "@/components/progress-bar"
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ProgressBar goalName='Road to Recovery' hoursWorked={70} hoursGoal={100}/>
      <Calendar/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
  },
});
