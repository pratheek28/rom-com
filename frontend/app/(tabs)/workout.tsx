import React, { useEffect } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function WorkoutScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (permission == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>
          Camera access is needed to show the workout preview.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => void requestPermission()}
        >
          <Text style={styles.buttonLabel}>Allow camera</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondary]}
          onPress={() => void Linking.openSettings()}
        >
          <Text style={styles.buttonLabel}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: StyleSheet.absoluteFillObject,
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: { fontSize: 16 },
  permission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondary: {
    backgroundColor: "#444",
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
