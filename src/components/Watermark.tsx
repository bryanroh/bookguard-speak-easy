import { useEffect, useState } from "react";

type Props = { userLabel?: string };

function formatNow(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()} / ${pad(d.getMonth() + 1)}.${pad(d.getDate())} / ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Forensic watermark — diagonal tiled pattern showing the institute name,
 * the signed-in user's email, and the current timestamp. Rendered almost
 * fully transparent so it stays out of the way of reading, but camera
 * sensors and screenshots still pick it up.
 */
export function Watermark({ userLabel }: Props) {
  const [now, setNow] = useState(() => formatNow(new Date()));
  useEffect(() => {
    const t = setInterval(() => setNow(formatNow(new Date())), 30_000);
    return () => clearInterval(t);
  }, []);

  // userLabel from the reader is "<email> • <uid8>". Strip the uid tail so
  // the watermark only carries the email.
  const email = (userLabel ?? "").split("•")[0]?.trim() || "guest";
  const line = `섭리 신학연구소 / ${email} / ${now} / 웹북 콘텐츠는 섭리 신학연구소`;

  const tiles = Array.from({ length: 60 });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 grid grid-cols-3 gap-y-24 gap-x-10 overflow-hidden p-8"
      aria-hidden="true"
    >
      {tiles.map((_, i) => (
        <div
          key={i}
          className="select-none whitespace-nowrap text-[11px] font-medium tracking-[0.18em] text-foreground/[0.07]"
          style={{ transform: "rotate(-26deg)" }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
