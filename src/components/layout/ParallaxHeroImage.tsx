import { useEffect, useRef, useState } from "react";

interface ParallaxHeroImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** Parallax intensity in px translated per viewport scroll. Default 80. */
  intensity?: number;
}

/**
 * Background image with a subtle vertical parallax tied to scroll position.
 * Respects prefers-reduced-motion. Designed to sit absolute inside an
 * `relative isolate overflow-hidden` hero section.
 */
export function ParallaxHeroImage({
  src,
  alt = "",
  className = "",
  intensity = 80,
}: ParallaxHeroImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // Progress from -1 (above) to 1 (below) as section moves through viewport
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const clamped = Math.max(-1, Math.min(1, progress));
        setOffset(clamped * intensity);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [intensity, reduced]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <img
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        className={
          "absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover object-center will-change-transform " +
          className
        }
        style={{
          transform: `translate3d(0, ${offset}px, 0)`,
          transition: reduced ? undefined : "transform 80ms linear",
        }}
      />
    </div>
  );
}

export default ParallaxHeroImage;
