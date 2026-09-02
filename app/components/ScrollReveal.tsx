"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type RevealFrom = "bottom" | "top" | "left" | "right" | "none";

type ScrollRevealProps = {
  children: ReactNode;
  from?: RevealFrom;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  repeat?: boolean;
};

export default function ScrollReveal({
  children,
  from = "bottom",
  delay = 0,
  duration = 650,
  distance = 24,
  className = "",
  repeat = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener?.("change", syncPreference);

    return () => media.removeEventListener?.("change", syncPreference);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else if (repeat) {
          setVisible(false);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "-8% 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion, repeat]);

  const offset =
    from === "left"
      ? `translate3d(-${distance}px,0,0)`
      : from === "right"
        ? `translate3d(${distance}px,0,0)`
        : from === "top"
          ? `translate3d(0,-${distance}px,0)`
          : from === "bottom"
            ? `translate3d(0,${distance}px,0)`
            : "translate3d(0,0,0)";

  const style: CSSProperties = reduceMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : offset,
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionDelay: visible ? `${delay}ms` : "0ms",
        transitionTimingFunction: "cubic-bezier(.21,.47,.32,.98)",
        willChange: "opacity, transform",
      };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
