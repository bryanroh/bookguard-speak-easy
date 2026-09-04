import { useEffect, useState } from "react";

type Props = { userLabel?: string };

function formatNow(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()} / ${pad(d.getMonth() + 1)}.${pad(d.getDate())} / ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Forensic watermark — kept OFF the reading column. The identifying line is
 * repeated along the page edges (top, bottom, left and right gutters) so the
 * body text stays clean while any photo or screenshot still captures who was
 * viewing the content and when.
 */
export function Watermark({ userLabel }: Props) {
  const [now, setNow] = useState(() => formatNow(new Date()));
  useEffect(() => {
    const t = setInterval(() => setNow(formatNow(new Date())), 30_000);
    return () => clearInterval(t);
  }, []);

  const email = (userLabel ?? "").split("•")[0]?.trim() || "guest";
  const line = `섭리 신학연구소 / ${email} / ${now}`;
  const strip = Array.from({ length: 6 }).map(() => line).join("   ·   ");

  const edge =
    "select-none whitespace-nowrap text-[10px] font-medium tracking-[0.22em] text-foreground/[0.12]";

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* top / bottom edges */}
      <div className={`absolute inset-x-0 top-1 overflow-hidden text-center ${edge}`}>{strip}</div>
      <div className={`absolute inset-x-0 bottom-1 overflow-hidden text-center ${edge}`}>{strip}</div>

      {/* left / right gutters (vertical) */}
      <div
        className={`absolute left-1 top-1/2 origin-center ${edge}`}
        style={{ transform: "translate(-50%, -50%) rotate(-90deg)" }}
      >
        {strip}
      </div>
      <div
        className={`absolute right-1 top-1/2 origin-center ${edge}`}
        style={{ transform: "translate(50%, -50%) rotate(90deg)" }}
      >
        {strip}
      </div>
    </div>
  );
}
