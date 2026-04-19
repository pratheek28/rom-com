import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { WebView } from "react-native-webview";

import {
  getPoseWebMediaPipeHtml,
  type WorkoutExerciseId,
  type WorkoutWebConfig,
} from "@/lib/poseWebMediaPipeHtml";
import { ConfettiStars } from "@/components/confetti-stars";
import { WeeklyGoalDeltaBar } from "@/components/progress-bar";
import {
  isWorkoutTtsConfigured,
  speakWorkoutCue,
} from "@/lib/workoutTts";

const WEBVIEW_BASE_URL = "https://expo.dev";
const WORKOUT_GOAL_URL =
  process.env.EXPO_PUBLIC_WORKOUT_GOAL_URL ??
  "https://rom-com.onrender.com/workout-goal";

function formatSessionClock(durationMs: number): string {
  const totalSec = Math.max(0, Math.floor(durationMs / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function msToHoursOneDecimal(durationMs: number): number {
  const h = durationMs / 3600000;
  return Math.round(h * 10) / 10;
}
const EXERCISE_GIF = require("../../assets/images/curl.gif");
const SQUAT_GIF = require("../../assets/images/squat.gif");

const DEFAULT_WORKOUT_CONFIG = {
  sets: 3,
  reps: 10,
  breakSeconds: 10,
};

type WorkoutConfig = WorkoutWebConfig;

type ExerciseItem = {
  id: WorkoutExerciseId;
  title: string;
  description: string;
  gif: number;
};

type WorkoutSummary = {
  exerciseTitle: string;
  sets: number;
  reps: number;
  breakSeconds: number;
  durationMs: number;
};

const SECTIONS: {
  label: string;
  items: ExerciseItem[];
}[] = [
  {
    label: "Routine", 
    items: [
      {
        id: "routine",
        title: "routine",
        description: "A guided full-body sequence with tempo coaching.",
        gif: EXERCISE_GIF,
      },
    ],
  },
  {
    label: "Upper",
    items: [
      {
        id: "curl",
        title: "curl",
        description: "Focuses on controlled bicep contraction each rep.",
        gif: EXERCISE_GIF,
      },
      {
        id: "ex2",
        title: "ex2",
        description: "Upper-body accessory movement for added volume.",
        gif: EXERCISE_GIF,
      },
      {
        id: "lateral_raise",
        title: "Lateral Raise",
        description: "Raise arms out to sides to shoulder height, controlled descent.",
        gif: EXERCISE_GIF,
      },
    ],
  },
  {
    label: "Core",
    items: [
      {
        id: "Plank",
        title: "Plank",
        description: "Build core stability while maintaining a neutral spine.",
        gif: EXERCISE_GIF,
      },
    ],
  },
  {
    label: "Lower",
    items: [
      {
        id: "squat",
        title: "squat",
        description: "Strengthens glutes and quads with strict depth control.",
        gif: SQUAT_GIF,
      },
      {
        id: "ex3",
        title: "ex3",
        description: "Lower-body support movement for balanced training.",
        gif: EXERCISE_GIF,
      },
    ],
  },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutScreen() {
  const [webError, setWebError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] =
    useState<WorkoutExerciseId | null>(null);
  const [previewExercise, setPreviewExercise] = useState<ExerciseItem | null>(
    null
  );
  const [activeExerciseTitle, setActiveExerciseTitle] = useState("");
  const [activeConfig, setActiveConfig] = useState<WorkoutConfig>(
    DEFAULT_WORKOUT_CONFIG
  );
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(
    null
  );
  const [breakTime, setBreakTime] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(
    DEFAULT_WORKOUT_CONFIG.breakSeconds
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breakOverlayAnim = useRef(new Animated.Value(0)).current;
  const breakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<WebView | null>(null);
  const breakTimeRef = useRef(false);
  breakTimeRef.current = breakTime;
  const workoutStartedAtRef = useRef<number | null>(null);

  const [weeklySnapshot, setWeeklySnapshot] = useState<{
    curr: number;
    goal: number;
  } | null>(null);

  useEffect(() => {
    if (selectedExercise) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedExercise, fadeAnim]);

  useEffect(() => {
    Animated.timing(breakOverlayAnim, {
      toValue: breakTime ? 1 : 0,
      duration: breakTime ? 320 : 260,
      useNativeDriver: true,
    }).start();
  }, [breakTime, breakOverlayAnim]);

  useEffect(() => {
    if (!breakTime) {
      setBreakSecondsLeft(activeConfig.breakSeconds);
      return;
    }

    setBreakSecondsLeft(activeConfig.breakSeconds);
    const interval = setInterval(() => {
      setBreakSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [breakTime, activeConfig.breakSeconds]);

  useEffect(() => {
    if (!selectedExercise || !webViewRef.current) return;
    const payload = JSON.stringify({
      type: "breakState",
      active: breakTimeRef.current,
    });
    const id = requestAnimationFrame(() => {
      webViewRef.current?.postMessage(payload);
    });
    return () => cancelAnimationFrame(id);
  }, [breakTime, selectedExercise]);

  useEffect(() => {
    return () => {
      if (breakTimeoutRef.current) {
        clearTimeout(breakTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!workoutSummary) {
      setWeeklySnapshot(null);
      return;
    }
    let cancelled = false;
    fetch(WORKOUT_GOAL_URL, { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{
          curr_weekly_hours: number;
          goal_weekly_hours: number;
        }>;
      })
      .then((d) => {
        if (!cancelled) {
          setWeeklySnapshot({
            curr: d.curr_weekly_hours,
            goal: d.goal_weekly_hours,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setWeeklySnapshot({ curr: 0, goal: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [workoutSummary]);

  const openExercisePreview = useCallback((item: ExerciseItem) => {
    setPreviewExercise(item);
    setActiveConfig(DEFAULT_WORKOUT_CONFIG);
  }, []);

  const resetToHome = useCallback(() => {
    setBreakTime(false);
    setBreakSecondsLeft(DEFAULT_WORKOUT_CONFIG.breakSeconds);
    setSelectedExercise(null);
    setPreviewExercise(null);
    setWorkoutSummary(null);
    setActiveExerciseTitle("");
    workoutStartedAtRef.current = null;
    if (breakTimeoutRef.current) {
      clearTimeout(breakTimeoutRef.current);
      breakTimeoutRef.current = null;
    }
  }, []);

  const startExercise = useCallback(
    async (exercise: ExerciseItem) => {
      setWebError(null);
      setWorkoutSummary(null);
      workoutStartedAtRef.current = Date.now();
      setPreviewExercise(null);
      setSelectedExercise(exercise.id);
      setActiveExerciseTitle(exercise.title);
      const r = await speakWorkoutCue(
        `Starting ${exercise.title}. ${activeConfig.sets} sets, ${activeConfig.reps} reps each. Let's go.`
      );
      if (!r.ok) {
        console.warn("[workout] start TTS:", r.error);
      }
    },
    [activeConfig]
  );

  const onMessage = useCallback(
    async (e: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(e.nativeEvent.data) as {
          type?: string;
          message?: string;
          reps?: number;
          exercise?: string;
          text?: string;
          completedSets?: number;
          totalSets?: number;
          repsPerSet?: number;
        };
        if (data.type === "error" && data.message) {
          setWebError(data.message);
        }
        if (data.type === "setCompleted") {
          const isWorkoutDone =
            (data.completedSets ?? 0) >= (data.totalSets ?? activeConfig.sets);
          const r = await speakWorkoutCue(
            isWorkoutDone
              ? "Workout complete. Amazing job."
              : `Set ${data.completedSets ?? 1} complete. Now take some rest champ!`
          );
          if (!r.ok) console.warn("[workout] rep TTS:", r.error);
          if (isWorkoutDone) {
            setBreakTime(false);
            if (breakTimeoutRef.current) {
              clearTimeout(breakTimeoutRef.current);
              breakTimeoutRef.current = null;
            }
            return;
          }
          if (breakTimeoutRef.current) {
            clearTimeout(breakTimeoutRef.current);
          }
          setBreakSecondsLeft(activeConfig.breakSeconds);
          setBreakTime(true);
          breakTimeoutRef.current = setTimeout(async () => {
            setBreakTime(false);
            const d = await speakWorkoutCue(`Rest Over! Next set`);
            if (!d.ok) console.warn("[workout] end TTS:", d.error);
            breakTimeoutRef.current = null;
          }, activeConfig.breakSeconds * 1000);
        }
        if (data.type === "workoutCompleted") {
          setBreakTime(false);
          if (breakTimeoutRef.current) {
            clearTimeout(breakTimeoutRef.current);
            breakTimeoutRef.current = null;
          }
          const started = workoutStartedAtRef.current;
          const durationMs =
            started != null ? Math.max(0, Date.now() - started) : 0;
          workoutStartedAtRef.current = null;
          setSelectedExercise(null);
          setPreviewExercise(null);
          setWorkoutSummary({
            exerciseTitle: activeExerciseTitle || "Exercise",
            sets: data.totalSets ?? activeConfig.sets,
            reps: data.repsPerSet ?? activeConfig.reps,
            breakSeconds: activeConfig.breakSeconds,
            durationMs,
          });
        }
        if (data.type === "speakRequest" && data.text) {
          const r = await speakWorkoutCue(data.text);
          if (!r.ok) console.warn("[workout] speakRequest TTS:", r.error);
        }
      } catch {
        /* ignore */
      }
    },
    [
      activeConfig.breakSeconds,
      activeConfig.reps,
      activeConfig.sets,
      activeExerciseTitle,
    ]
  );

  return (
    <View style={styles.container}>

      {webError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{webError}</Text>
          <Pressable style={styles.button} onPress={() => setWebError(null)}>
            <Text style={styles.buttonLabel}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      {workoutSummary ? (
        <View
      style={{
        flex: 1,
        position: "relative",
        backgroundColor: "#0B0B0B",
        justifyContent: "space-between",
        padding: 24,
      }}
    >
      <ConfettiStars active />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "600",
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          Workout Complete
        </Text>

        <Text
          style={{
            fontSize: 20,
            color: "#CCCCCC",
            marginBottom: 12,
          }}
        >
          {workoutSummary.exerciseTitle}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#888888",
            marginBottom: 8,
          }}
        >
          Nice work.
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: "#bbbbbb",
            marginBottom: 16,
          }}
        >
+{formatSessionClock(workoutSummary.durationMs)} toward your weekly goal
        </Text>

        {weeklySnapshot ? (
          <WeeklyGoalDeltaBar
            baseHours={weeklySnapshot.curr}
            goalHours={weeklySnapshot.goal}
            addedHours={msToHoursOneDecimal(workoutSummary.durationMs)}
          />
        ) : (
          <Text
            style={{
              color: "#666",
              fontSize: 13,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Loading weekly goal…
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              {workoutSummary.sets}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#888888",
                marginTop: 4,
              }}
            >
              Sets
            </Text>
          </View>

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              {workoutSummary.reps}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#888888",
                marginTop: 4,
              }}
            >
              Reps
            </Text>
          </View>

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              {workoutSummary.breakSeconds}s
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#888888",
                marginTop: 4,
              }}
            >
              Break
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={resetToHome}
        style={{
          backgroundColor: "#FFFFFF",
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <Text
          style={{
            color: "#000000",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Finish
        </Text>
      </Pressable>
    </View>
      ) : !selectedExercise && !previewExercise ? (
        <ScrollView
          style={styles.pickerScroll}
          contentContainerStyle={styles.pickerContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Choose exercise</Text>
          {!isWorkoutTtsConfigured() ? (
            <Text style={styles.hint}>
              Add api key
            </Text>
          ) : null}

          {SECTIONS.map((section) => (
            <View key={section.label} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exerciseRowContent}
              >
                {section.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.exerciseCard,
                      pressed && styles.exerciseCardPressed,
                    ]}
                    onPress={() => openExercisePreview(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${item.title}`}
                  >
                    <Image source={item.gif} style={styles.exerciseGif} />
                    <Text style={styles.exerciseName}>{item.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      ) : previewExercise ? (
        <View style={styles.confirmWrap}>
          <Pressable
            style={styles.backBtn}
            onPress={() => setPreviewExercise(null)}
          >
            <Text style={styles.backBtnText}>← Back to exercises</Text>
          </Pressable>
          <ScrollView
            style={styles.confirmScroll}
            contentContainerStyle={styles.confirmContent}
            showsVerticalScrollIndicator={false}
          >
            <Image source={previewExercise.gif} style={styles.confirmGif} />
            <Text style={styles.confirmTitle}>{previewExercise.title}</Text>
            <Text style={styles.confirmDescription}>
              {previewExercise.description}
            </Text>

            <View style={styles.configCard}>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Sets</Text>
                <View style={styles.stepperControls}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setActiveConfig((prev) => ({
                        ...prev,
                        sets: Math.max(1, prev.sets - 1),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Decrease sets"
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{activeConfig.sets}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setActiveConfig((prev) => ({
                        ...prev,
                        sets: Math.min(20, prev.sets + 1),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Increase sets"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Reps</Text>
                <View style={styles.stepperControls}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setActiveConfig((prev) => ({
                        ...prev,
                        reps: Math.max(1, prev.reps - 1),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Decrease reps"
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{activeConfig.reps}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setActiveConfig((prev) => ({
                        ...prev,
                        reps: Math.min(200, prev.reps + 1),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Increase reps"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Break (sec)</Text>
                <View style={styles.stepperControls}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setActiveConfig((prev) => ({
                        ...prev,
                        breakSeconds: Math.max(0, prev.breakSeconds - 5),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Decrease break time"
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>
                    {activeConfig.breakSeconds}
                  </Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      setActiveConfig((prev) => ({
                        ...prev,
                        breakSeconds: Math.min(600, prev.breakSeconds + 5),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Increase break time"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.confirmFooter}>
            <Pressable
              style={styles.startButton}
              onPress={() => void startExercise(previewExercise)}
            >
              <Text style={styles.startButtonText}>START</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Animated.View style={[styles.webWrap, { opacity: fadeAnim }]}>
          <View style={styles.toolbar}>
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                workoutStartedAtRef.current = null;
                setSelectedExercise(null);
                setPreviewExercise(null);
              }}
            >
              <Text style={styles.backBtnText}>← Exercises</Text>
            </Pressable>
            <Text style={styles.toolbarTitle}>{activeExerciseTitle}</Text>
          </View>
          <WebView
            ref={webViewRef}
            style={styles.webview}
            originWhitelist={["*"]}
            key={selectedExercise ?? "none"}
            source={{
              html: getPoseWebMediaPipeHtml(selectedExercise!, activeConfig),
              baseUrl: WEBVIEW_BASE_URL,
            }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowsFullscreenVideo={false}
            onMessage={onMessage}
            onLoadEnd={() => {
              webViewRef.current?.postMessage(
                JSON.stringify({
                  type: "breakState",
                  active: breakTimeRef.current,
                })
              );
            }}
            onError={(ev) =>
              setWebError(ev.nativeEvent.description ?? "WebView error")
            }
            onHttpError={(ev) =>
              setWebError(
                `HTTP ${ev.nativeEvent.statusCode}: ${ev.nativeEvent.description}`
              )
            }
          />
          <Animated.View
            pointerEvents={breakTime ? "auto" : "none"}
            style={[
              styles.breakOverlayWrap,
              {
                opacity: breakOverlayAnim,
              },
            ]}
          >
            <BlurView intensity={55} tint="dark" style={styles.breakOverlayBlur}>
              <View style={styles.breakOverlayCard}>
                <Text style={styles.breakTitle}>Take a break</Text>
                <Text style={styles.breakSubtitle}>
                  Recover for a few seconds, then continue.
                </Text>
                <Text style={styles.breakTimer}>{breakSecondsLeft}s</Text>
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", marginTop: 20, paddingTop: 30 },
  summaryWrap: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2f3d33",
    backgroundColor: "#111713",
    padding: 22,
    gap: 14,
  },
  summaryEyebrow: {
    color: "#9ae6b4",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  summarySubtitle: {
    color: "#bcc7bf",
    fontSize: 15,
    lineHeight: 22,
  },
  summaryStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  summaryStat: {
    flex: 1,
    backgroundColor: "#1a221c",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
  },
  summaryStatValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  summaryStatLabel: {
    color: "#97a19a",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  homeButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#9ae6b4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  homeButtonText: {
    color: "#0c2814",
    fontSize: 18,
    fontWeight: "900",
  },
  ttsDebugBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#151515",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    gap: 6,
  },
  ttsTestBtn: {
    backgroundColor: "#1a5c38",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  ttsTestBtnDisabled: { opacity: 0.65 },
  ttsTestBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  ttsDebugHint: { color: "#777", fontSize: 11, lineHeight: 15 },
  pickerScroll: { flex: 1 },
  pickerContent: { padding: 20, paddingBottom: 40 },
  screenTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  hint: {
    color: "#888",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 20,
  },
  section: { marginBottom: 22 },
  sectionLabel: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  exerciseRowContent: { flexDirection: "row", gap: 12, paddingRight: 8 },
  exerciseCard: {
    width: 96,
    backgroundColor: "#1e1e1e",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    gap: 8,
  },
  exerciseCardPressed: { backgroundColor: "#2a2a2a" },
  exerciseGif: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  exerciseName: { color: "#fff", fontSize: 13, fontWeight: "700" },
  confirmWrap: { flex: 1, backgroundColor: "#0a0a0a" },
  confirmScroll: { flex: 1 },
  confirmContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12,
  },
  confirmGif: {
    width: "100%",
    height: 280,
    borderRadius: 26,
    marginTop: 8,
  },
  confirmTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  confirmDescription: {
    color: "#b9b9b9",
    fontSize: 15,
    lineHeight: 22,
  },
  configCard: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    marginTop: 10,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stepperLabel: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "800",
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3c3c3c",
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 26,
  },
  stepperValue: {
    minWidth: 44,
    textAlign: "center",
    color: "#9ae6b4",
    fontSize: 18,
    fontWeight: "900",
  },
  confirmFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#0a0a0a",
  },
  startButton: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#9ae6b4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  startButtonText: {
    color: "#0c2814",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  webWrap: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111",
    gap: 12,
  },
  backBtn: { paddingVertical: 6, paddingRight: 8 },
  backBtnText: { color: "#6cf", fontSize: 16, fontWeight: "600" },
  toolbarTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  webview: { flex: 1, backgroundColor: "#000" },
  breakOverlayWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  breakOverlayBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 24,
  },
  breakOverlayCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(18,18,18,0.35)",
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
  },
  breakTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  breakSubtitle: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  breakTimer: {
    color: "#9ae6b4",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#111",
  },
  footerText: { color: "#777", fontSize: 11 },
  link: { color: "#6af", textDecorationLine: "underline" },
  errorBox: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 150,
    zIndex: 20,
    backgroundColor: "#3a1515",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  errorText: { color: "#fcc", fontSize: 13 },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#444",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonLabel: { color: "#fff", fontWeight: "600" },
});
