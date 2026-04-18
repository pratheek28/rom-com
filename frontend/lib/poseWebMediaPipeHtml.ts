/** Exercise ids used by the WebView pose script (must match workout screen). */
export type WorkoutExerciseId =
  | "routine"
  | "curl"
  | "ex2"
  | "Plank"
  | "squat"
  | "ex3";

export type WorkoutWebConfig = {
  sets: number;
  reps: number;
  breakSeconds: number;
};

const POSE_WEB_MEDIA_PIPE_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; }
    html, body { height: 100%; background: #000; overflow: hidden; }
    #wrap { position: relative; width: 100%; height: 100%; }

    video, canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
      pointer-events: none;
    }

    #status {
      position: fixed; top: 0; left: 0; right: 0; z-index: 2;
      padding: 10px 12px; text-align: center;
      font: 14px system-ui, sans-serif;
      color: #fff; background: rgba(0,0,0,0.55);
    }
    #counterHud {
      position: fixed;
      top: 56px;
      right: 12px;
      z-index: 12;
      min-width: 176px;
      border-radius: 16px;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.64);
      border: 1px solid rgba(255, 255, 255, 0.26);
      backdrop-filter: blur(6px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      font-family: system-ui, -apple-system, sans-serif;
      color: #fff;
    }
    .counterRow {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
    }
    .counterLabel {
      font-size: 11px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.78);
    }
    .counterValue {
      font-size: 30px;
      font-weight: 900;
      line-height: 1;
      color: #9ae6b4;
      text-shadow: 0 0 16px rgba(154, 230, 180, 0.38);
      font-variant-numeric: tabular-nums;
    }
    #breakBanner {
      margin-top: 8px;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      color: #ffe9c2;
      background: rgba(255, 169, 50, 0.28);
      border: 1px solid rgba(255, 186, 96, 0.45);
      display: none;
    }
    #breakBanner.active { display: block; }

    /* Temporary on-page angle debug — set DEBUG_ANGLES_ON_PAGE = false in script to disable */
    #angleDebug {
      position: fixed;
      left: 10px;
      bottom: 64px;
      z-index: 11;
      max-width: min(92vw, 320px);
      max-height: 32vh;
      overflow: auto;
      margin: 0;
      padding: 8px 10px;
      border-radius: 10px;
      font: 11px/1.35 ui-monospace, Menlo, Consolas, monospace;
      color: #e8fff4;
      background: rgba(0, 0, 0, 0.78);
      border: 1px solid rgba(154, 230, 180, 0.35);
      white-space: pre-wrap;
      word-break: break-word;
      pointer-events: none;
    }
    #angleDebug.hidden { display: none; }

    #feedback {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 2;
      padding: 12px; text-align: center;
      font: bold 16px system-ui, sans-serif;
      color: #fff; background: rgba(0,0,0,0.6);
    }

    #feedback.good { color: #00ffc8; }
    #feedback.bad  { color: #ff4f4f; }

    #repFlash {
      position: fixed;
      inset: 0;
      z-index: 15;
      pointer-events: none;
      opacity: 0;
      background:
        radial-gradient(ellipse 120% 80% at 50% 45%, rgba(0, 255, 120, 0.55) 0%, transparent 55%),
        radial-gradient(circle at 50% 50%, rgba(0, 255, 180, 0.35) 0%, transparent 50%);
      box-shadow:
        inset 0 0 80px rgba(0, 255, 140, 0.75),
        inset 0 0 160px rgba(0, 255, 100, 0.35);
    }
    #repFlash.pulse {
      animation: repGlowPulse 0.9s ease-out forwards;
    }
    @keyframes repGlowPulse {
      0%   { opacity: 0;   filter: brightness(1); }
      12%  { opacity: 1;   filter: brightness(1.15); }
      45%  { opacity: 0.85; filter: brightness(1.08); }
      100% { opacity: 0;   filter: brightness(1); }
    }
  </style>
