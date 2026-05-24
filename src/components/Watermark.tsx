import { useEffect, useRef } from "react";

type Props = { userLabel?: string };

/**
 * Subtle tiled watermark — only "섭리 신학" text, very faint so it doesn't
 * compete with body copy but still identifies screen captures.
 */
export function Watermark({ userLabel: _userLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setInterval(() => {
      if (ref.current) ref.current.dataset.ts = String(Date.now());
    }, 60000);
    return () => clearInterval(t);
  }, []);
  const tiles = Array.from({ length: 48 }).map((_, i) => (
    <div
      key={i}
      className="select-none whitespace-nowrap text-[12px] font-medium tracking-[0.2em] text-foreground/[0.06]"
      style={{ transform: "rotate(-26deg)" }}
    >
      섭리 신학
    </div>
  ));
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-40 grid grid-cols-4 gap-y-28 gap-x-20 overflow-hidden p-10"
      aria-hidden="true"
    >
      {tiles}
    </div>
  );
}
