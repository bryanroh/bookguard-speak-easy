import { useEffect, useRef } from "react";

type Props = {
  html: string;
  className?: string;
};

/**
 * Renders book content as canvas pixels so DevTools cannot extract the text.
 * The source HTML is parsed into block-level text segments and drawn onto
 * a canvas. The original HTML never enters the rendered DOM tree
 * (TTSControls receives the HTML via a prop in parent scope only).
 */
export function CanvasReader({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    // Parse HTML to block-level segments
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLElement | null;
    if (!root) return;

    type Block = { text: string; tag: string };
    const blocks: Block[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (["h1", "h2", "h3", "h4", "p", "li", "blockquote"].includes(tag)) {
          const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
          if (text) blocks.push({ text, tag });
          return;
        }
        el.childNodes.forEach(walk);
      }
    };
    walk(root);
    if (blocks.length === 0) {
      const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) blocks.push({ text, tag: "p" });
    }

    const render = () => {
      container.innerHTML = "";
      const cssWidth = container.clientWidth || 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Detect dark mode from CSS variable
      const cs = getComputedStyle(document.documentElement);
      const bg = cs.getPropertyValue("--background").trim() || "#fff";
      const fg = cs.getPropertyValue("--foreground").trim() || "#111";
      // CSS vars are oklch in this template; canvas needs rgb. Fallback colors:
      const fgColor = fg.startsWith("oklch") ? "currentColor" : fg;
      const useCurrent = fgColor === "currentColor";

      const styleFor = (tag: string) => {
        switch (tag) {
          case "h1": return { font: "700 28px 'Noto Serif KR', serif", lh: 40, bottom: 20 };
          case "h2": return { font: "700 22px 'Noto Serif KR', serif", lh: 32, bottom: 16 };
          case "h3": return { font: "700 18px 'Noto Serif KR', serif", lh: 26, bottom: 14 };
          case "h4": return { font: "700 16px 'Noto Serif KR', serif", lh: 24, bottom: 12 };
          case "blockquote": return { font: "italic 16px 'Noto Serif KR', serif", lh: 28, bottom: 14 };
          case "li": return { font: "16px 'Noto Serif KR', serif", lh: 28, bottom: 6 };
          default: return { font: "16px 'Noto Serif KR', serif", lh: 28, bottom: 14 };
        }
      };

      const padding = 24;
      const contentWidth = cssWidth - padding * 2;

      // First pass: measure with an off-screen canvas
      const measure = document.createElement("canvas");
      const mctx = measure.getContext("2d")!;
      type Line = { text: string; font: string; lh: number; bottom: number; indent: number };
      const lines: Line[] = [];

      for (const b of blocks) {
        const s = styleFor(b.tag);
        mctx.font = s.font;
        const indent = b.tag === "li" ? 18 : 0;
        const maxW = contentWidth - indent;
        const words = b.text.split(/(\s+)/);
        let current = "";
        const prefix = b.tag === "li" ? "• " : "";
        const firstLineText = prefix;
        current = firstLineText;
        for (const w of words) {
          const test = current + w;
          if (mctx.measureText(test).width > maxW && current.trim().length > 0) {
            lines.push({ text: current.trimEnd(), font: s.font, lh: s.lh, bottom: 0, indent });
            current = w.trimStart();
          } else {
            current = test;
          }
        }
        if (current.trim().length > 0) {
          lines.push({ text: current.trimEnd(), font: s.font, lh: s.lh, bottom: s.bottom, indent });
        }
      }

      const totalHeight = lines.reduce((acc, l) => acc + l.lh + l.bottom, padding * 2);

      // Real canvas
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(totalHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${totalHeight}px`;
      canvas.style.display = "block";
      // Subtle anti-screenshot hint
      canvas.setAttribute("aria-hidden", "true");

      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      // Background — leave transparent; container bg shows through
      ctx.fillStyle = useCurrent
        ? getComputedStyle(container).color || "#111"
        : fgColor;
      ctx.textBaseline = "top";

      let y = padding;
      for (const l of lines) {
        ctx.font = l.font;
        ctx.fillText(l.text, padding + l.indent, y);
        y += l.lh + l.bottom;
      }

      container.appendChild(canvas);
    };

    render();

    // Re-render on resize
    let raf: number | null = null;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [html]);

  return <div ref={containerRef} className={className} />;
}
