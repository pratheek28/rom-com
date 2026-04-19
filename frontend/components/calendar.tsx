import { View, Text, TouchableOpacity } from "react-native";

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    selected?: boolean;
    dotColor?: string;
  };
};

type CalendarProps = {
  markedDates?: MarkedDates;
  onDayPress?: (date: string) => void;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentPeriod(): Date[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const daysFromGridStart = Math.floor(
    (today.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  const periodIndex = Math.floor(daysFromGridStart / 14);

  const periodStart = new Date(gridStart);
  periodStart.setDate(gridStart.getDate() + periodIndex * 14);

  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(periodStart);
    d.setDate(periodStart.getDate() + i);
    return d;
  });
}

export function Calendar({ markedDates = {}, onDayPress }: CalendarProps) {
  const days = getCurrentPeriod();
  const week1 = days.slice(0, 7);
  const week2 = days.slice(7);
  const todayStr = fmt(new Date());

  const handleDayPress = (dateStr: string) => {
    if (markedDates[dateStr]?.marked) {
      onDayPress?.(dateStr);
    }
  };

  const renderDay = (date: Date) => {
    const dateStr = fmt(date);
    const isToday = dateStr === todayStr;
    const mark = markedDates[dateStr];
    const isSelected = mark?.selected;

    return (
      <TouchableOpacity
        key={dateStr}
        onPress={() => handleDayPress(dateStr)}
        className="flex-1 items-center py-2"
      >
        <View
          className={`w-9 h-9 rounded-full items-center justify-center ${
            isSelected
              ? "bg-blue-500"
              : isToday
                ? "bg-blue-400"
                : "bg-transparent"
          }`}
        >
          <Text className="text-white">{date.getDate()}</Text>
        </View>
        {mark?.marked && (
          <View
            className="w-1.5 h-1.5 rounded-full mt-1"
            style={{ backgroundColor: mark.dotColor ?? "#e63946" }}
          />
        )}
      </TouchableOpacity>
    );
  };

  const monthLabel = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="bg-white/5 rounded-2xl py-3 w-11/12">
      <Text className="text-white text-base font-semibold text-center mb-2">
        {monthLabel}
      </Text>
      <View className="flex-row mb-1">
        {DAY_LABELS.map((label) => (
          <Text
            key={label}
            className="flex-1 text-center text-xs font-medium text-white"
          >
            {label}
          </Text>
        ))}
      </View>
      <View className="flex-row">{week1.map(renderDay)}</View>
      <View className="flex-row">{week2.map(renderDay)}</View>
    </View>
  );
}
