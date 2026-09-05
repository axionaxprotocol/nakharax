"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "010101λ∑∇∂ψΩ∫≈⊕⊗0123456789ABCDEFZKPPoPCNAK";

export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check if user disabled ambient effects in localStorage
    try {
      const stored = localStorage.getItem("nakharax-matrix-ambient");
      if (stored === "false") {
        setIsEnabled(false);
      }
    } catch {
      /* ignore */
    }

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsEnabled(customEvent.detail);
    };
    window.addEventListener("nakharax-matrix-toggle", handleToggle);
    return () => window.removeEventListener("nakharax-matrix-toggle", handleToggle);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const fontSize = 14;
    let columns = Math.floor(width / (fontSize * 1.8)); // Airy, subtle density
    let drops: number[] = Array.from({ length: columns }, () => Math.random() * -60);
    // Slow, elegant ambient speeds (average ~0.28 rows/frame vs previous 1.0)
    let speeds: number[] = Array.from({ length: columns }, () => 0.18 + Math.random() * 0.22);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / (fontSize * 1.8));
      drops = Array.from({ length: columns }, () => Math.random() * -60);
      speeds = Array.from({ length: columns }, () => 0.18 + Math.random() * 0.22);
    };

    window.addEventListener("resize", handleResize);

    let lastTime = 0;
    const fpsInterval = 1000 / 24; // Throttle to 24 FPS for zero CPU/GPU overhead

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);

      if (document.hidden) return; // Freeze when tab is inactive

      const elapsed = currentTime - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = currentTime - (elapsed % fpsInterval);

      // Soft fading clear coat calibrated for gentle, slow-moving trails
      ctx.fillStyle = "rgba(2, 6, 23, 0.055)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const row = Math.floor(drops[i]);
        const x = i * fontSize * 1.8;
        const y = row * fontSize;

        if (y >= 0 && y <= height + fontSize * 2) {
          const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

          // Leading head character has bright mint glow
          ctx.fillStyle = "rgba(167, 243, 208, 0.70)";
          ctx.shadowColor = "rgba(52, 211, 153, 0.45)";
          ctx.shadowBlur = 4;
          ctx.fillText(char, x, y);

          // Body trail has soft, ethereal emerald luminescence
          ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
          ctx.shadowBlur = 0;
          ctx.fillText(char, x, y - fontSize);
        }

        if (y > height && Math.random() > 0.985) {
          drops[i] = 0;
          speeds[i] = 0.18 + Math.random() * 0.22;
        }

        drops[i] += speeds[i];
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden select-none transition-opacity duration-1000"
    >
      {/* HTML5 Canvas for Zero-Lag Matrix Stream */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-60 mix-blend-screen"
      />

      {/* Radial Vignette Mask: Darkens the center so cards & typography remain crisp and high-contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(2,6,23,0.75)_75%,_rgba(2,6,23,0.95)_100%)]" />
    </div>
  );
}
