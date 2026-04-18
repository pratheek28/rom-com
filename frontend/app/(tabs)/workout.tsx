import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
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
} from "@/lib/poseWebMediaPipeHtml";
import {
  isWorkoutTtsConfigured,
  speakWorkoutCue,
} from "@/lib/workoutTts";

const WEBVIEW_BASE_URL = "https://expo.dev";

const SECTIONS: {
  label: string;
  items: { id: WorkoutExerciseId; title: string }[];
}[] = [
  { label: "Routine", items: [{ id: "routine", title: "routine" }] },
  {
    label: "Upper",
    items: [
      { id: "curl", title: "curl" },
      { id: "ex2", title: "ex2" },
    ],
  },
  { label: "Core", items: [{ id: "Plank", title: "Plank" }] },
  {
    label: "Lower",
    items: [
      { id: "squat", title: "squat" },
      { id: "ex3", title: "ex3" },
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
  const BREAK_SECONDS = 10;
  const [webError, setWebError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] =
    useState<WorkoutExerciseId | null>(null);
  const [breakTime, setBreakTime] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(BREAK_SECONDS);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breakOverlayAnim = useRef(new Animated.Value(0)).current;
  const breakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setBreakSecondsLeft(BREAK_SECONDS);
      return;
    }

    setBreakSecondsLeft(BREAK_SECONDS);
    const interval = setInterval(() => {
      setBreakSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [breakTime, BREAK_SECONDS]);

  useEffect(() => {
    return () => {
      if (breakTimeoutRef.current) {
        clearTimeout(breakTimeoutRef.current);
      }
    };
  }, []);

  const startExercise = useCallback(
    async (id: WorkoutExerciseId, title: string) => {
      setWebError(null);
      setSelectedExercise(id);
      const r = await speakWorkoutCue(`Starting ${title}. Let's go.`);
      if (!r.ok) {
        console.warn("[workout] start TTS:", r.error);
      }
    },
    []
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
        };
        if (data.type === "error" && data.message) {
          setWebError(data.message);
        }
        if (data.type === "repCompleted") {
          const n = data.reps ?? 0;
          const r = await speakWorkoutCue(`You have finished 1 set. Now take some rest champ!`);
          if (!r.ok) console.warn("[workout] rep TTS:", r.error);
          if (breakTimeoutRef.current) {
            clearTimeout(breakTimeoutRef.current);
          }
          setBreakSecondsLeft(BREAK_SECONDS);
          setBreakTime(true);
          breakTimeoutRef.current = setTimeout(async () => {
            setBreakTime(false);
            const d = await speakWorkoutCue(`Rest Over! Next settt`);
            if (!d.ok) console.warn("[workout] end TTS:", d.error);
            breakTimeoutRef.current = null;
          }, BREAK_SECONDS * 1000);
        }
        if (data.type === "speakRequest" && data.text) {
          const r = await speakWorkoutCue(data.text);
          if (!r.ok) console.warn("[workout] speakRequest TTS:", r.error);
        }
      } catch {
        /* ignore */
      }
    },
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.ttsDebugBar}>
        <Text style={styles.ttsDebugHint}>
          {isWorkoutTtsConfigured()
            ? ""
            : "set 11lab api key"}
        </Text>
      </View>

      {webError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{webError}</Text>
          <Pressable style={styles.button} onPress={() => setWebError(null)}>
            <Text style={styles.buttonLabel}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      {!selectedExercise ? (
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
              <View style={styles.chipRow}>
                {section.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => void startExercise(item.id, item.title)}
                  >
                    <Text style={styles.chipText}>{item.title}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Animated.View style={[styles.webWrap, { opacity: fadeAnim }]}>
          <View style={styles.toolbar}>
            <Pressable
              style={styles.backBtn}
              onPress={() => setSelectedExercise(null)}
            >
              <Text style={styles.backBtnText}>← Exercises</Text>
            </Pressable>
            <Text style={styles.toolbarTitle}>{selectedExercise}</Text>
          </View>
          <WebView
            style={styles.webview}
            originWhitelist={["*"]}
            key={selectedExercise}
            source={{
              html: getPoseWebMediaPipeHtml(selectedExercise),
              baseUrl: WEBVIEW_BASE_URL,
            }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowsFullscreenVideo={false}
            onMessage={onMessage}
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
  container: { flex: 1, backgroundColor: "#0a0a0a" },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: "#1e1e1e",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  chipPressed: { backgroundColor: "#2a2a2a" },
  chipText: { color: "#fff", fontSize: 16, fontWeight: "600" },
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
