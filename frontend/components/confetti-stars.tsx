import { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type ConfettiStarsProps = {
  active: boolean;
};

const WEBVIEW_BASE = "https://expo.dev";

function buildConfettiHtml(): string {
  const defaults = JSON.stringify({
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
  });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:transparent;overflow:hidden">
<canvas id="c" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
<script>
(function(){
  var defaults = ${defaults};
  if (typeof confetti !== 'function') return;
  var canvas = document.getElementById('c');
  var myConfetti = confetti.create(canvas, { resize: true, useWorker: false });
  function shoot(){
    myConfetti(Object.assign({}, defaults, { particleCount: 40, scalar: 1.2, shapes: ['star'] }));
    myConfetti(Object.assign({}, defaults, { particleCount: 10, scalar: 0.75, shapes: ['circle'] }));
  }
  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
})();
</script>
</body></html>`;
}

export function ConfettiStars({ active }: ConfettiStarsProps) {
  const html = useMemo(() => buildConfettiHtml(), []);

  if (Platform.OS === "web") {
    return null;
  }

  if (!active) return null;

  /* Full-screen overlay without Modal so touches reach "Back to home" underneath. */
  return (
    <View
      style={styles.wrap}
      pointerEvents="none"
      collapsable={false}
    >
      <WebView
        pointerEvents="none"
        style={styles.webview}
        originWhitelist={["*"]}
        source={{ html, baseUrl: WEBVIEW_BASE }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 50,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
