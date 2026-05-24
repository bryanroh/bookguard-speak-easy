import { useEffect, useRef } from "react";

type Props = { userLabel: string };

/** Tiled watermark overlay. Non-interactive (pointer-events:none) but rendered on top of content. */
export function Watermark({ userLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Refresh time-based watermark every 30s
    const t = setInterval(() => {
      if (ref.current) ref.current.dataset.ts = new Date().toLocaleString();
    }, 30000);
    return () => clearInterval(t);
  }, []);
  const time = new Date().toLocaleString();
  const line = `섭리 신학  •  ${userLabel}  •  ${time}`;
  const tile = Array.from({ length: 60 }).map((_, i) => (
    <div key={i} className="select-none whitespace-nowrap text-[11px] font-medium tracking-wider text-foreground/15"
      style={{ transform: "rotate(-28deg)" }}>
      {line}
    </div>
  ));
  return (
    <div ref={ref}
      className="pointer-events-none fixed inset-0 z-40 grid grid-cols-3 gap-y-24 gap-x-16 overflow-hidden p-10"
      aria-hidden="true">
      {tile}
    </div>
  );
}
