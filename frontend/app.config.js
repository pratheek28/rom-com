const path = require("path");

// Load `.env` from this app root (same folder as app.config.js). Required so
// EXPO_PUBLIC_* values are available to Metro and to `expo-constants` `extra`.
require("dotenv").config({ path: path.join(__dirname, ".env") });

/** @param {{ config: Record<string, unknown> }} ctx */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(typeof config.extra === "object" && config.extra != null
      ? config.extra
      : {}),
    EXPO_PUBLIC_ELEVENLABS_API_KEY:
      process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ?? "",
    EXPO_PUBLIC_ELEVENLABS_VOICE_ID:
      process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID ?? "zNsotODqUhvbJ5wMG7Ei",
    EXPO_PUBLIC_ELEVENLABS_MODEL_ID:
      process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5",
  },
});
