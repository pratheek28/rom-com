import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type GoalCompletionBarProps = {
  hoursWorked: number;
  hoursGoal: number;
  streak?: number;
};

const FILL = "#7dd3fc";
const TRACK = "#3f3f46";

export function ProgressBar({
  hoursWorked,
  hoursGoal,
  streak = 12,
}: GoalCompletionBarProps) {
  const progress =
    hoursGoal > 0 ? Math.min(hoursWorked / hoursGoal, 1) : 0;
  const percent = Math.round(progress * 100);

  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceShift = useRef(new Animated.Value(14)).current;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entranceOpacity.setValue(0);
    entranceShift.setValue(14);
    fill.setValue(0);

    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entranceShift, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fill, {
        toValue: progress,
        duration: 950,
        delay: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [hoursWorked, hoursGoal, entranceOpacity, entranceShift, fill, progress]);

  const scaleX = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [0.001, 1],
  });

  return (
    <Animated.View
      style={[
        styles.weeklyWrap,
        {
          opacity: entranceOpacity,
          transform: [{ translateY: entranceShift }],
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.weeklyTitleInline}>Weekly Goal</Text>
        <MaterialCommunityIcons name="fire" size={26} color="#f97316" />
        <Text style={styles.streakText}>{streak}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fillAbsolute,
            {
              backgroundColor: FILL,
              transform: [{ scaleX }],
              transformOrigin: "left",
            },
          ]}
        />
        {percent > 10 ? (
          <View style={styles.labelOverlay} pointerEvents="none">
            <Text style={styles.labelText}>
              {hoursWorked}h / {hoursGoal}h
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  weeklyWrap: {
    width: "92%",
    maxWidth: 420,
    marginBottom: 48,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    width: "100%",
  },
  weeklyTitleInline: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  streakText: {
    color: "#fb923c",
    fontSize: 20,
    fontWeight: "700",
  },
  track: {
    width: "100%",
    height: 40,
    borderRadius: 999,
    backgroundColor: TRACK,
    overflow: "hidden",
    justifyContent: "center",
  },
  fillAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 14,
  },
  labelText: {
    color: "#0c1924",
    fontWeight: "800",
    fontSize: 14,
  },
  deltaWrap: {
    width: "100%",
    marginTop: 20,
    marginBottom: 4,
  },
  deltaSubtitle: {
    color: "#9ae6b4",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  deltaFoot: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },
  deltaTrack: {
    width: "100%",
    height: 36,
    borderRadius: 999,
    backgroundColor: TRACK,
    overflow: "hidden",
    justifyContent: "center",
  },
  weeklyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    marginBottom: 12,
  },
});

type WeeklyGoalDeltaBarProps = {
  baseHours: number;
  goalHours: number;
  addedHours: number;
};

/** Animates weekly fill from `baseHours` to `baseHours + addedHours` (clamped to goal). */
export function WeeklyGoalDeltaBar({
  baseHours,
  goalHours,
  addedHours,
}: WeeklyGoalDeltaBarProps) {
  const safeGoal = goalHours > 0 ? goalHours : 1;
  const base = Math.max(0, baseHours);
  const add = Math.max(0, addedHours);
  const startP = Math.min(base / safeGoal, 1);
  const endP = Math.min((base + add) / safeGoal, 1);

  const fill = useRef(new Animated.Value(startP)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceShift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    entranceOpacity.setValue(0);
    entranceShift.setValue(18);
    fill.setValue(startP);

    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entranceShift, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(90),
        Animated.timing(fill, {
          toValue: endP,
          duration: 1050,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [base, add, safeGoal, startP, endP, fill, entranceOpacity, entranceShift]);

  const scaleX = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [0.001, 1],
  });

  const endLabel = Math.min(base + add, safeGoal);

  return (
    <Animated.View
      style={[
        styles.deltaWrap,
        {
          opacity: entranceOpacity,
          transform: [{ translateY: entranceShift }],
        },
      ]}
    >
      <Text style={styles.weeklyTitle}>Weekly goal</Text>
      <Text style={styles.deltaSubtitle}>
        +{add.toFixed(1)} h from this session
      </Text>
      <View style={styles.deltaTrack}>
        <Animated.View
          style={[
            styles.fillAbsolute,
            {
              backgroundColor: FILL,
              transform: [{ scaleX }],
              transformOrigin: "left",
            },
          ]}
        />
      </View>
      <Text style={styles.deltaFoot}>
        {base.toFixed(1)} h → {endLabel.toFixed(1)} h /{" "}
        {goalHours > 0 ? `${goalHours} h goal` : "goal"}
      </Text>
    </Animated.View>
  );
}
