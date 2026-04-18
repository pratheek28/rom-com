/**
 * ElevenLabs TTS via HTTPS (no Node-only SDK).
 *
 * Keys must be prefixed with `EXPO_PUBLIC_` and live in `frontend/.env`.
 * `app.config.js` loads `.env` via dotenv and copies values into `expo.extra`;
 * we read `expo-constants` first, then fall back to `process.env` (Metro inline).
 *
 *   EXPO_PUBLIC_ELEVENLABS_API_KEY
 *   EXPO_PUBLIC_ELEVENLABS_VOICE_ID  (optional)
 *   EXPO_PUBLIC_ELEVENLABS_MODEL_ID  (optional)
 *
 * Audio is written to a temp file under `expo-file-system` cache — `expo-audio`
 * often plays `file://` MP3 more reliably than `data:` URIs on iOS.
 */
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import Constants from "expo-constants";
import {
  cacheDirectory,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system/legacy";

let lastPlayer: AudioPlayer | null = null;

type PublicEnvKey =
  | "EXPO_PUBLIC_ELEVENLABS_API_KEY"
  | "EXPO_PUBLIC_ELEVENLABS_VOICE_ID"
  | "EXPO_PUBLIC_ELEVENLABS_MODEL_ID";

function readExtra(): Record<string, string | undefined> {
  const extra = Constants.expoConfig?.extra;
  if (extra && typeof extra === "object") {
    return extra as Record<string, string | undefined>;
  }
  return {};
}

function env(key: PublicEnvKey): string | undefined {
  const fromExtra = readExtra()[key];
  if (fromExtra != null && String(fromExtra).trim() !== "") {
    return String(fromExtra).trim();
  }
  const fromProcess = process.env[key];
  if (fromProcess != null && String(fromProcess).trim() !== "") {
    return String(fromProcess).trim();
  }
  return undefined;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  // eslint-disable-next-line no-undef
  return btoa(binary);
}

export type SpeakWorkoutResult =
  | { ok: true }
  | { ok: false; error: string };

export function isWorkoutTtsConfigured(): boolean {
  return Boolean(env("EXPO_PUBLIC_ELEVENLABS_API_KEY"));
}

export async function speakWorkoutCue(text: string): Promise<SpeakWorkoutResult> {
  const apiKey = env("EXPO_PUBLIC_ELEVENLABS_API_KEY");
  const voiceId =
    env("EXPO_PUBLIC_ELEVENLABS_VOICE_ID") ?? "21m00Tcm4TlvDq8ikWAM";
  const modelId =
    env("EXPO_PUBLIC_ELEVENLABS_MODEL_ID") ?? "eleven_multilingual_v2";

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Missing EXPO_PUBLIC_ELEVENLABS_API_KEY. Add it to .env and restart Expo with a cleared cache.",
    };
  }

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
      shouldRouteThroughEarpiece: false,
    });
  } catch (e) {
    return {
      ok: false,
      error: `setAudioModeAsync: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
      }),
    });
  } catch (e) {
    return {
      ok: false,
      error: `Network: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { ok: false, error: `ElevenLabs HTTP ${res.status}: ${errText}` };
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await res.arrayBuffer();
  } catch (e) {
    return {
      ok: false,
      error: `Read body: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const bytes = new Uint8Array(arrayBuffer);
  const base64 = uint8ToBase64(bytes);

  let playUri: string;
  if (cacheDirectory) {
    const fileUri = `${cacheDirectory}tts_${Date.now()}.mp3`;
    try {
      await writeAsStringAsync(fileUri, base64, {
        encoding: EncodingType.Base64,
      });
      playUri = fileUri;
    } catch (e) {
      return {
        ok: false,
        error: `Cache write: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  } else {
    playUri = `data:audio/mpeg;base64,${base64}`;
  }

  if (lastPlayer) {
    try {
      lastPlayer.pause();
      lastPlayer.remove();
    } catch {
      /* ignore */
    }
    lastPlayer = null;
  }

  try {
    const player = createAudioPlayer(playUri, { updateInterval: 250 });
    lastPlayer = player;

    const sub = player.addListener(
      "playbackStatusUpdate",
      (status: AudioStatus) => {
        if (status.didJustFinish) {
          try {
            sub.remove();
            player.remove();
          } catch {
            /* ignore */
          }
          if (lastPlayer === player) lastPlayer = null;
        }
      }
    );

    player.play();
  } catch (e) {
    return {
      ok: false,
      error: `Playback: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  return { ok: true };
}
