/**
 * Parse an uploaded HTML file (한글/Word → 웹 페이지) into pages,
 * sanitizing styles so they stay scoped to the reader and don't hide text.
 */
export type ParsedHtmlBook = {
  title: string;
  pages: string[];
};

const SCOPE = ".imported-html";

/** Remove rules that would break the reader (global selectors, invisible text, absolute layout). */
function sanitizeCss(css: string): string {
  // Strip comments
  let out = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Split into rule blocks. Keep only selector { decls } blocks; drop @page, @media print, etc.
  const rules: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(out)) !== null) {
    const rawSelector = m[1].trim();
    let decls = m[2].trim();
    if (!rawSelector || !decls) continue;
    if (rawSelector.startsWith("@")) continue; // drop @page/@font-face/@media

    // Filter dangerous declarations
    decls = decls
      .split(";")
      .map((d) => d.trim())
      .filter((d) => {
        if (!d) return false;
        const low = d.toLowerCase();
        if (/visibility\s*:\s*hidden/.test(low)) return false;
        if (/display\s*:\s*none/.test(low)) return false;
        if (/font-size\s*:\s*0(pt|px|em|rem)?\b/.test(low)) return false;
        if (/opacity\s*:\s*0(\.0+)?\b/.test(low)) return false;
        if (/color\s*:\s*(#fff(fff)?|white|transparent|rgba?\(\s*255\s*,\s*255\s*,\s*255)/.test(low)) return false;
        if (/position\s*:\s*(absolute|fixed|relative)/.test(low)) return false;
        if (/(left|top|right|bottom)\s*:\s*-?\d{3,}px/.test(low)) return false;
        // HWP/Word export layout props that break flow
        if (/^(left|top|right|bottom)\s*:/.test(low)) return false;
        if (/^(width|height|min-height|max-height|min-width|max-width)\s*:/.test(low)) return false;
        if (/^line-height\s*:/.test(low)) return false;
        if (/^white-space\s*:\s*nowrap/.test(low)) return false;
        if (/^font-family\s*:/.test(low)) return false;
        if (/^float\s*:/.test(low)) return false;
        if (/^transform\s*:/.test(low)) return false;
        if (/background(-color)?\s*:\s*(#000|black|rgb\(\s*0\s*,\s*0\s*,\s*0)/.test(low)) return false;
        return true;
      })
      .join("; ");

    if (!decls) continue;

    // Scope: drop rules targeting html/body/*; prefix everything else
    const selectors = rawSelector
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !/^(html|body|\*)\b/i.test(s))
      .map((s) => `${SCOPE} ${s}`);
    if (selectors.length === 0) continue;

    rules.push(`${selectors.join(", ")} { ${decls} }`);
  }

  return rules.join("\n");
}

/** Strip inline style attributes of dangerous declarations (visibility, color:white, etc.) */
function sanitizeInlineStyles(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const raw = el.getAttribute("style") || "";
    const cleaned = raw.split(";").map((d) => d.trim()).filter((d) => {
      if (!d) return false;
      const low = d.toLowerCase();
      if (/visibility\s*:\s*hidden/.test(low)) return false;
      if (/display\s*:\s*none/.test(low)) return false;
      if (/font-size\s*:\s*0(pt|px|em|rem)?\b/.test(low)) return false;
      if (/opacity\s*:\s*0(\.0+)?\b/.test(low)) return false;
      if (/color\s*:\s*(#fff(fff)?|white|transparent|rgba?\(\s*255\s*,\s*255\s*,\s*255)/.test(low)) return false;
      if (/position\s*:\s*(absolute|fixed|relative)/.test(low)) return false;
      // HWP/Word per-line layout — strip so text flows normally
      if (/^(left|top|right|bottom)\s*:/.test(low)) return false;
      if (/^(width|height|min-height|max-height|min-width|max-width)\s*:/.test(low)) return false;
      if (/^line-height\s*:/.test(low)) return false;
      if (/^white-space\s*:\s*nowrap/.test(low)) return false;
      if (/^font-family\s*:/.test(low)) return false;
      if (/^float\s*:/.test(low)) return false;
      if (/^transform\s*:/.test(low)) return false;
      if (/background(-color)?\s*:\s*(#000|black|rgb\(\s*0\s*,\s*0\s*,\s*0)/.test(low)) return false;
      return true;
    }).join("; ");
    if (cleaned) el.setAttribute("style", cleaned);
    else el.removeAttribute("style");
  });
  // Remove any <script>
  root.querySelectorAll("script").forEach((s) => s.remove());
}

function extractStyles(doc: Document): string {
  const parts: string[] = [];
  doc.querySelectorAll("style").forEach((s) => parts.push(s.textContent || ""));
  return parts.join("\n");
}

function splitIntoPages(body: HTMLElement): string[] {
  const children = Array.from(body.children) as HTMLElement[];
  const pages: string[][] = [[]];
  const isBreak = (el: HTMLElement) => {
    const s = (el.getAttribute("style") || "").toLowerCase();
    if (s.includes("page-break-before") || s.includes("page-break-after")) return true;
    if (el.tagName === "HR" && (el.className?.toLowerCase().includes("page") || s.includes("page-break"))) return true;
    if (el.classList?.contains("page-break") || el.classList?.contains("MsoPageBreak")) return true;
    return false;
  };
  for (const el of children) {
    if (isBreak(el)) { pages.push([]); continue; }
    pages[pages.length - 1].push(el.outerHTML);
  }
  if (pages.length === 1) {
    const text = body.textContent || "";
    if (text.length > 4000) {
      const chunks: string[][] = [[]];
      let count = 0;
      for (const el of children) {
        const len = (el.textContent || "").length;
        if (count + len > 3500 && chunks[chunks.length - 1].length > 0) { chunks.push([]); count = 0; }
        chunks[chunks.length - 1].push(el.outerHTML);
        count += len;
      }
      return chunks.map((c) => c.join("\n")).filter((p) => p.trim().length > 0);
    }
  }
  return pages.map((c) => c.join("\n")).filter((p) => p.trim().length > 0);
}

export function parseHtmlFile(htmlText: string): ParsedHtmlBook {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const title = (doc.querySelector("title")?.textContent || "").trim() || "제목 없음";
  const rawCss = extractStyles(doc);
  const scopedCss = sanitizeCss(rawCss);
  if (doc.body) sanitizeInlineStyles(doc.body);
  const pages = doc.body ? splitIntoPages(doc.body) : [];
  // Inject one shared <style> + wrap content in the scope class.
  // The style block is included on every page so each page is self-contained,
  // but it is already pruned to a small footprint.
  const styleTag = scopedCss ? `<style>${scopedCss}</style>` : "";
  const finalPages = pages.map((p) => `${styleTag}<div class="imported-html">${p}</div>`);
  return { title, pages: finalPages };
}

/** Re-clean an already-stored page (for retroactive cleanup of existing books). */
export function recleanStoredPage(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html");
  const rawCss = extractStyles(doc);
  const scopedCss = sanitizeCss(rawCss);
  doc.querySelectorAll("style").forEach((s) => s.remove());
  // Unwrap any prior .imported-html wrapper to avoid nesting
  const wrappers = Array.from(doc.querySelectorAll(".imported-html"));
  wrappers.forEach((w) => {
    while (w.firstChild) w.parentNode?.insertBefore(w.firstChild, w);
    w.remove();
  });
  if (doc.body) sanitizeInlineStyles(doc.body);
  const inner = doc.body?.innerHTML ?? html;
  const styleTag = scopedCss ? `<style>${scopedCss}</style>` : "";
  return `${styleTag}<div class="imported-html">${inner}</div>`;
}
