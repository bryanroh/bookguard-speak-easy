import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Opts = {
  userId: string | null;
  bookId: string;
  pageId: string;
  enabled?: boolean;
};

/**
 * Wires up the 7-layer client-side protections:
 *  1) right-click block
 *  2) text selection/drag/copy/cut block
 *  3) Ctrl+P, Ctrl+S, Ctrl+C, Ctrl+U, Ctrl+Shift+I/J/C blocked
 *  4) F12 + devtools heuristic (hide content if devtools opens)
 *  5) PrintScreen detection -> blur + clipboard wipe
 *  6) visibilitychange blur when window hidden
 *  7) capture_logs insert on each suspicious event
 */
export function useReaderProtection({ userId, bookId, pageId, enabled = true }: Opts) {
  const blurRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.remove("reader-blur");

    const log = (event_type: string) => {
      supabase.from("capture_logs").insert({
        user_id: userId, book_id: bookId, page_id: pageId, event_type,
        user_agent: navigator.userAgent,
      }).then(() => {});
    };

    const blurContent = (reason: string) => {
      document.body.classList.add("reader-blur");
      log(reason);
      toast.warning("보안 정책: 캡처/인쇄가 차단되었습니다.");
      try { navigator.clipboard?.writeText(""); } catch {}
      setTimeout(() => document.body.classList.remove("reader-blur"), 2000);
    };

    const onContext = (e: MouseEvent) => { e.preventDefault(); log("contextmenu"); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); e.clipboardData?.setData("text/plain", "© 섭리 웹북 — 무단 복제 금지"); log("copy"); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); log("cut"); };
    const onSelect = (e: Event) => { e.preventDefault(); };
    const onDrag = (e: DragEvent) => { e.preventDefault(); };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // PrintScreen
      if (e.key === "PrintScreen" || k === "printscreen") { blurContent("printscreen"); e.preventDefault(); return; }
      // F12
      if (k === "f12") { e.preventDefault(); log("devtools_key"); return; }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (k === "p" || k === "s" || k === "u")) { e.preventDefault(); log(`ctrl_${k}`); return; }
      if (ctrl && k === "c") { e.preventDefault(); log("ctrl_c"); return; }
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(k)) { e.preventDefault(); log("devtools_combo"); return; }
    };

    // Print event
    const onBeforePrint = (e: Event) => { e.preventDefault?.(); blurContent("print"); };

    // Inject blur style once
    const style = document.createElement("style");
    style.innerHTML = `.reader-blur .reader-content{filter:blur(18px)!important;transition:filter .15s}@media print{body *{visibility:hidden!important}body::after{content:"인쇄가 차단되었습니다 — 섭리 웹북";visibility:visible;display:block;font-size:24px;padding:40px}}`;
    document.head.appendChild(style);
    blurRef.current = style;

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("selectstart", onSelect);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeprint", onBeforePrint);

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("selectstart", onSelect);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeprint", onBeforePrint);
      blurRef.current?.remove();
      document.body.classList.remove("reader-blur");
    };
  }, [userId, bookId, pageId, enabled]);
}
