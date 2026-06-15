// Lightweight browser fingerprint — no external library.
// Combines stable browser characteristics into a SHA-256 hash.

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-ctx";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#069";
    ctx.fillText("섭리신학 fingerprint 🛡 2026", 2, 2);
    ctx.strokeStyle = "rgba(120,90,180,0.7)";
    ctx.beginPath();
    ctx.arc(50, 25, 20, 0, Math.PI * 2);
    ctx.stroke();
    return canvas.toDataURL().slice(-128);
  } catch {
    return "canvas-blocked";
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "ssr";
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() ?? "?",
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory?.toString() ?? "?",
    canvasFingerprint(),
  ];
  return await sha256(parts.join("||"));
}
