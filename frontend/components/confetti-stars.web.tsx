import { useEffect, useRef } from "react";

type ConfettiStarsProps = {
  active: boolean;
};

export function ConfettiStars({ active }: ConfettiStarsProps) {
  const firedForSession = useRef(false);

  useEffect(() => {
    if (!active) {
      firedForSession.current = false;
      return;
    }
    if (firedForSession.current) return;
    firedForSession.current = true;

    let cancelled = false;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;

      const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
      };

      const shoot = () => {
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ["star"],
        });

        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ["circle"],
        });
      };

      setTimeout(shoot, 0);
      setTimeout(shoot, 100);
      setTimeout(shoot, 200);
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  return null;
}
