import { Calendar as RNCalendar } from "react-native-calendars";
import { View, StyleSheet } from "react-native";

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    selected?: boolean;
    selectedColor?: string;
  };
};

type CalendarProps = {
  markedDates?: MarkedDates;
};

export function Calendar({ markedDates = {} }: CalendarProps) {
  return (
    <View className="w-full p-4">
      <RNCalendar
        markedDates={markedDates}
        theme={{
          todayTextColor: "#e63946",
          selectedDayBackgroundColor: "#e63946",
          dotColor: "#e63946",
        }}
      />
    </View>
  );
}
