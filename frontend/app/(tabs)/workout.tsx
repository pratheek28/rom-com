import React, { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { POSE_WEB_MEDIA_PIPE_HTML } from "@/lib/poseWebMediaPipeHtml";

/** Secure origin helps WebView grant getUserMedia on some Android versions. */
const WEBVIEW_BASE_URL = "https://expo.dev";

export default function WorkoutScreen() {
  const [webError, setWebError] = useState<string | null>(null);

  const onMessage = useCallback((e: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(e.nativeEvent.data) as { type?: string; message?: string };
      if (data.type === "error" && data.message) {
        setWebError(data.message);
      }
    } catch {
      /* non-JSON log lines ignored */
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}></Text>
      </View>

      {webError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{webError}</Text>
          <Pressable style={styles.button} onPress={() => setWebError(null)}>
            <Text style={styles.buttonLabel}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      <WebView
        style={styles.webview}
        originWhitelist={["*"]}
        source={{ html: POSE_WEB_MEDIA_PIPE_HTML, baseUrl: WEBVIEW_BASE_URL }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowsFullscreenVideo={false}
        onMessage={onMessage}
        onError={(e) =>
          setWebError(e.nativeEvent.description ?? "Camera Error")
        }
        onHttpError={(e) =>
          setWebError(`HTTP ${e.nativeEvent.statusCode}: ${e.nativeEvent.description}`)
        }
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: "#111",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  bannerSub: {
    color: "#bbb",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  webview: { flex: 1, backgroundColor: "#000" },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111",
  },
  footerText: { color: "#888", fontSize: 11, lineHeight: 15 },
  link: { color: "#6af", textDecorationLine: "underline" },
  errorBox: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 120,
    zIndex: 10,
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
