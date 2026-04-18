export const POSE_WEB_MEDIA_PIPE_HTML = `<!DOCTYPE html>
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

    #feedback {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 2;
      padding: 12px; text-align: center;
      font: bold 16px system-ui, sans-serif;
      color: #fff; background: rgba(0,0,0,0.6);
    }

    #feedback.good { color: #00ffc8; }
    #feedback.bad  { color: #ff4f4f; }

    /* Full-screen green glow when rep count increases */
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
    <div id="status">Starting camera…</div>
    <video id="video" playsinline autoplay muted></video>
    <canvas id="canvas"></canvas>
    <div id="repFlash" aria-hidden="true"></div>
    <div id="feedback"></div>
  </div>

  <script type="module">
    const statusEl     = document.getElementById('status');
    const feedbackEl = document.getElementById('feedback');
    const repFlashEl   = document.getElementById('repFlash');
    const video        = document.getElementById('video');
    const canvas       = document.getElementById('canvas');
    const ctx          = canvas.getContext('2d');

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
      Curl: {
        leftElbow: { min: 60, max: 100, label: 'Left elbow' },
      },
    };

    function checkForm(angles, exercise) {
      const rules = EXERCISES[exercise];
      if (!rules) return { good: true, text: 'OK' };
      const errors = [];
      for (const [joint, { min, max, label }] of Object.entries(rules)) {
        const angle = angles[joint];
        if (angle == null) continue;
        // if (angle < min) errors.push(label + ' too bent (' + angle.toFixed(0) + '°)');
        // if (angle > max) errors.push(label + ' too straight (' + angle.toFixed(0) + '°)');
      }
      return {
        good: errors.length === 0,
      };
    }

    let repCount = 0;
    let lastRepCount = 0;
    let inBottom = false;

    function countReps(angles, exercise) {
      if (exercise === 'Curl') {
        const angle = angles.leftElbow;
        if (angle == null) return;

        if (!inBottom && angle > 140) {
          inBottom = true;
        }
        if (inBottom && angle < 60) {
          inBottom = false;
          repCount++;
        }
      }
    }

    const CURRENT_EXERCISE = 'Curl';

    try {
      const { PoseLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
      );

      statusEl.textContent = 'Loading model…';

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
          if (delegate === 'GPU') statusEl.textContent = 'GPU unavailable, using CPU…';
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

      function loop() {
        frameCount++;

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
            countReps(angles, CURRENT_EXERCISE);

            if (repCount > lastRepCount) {
              lastRepCount = repCount;
              flashRepGlow();
            }

            statusEl.textContent = 'Reps: ' + repCount;

            feedbackEl.textContent = form.text;
            feedbackEl.className = form.good ? 'good' : 'bad';

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type:     'poseData',
              angles,
              form:     form.text,
              formGood: form.good,
              reps:     repCount,
            }));
          }
        }

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

    } catch (err) {
      const msg = err?.message ?? String(err);
      statusEl.textContent = 'Error: ' + msg;
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: msg }));
    }
  </script>
</body>
</html>`;