</head>
<body>
  <div id="wrap">
    <div id="counterHud">
      <div class="counterRow">
        <span class="counterLabel">Set</span>
        <span id="setCount" class="counterValue">1/1</span>
      </div>
      <div class="counterRow">
        <span class="counterLabel">Reps</span>
        <span id="repCount" class="counterValue">0/0</span>
      </div>
    </div>
    <video id="video" playsinline autoplay muted></video>
    <canvas id="canvas"></canvas>
    <div id="repFlash" aria-hidden="true"></div>
    <pre id="angleDebug" class="hidden"></pre>
    <div id="feedback"></div>
  </div>

  <script type="module">
    const feedbackEl   = document.getElementById('feedback');
    const repFlashEl   = document.getElementById('repFlash');
    const angleDebugEl = document.getElementById('angleDebug');
    const setCountEl   = document.getElementById('setCount');
    const repCountEl   = document.getElementById('repCount');
    const video        = document.getElementById('video');
    const canvas       = document.getElementById('canvas');
    const ctx          = canvas.getContext('2d');

    const CURRENT_EXERCISE = __CURRENT_EXERCISE__;
    const WORKOUT_CONFIG = __WORKOUT_CONFIG__;
    let detectionPaused = false;

    /** Flip to false when you no longer need live angles on screen */
    const DEBUG_ANGLES_ON_PAGE = true;
    if (DEBUG_ANGLES_ON_PAGE && angleDebugEl) {
      angleDebugEl.classList.remove('hidden');
    }

    function renderCounters() {
      const currentSet = Math.min(completedSets + 1, WORKOUT_CONFIG.sets);
      setCountEl.textContent = currentSet + '/' + WORKOUT_CONFIG.sets;
      repCountEl.textContent = repCount + '/' + WORKOUT_CONFIG.reps;
    }


    // Voice: never put API keys in this page. Ask React Native to speak via ElevenLabs:
    // window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'speakRequest', text: 'Your cue' }));

    function flashRepGlow() {
      repFlashEl.classList.remove('pulse');
      void repFlashEl.offsetWidth;
      repFlashEl.classList.add('pulse');
    }

    const CONNECTIONS = [
      [11,12],[11,23],[12,24],[23,24],
      [11,13],[13,15],[12,14],[14,16],
      [15,17],[15,19],[15,21],[16,18],[16,20],[16,22],[17,19],[18,20],
      [23,25],[25,27],[27,29],[27,31],[29,31],
      [24,26],[26,28],[28,30],[28,32],[30,32],
      [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],
    ];

    function drawSkeleton(lm) {
      const { width: w, height: h } = canvas;
      const ok = (p) => p && (p.visibility == null || p.visibility >= 0.3);

      ctx.strokeStyle = 'rgba(0,255,200,0.85)';
      ctx.lineWidth = 3;
      for (const [a, b] of CONNECTIONS) {
        const pa = lm[a], pb = lm[b];
        if (!ok(pa) || !ok(pb)) continue;
        ctx.beginPath();
        ctx.moveTo(pa.x * w, pa.y * h);
        ctx.lineTo(pb.x * w, pb.y * h);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255,80,80,0.9)';
      for (const p of lm) {
        if (!ok(p)) continue;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function getAngle(a, b, c) {
      const ab = { x: a.x - b.x, y: a.y - b.y };
      const cb = { x: c.x - b.x, y: c.y - b.y };
      const dot = ab.x * cb.x + ab.y * cb.y;
      const mag = Math.sqrt(ab.x**2 + ab.y**2) * Math.sqrt(cb.x**2 + cb.y**2);
      return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
    }

    function getAngles(lm) {
      return {
        leftElbow:  getAngle(lm[11], lm[13], lm[15]),
        rightElbow: getAngle(lm[12], lm[14], lm[16]),
        leftKnee:   getAngle(lm[23], lm[25], lm[27]),
        rightKnee:  getAngle(lm[24], lm[26], lm[28]),
        leftHip:    getAngle(lm[11], lm[23], lm[25]),
        rightHip:   getAngle(lm[12], lm[24], lm[26]),
        torso:      getAngle(lm[12], lm[11], lm[23]),
      };
    }

    const EXERCISES = {
      curl:    {},
      routine: {},
      ex2:     {},
      squat:   {},
      ex3:     {},
      Plank:   { leftElbow:  { min: 150, max: 190, label: 'Left arm' }, rightElbow: { min: 150, max: 190, label: 'Right arm' } },
    };

    function checkForm(angles, exercise) {
      const rules = EXERCISES[exercise];
      if (!rules) return { good: true, text: 'OK' };
      const errors = [];
      for (const [joint, { min, max, label }] of Object.entries(rules)) {
        const angle = angles[joint];
        if (angle == null) continue;
        if (angle < min) errors.push(label + ' too tight (' + angle.toFixed(0) + '°)');
        if (angle > max) errors.push(label + ' too open (' + angle.toFixed(0) + '°)');
      }
      return {
        good: errors.length === 0,
      };
    }

    let repCount = 0;
    let completedSets = 0;
    let lastRepCount = 0;

    let curlBottom = false;
    let ex2Bottom = false;
    let squatBottom = false;
    let ex3Bottom = false;
    let routineBottom = false;
    let plankHoldMs = 0;
    renderCounters();

    function bumpRep() {
      repCount++;
      if (repCount >= WORKOUT_CONFIG.reps) {
        completedSets++;
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'setCompleted',
          reps: repCount,
          completedSets,
          totalSets: WORKOUT_CONFIG.sets,
          exercise: CURRENT_EXERCISE,
        }));

        repCount = 0;
        lastRepCount = 0;
        renderCounters();

        if (completedSets >= WORKOUT_CONFIG.sets) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'workoutCompleted',
            exercise: CURRENT_EXERCISE,
            totalSets: WORKOUT_CONFIG.sets,
            repsPerSet: WORKOUT_CONFIG.reps,
          }));
        }
      }
      renderCounters();
    }

    function countReps(angles, exercise, dtMs) {
      if (DEBUG_ANGLES_ON_PAGE && angleDebugEl) {
        const NL = String.fromCharCode(10);
        const lines = Object.entries(angles).map(([k, v]) =>
          k + ': ' + (v == null ? '—' : v.toFixed(1) + '°')
        );
        angleDebugEl.textContent =
          'exercise: ' + exercise + NL +
          'dt: ' + dtMs.toFixed(1) + ' ms' + NL +
          '---' + NL +
          lines.join(NL);
      }
      if (exercise === 'curl') {
        const a = angles.leftElbow;
        if (a == null) return;
        if (!curlBottom && a > 140) curlBottom = true;
        if (curlBottom && a < 60) { curlBottom = false; bumpRep(); }
      } else if (exercise === 'routine') {
        const a = angles.leftElbow;
        if (a == null) return;
        if (!routineBottom && a > 140) routineBottom = true;
        if (routineBottom && a < 60) { routineBottom = false; bumpRep(); }
      } else if (exercise === 'ex2') {
        const a = angles.rightElbow;
        if (a == null) return;
        if (!ex2Bottom && a > 140) ex2Bottom = true;
        if (ex2Bottom && a < 60) { ex2Bottom = false; bumpRep(); }
      } else if (exercise === 'squat') {
        const lk = angles.leftKnee, rk = angles.rightKnee;
        if (lk == null || rk == null) return;
        const avg = (lk + rk) / 2;
        if (!squatBottom && avg < 110) squatBottom = true;
        if (squatBottom && avg > 155) { squatBottom = false; bumpRep(); }
      } else if (exercise === 'ex3') {
        const lk = angles.leftKnee, rk = angles.rightKnee;
        if (lk == null || rk == null) return;
        const avg = (lk + rk) / 2;
        if (!ex3Bottom && avg < 115) ex3Bottom = true;
        if (ex3Bottom && avg > 150) { ex3Bottom = false; bumpRep(); }
      } else if (exercise === 'Plank') {
        const le = angles.leftElbow, re = angles.rightElbow;
        if (le == null || re == null) return;
        const ok = le > 150 && re > 150;
        if (ok) {
          plankHoldMs += dtMs;
          if (plankHoldMs >= 5000) {
            plankHoldMs = 0;
            bumpRep();
          }
        } else {
          plankHoldMs = 0;
        }
      }
    }

    try {
      const { PoseLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
      );


      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const MODEL_URL =
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

      let detector;
      for (const delegate of ['GPU', 'CPU']) {
        try {
          detector = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
          break;
        } catch {
          if (delegate === 'GPU');
          else throw new Error('Could not load model on GPU or CPU');
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      video.srcObject = stream;
      await new Promise((res, rej) => { video.onloadeddata = res; video.onerror = rej; });

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;

      const DETECT_EVERY_N_FRAMES = 2;
      let frameCount = 0;
      let lastTime   = -1;
      let lastPerf   = performance.now();

      function loop() {
        const now = performance.now();
        const dtMs = Math.min(80, now - lastPerf);
        lastPerf = now;
        frameCount++;

        if (detectionPaused) {
          feedbackEl.textContent = 'Recover and get ready for the next set.';
          feedbackEl.className = 'good';
          requestAnimationFrame(loop);
          return;
        }

        if (
          frameCount % DETECT_EVERY_N_FRAMES === 0 &&
          video.readyState >= 2 &&
          video.currentTime !== lastTime
        ) {
          lastTime = video.currentTime;
          const result = detector.detectForVideo(video, performance.now());
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result.landmarks?.[0]) {
            const lm = result.landmarks[0];

            drawSkeleton(lm);

            const angles = getAngles(lm);
            const form   = checkForm(angles, CURRENT_EXERCISE);
            countReps(angles, CURRENT_EXERCISE, dtMs);

            if (repCount > lastRepCount) {
              lastRepCount = repCount;
              flashRepGlow();
            }


            feedbackEl.textContent = form.text;
            feedbackEl.className = form.good ? 'good' : 'bad';

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type:     'poseData',
              angles,
              form:     form.text,
              formGood: form.good,
              reps:     repCount,
              exercise: CURRENT_EXERCISE,
            }));
          }
        }

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

    } catch (err) {
      const msg = err?.message ?? String(err);
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: msg }));
    }
  </script>
</body>
</html>`;

export function getPoseWebMediaPipeHtml(
  exerciseId: WorkoutExerciseId,
  config: WorkoutWebConfig
): string {
  return POSE_WEB_MEDIA_PIPE_HTML_TEMPLATE
    .replace("__CURRENT_EXERCISE__", JSON.stringify(exerciseId))
    .replace("__WORKOUT_CONFIG__", JSON.stringify(config));
}
