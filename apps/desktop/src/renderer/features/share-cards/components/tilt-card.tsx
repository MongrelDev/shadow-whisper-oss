import { useCallback, useEffect, useRef, type ReactNode } from "react";

const EASE_OUT_QUART = "cubic-bezier(0.25, 1, 0.5, 1)";

interface TiltCardProps {
  children: ReactNode;
  maxDeg?: number;
  perspective?: number;
  lightIntensity?: number;
  borderRadius?: number;
}

/**
 * Wraps children in a 3D tilt effect that responds to mouse position.
 * Uses direct DOM manipulation to avoid re-renders during mouse tracking.
 * Respects prefers-reduced-motion.
 */
export function TiltCard({
  children,
  maxDeg = 7,
  perspective = 800,
  lightIntensity = 0.1,
  borderRadius,
}: TiltCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mql.matches;
    const cb = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion.current) return;
      const el = tiltRef.current;
      if (!el) return;

      const { left, top, width, height } = el.getBoundingClientRect();
      const nx = (e.clientX - left) / width;
      const ny = (e.clientY - top) / height;
      const rx = (0.5 - ny) * maxDeg * 2;
      const ry = (nx - 0.5) * maxDeg * 2;

      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

      if (lightRef.current) {
        lightRef.current.style.background = `radial-gradient(ellipse at ${(nx * 100).toFixed(1)}% ${(ny * 100).toFixed(1)}%, rgba(255,255,255,${lightIntensity}) 0%, transparent 65%)`;
      }
    },
    [maxDeg, lightIntensity]
  );

  const onMouseEnter = useCallback(() => {
    if (reducedMotion.current) return;
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = `transform 200ms ${EASE_OUT_QUART}`;
    el.style.willChange = "transform";
    if (lightRef.current) lightRef.current.style.opacity = "1";
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = `transform 500ms ${EASE_OUT_QUART}`;
    el.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    el.style.willChange = "";
    if (lightRef.current) lightRef.current.style.opacity = "0";
  }, []);

  return (
    <div style={{ perspective }}>
      <div
        ref={tiltRef}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          borderRadius,
          overflow: "hidden",
        }}
      >
        {children}
        <div
          ref={lightRef}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0,
            transition: `opacity 300ms ${EASE_OUT_QUART}`,
          }}
        />
      </div>
    </div>
  );
}
