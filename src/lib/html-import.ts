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

/** Detect a "new page starts here" marker on this element. */
function isPageBreak(el: Element): boolean {
  const s = (el.getAttribute("style") || "").toLowerCase();
  if (
    s.includes("page-break-before") ||
    s.includes("page-break-after") ||
    s.includes("break-before:page") ||
    s.includes("break-after:page") ||
    s.includes("mso-special-character:line-break") ||
    s.includes("mso-special-character: line-break")
  )
    return true;
  const cls = (typeof el.className === "string" ? el.className : "").toLowerCase();
  if (
    cls.includes("page-break") ||
    cls.includes("mso-pagebreak") ||
    cls.includes("msopagebreak") ||
    cls.includes("hwp-page") ||
    /\bsection\d+\b/.test(cls) ||
    /\bwordsection\d+\b/.test(cls) ||
    cls.includes("pagecontainer") ||
    cls === "page"
  )
    return true;
  if (el.tagName === "HR" && (cls.includes("page") || s.includes("page-break"))) return true;
  // HWP/Word per-page wrapper divs often set an A4-ish mm height
  if (
    el.tagName === "DIV" &&
    /height\s*:\s*(2[6-9]\d|29[0-9]|30\d)(\.\d+)?\s*mm/.test(s)
  )
    return true;
  return false;
}

/** Descend through generic single-wrapper containers (HWPDocument, container,
 * mainContent, …) to reach a meaningful list of blocks. */
function flattenTopBlocks(body: HTMLElement): HTMLElement[] {
  let blocks: HTMLElement[] = Array.from(body.children) as HTMLElement[];
  for (let i = 0; i < 5; i++) {
    if (blocks.length !== 1) break;
    const only = blocks[0];
    if (only.tagName !== "DIV" && only.tagName !== "SECTION") break;
    if (isPageBreak(only)) break;
    const inner = Array.from(only.children) as HTMLElement[];
    if (inner.length < 2) break;
    blocks = inner;
  }
  return blocks;
}

/** HWP exports often wrap each rendered paper page in a .hpa block. */
function isPageContainer(el: Element): boolean {
  const cls = (typeof el.className === "string" ? el.className : "").toLowerCase();
  if (/\b(hpa|hwp-page|pagecontainer|wordsection\d+|section\d+)\b/.test(cls)) return true;
  const s = (el.getAttribute("style") || "").toLowerCase();
  return el.tagName === "DIV" && /height\s*:\s*(2[6-9]\d|29[0-9]|30\d)(\.\d+)?\s*mm/.test(s);
}

function findPageContainers(blocks: HTMLElement[]): HTMLElement[] {
  const direct = blocks.filter(isPageContainer);
  if (direct.length >= 2) return direct;
  if (blocks.length === 1) {
    const nested = Array.from(blocks[0].children).filter(isPageContainer) as HTMLElement[];
    if (nested.length >= 2) return nested;
  }
  return [];
}

/** Detect short paragraphs that look like a page-number footer:
 * "1", "- 1 -", "·1·", "p. 1", "1 / 200" ...
 * Returns the page number if it looks like one, else null. */
function pageNumberOf(el: Element): number | null {
  const txt = (el.textContent || "").trim();
  if (!txt || txt.length > 12) return null;
  // 1 / 200  → first number
  let m = txt.match(/^\s*[-–—·•]?\s*(?:p\.?\s*)?(\d{1,4})\s*(?:\/\s*\d{1,4})?\s*[-–—·•]?\s*$/i);
  if (!m) return null;
  // ignore elements with images / many children (likely real content)
  if (el.querySelector("img,table,ul,ol")) return null;
  const n = parseInt(m[1], 10);
  if (!isFinite(n) || n < 1 || n > 2000) return null;
  return n;
}

/** Find indices of blocks that form an increasing page-number sequence
 * (≥3 hits, each strictly greater than the previous). Returns empty if not found. */
function findPageNumberBreaks(blocks: HTMLElement[]): Set<number> {
  const candidates: { idx: number; n: number }[] = [];
  blocks.forEach((el, idx) => {
    const n = pageNumberOf(el);
    if (n !== null) candidates.push({ idx, n });
  });
  if (candidates.length < 3) return new Set();
  // Keep the longest strictly-increasing run
  const kept: typeof candidates = [];
  let last = -Infinity;
  for (const c of candidates) {
    if (c.n > last && c.n - last <= 5) {
      kept.push(c);
      last = c.n;
    }
  }
  if (kept.length < 3) return new Set();
  return new Set(kept.map((c) => c.idx));
}

function splitIntoPages(body: HTMLElement): string[] {
  const blocks = flattenTopBlocks(body);
  const containers = findPageContainers(blocks);
  if (containers.length >= 2) return containers.map((el) => el.outerHTML).filter((p) => p.trim());

  const pages: string[][] = [[]];
  for (const el of blocks) {
    if (isPageBreak(el)) {
      if (pages[pages.length - 1].length > 0) pages.push([]);
      const inner = (el.innerHTML || "").trim();
      if (inner) pages[pages.length - 1].push(inner);
      continue;
    }
    pages[pages.length - 1].push(el.outerHTML);
  }
  let result = pages.map((c) => c.join("\n")).filter((p) => p.trim().length > 0);

  // Fallback A: still one page → try page-number footer detection
  if (result.length <= 1) {
    const breaks = findPageNumberBreaks(blocks);
    if (breaks.size >= 2) {
      const chunks: string[][] = [[]];
      blocks.forEach((el, idx) => {
        if (breaks.has(idx)) {
          // page number marks END of current page → drop it, start new page
          if (chunks[chunks.length - 1].length > 0) chunks.push([]);
          return;
        }
        chunks[chunks.length - 1].push(el.outerHTML);
      });
      result = chunks.map((c) => c.join("\n")).filter((p) => p.trim().length > 0);
    }
  }

  // Fallback B: still one page but lots of text → chunk by character count
  if (result.length <= 1) {
    const text = body.textContent || "";
    if (text.length > 3500) {
      const chunks: string[][] = [[]];
      let count = 0;
      for (const el of blocks) {
        const len = (el.textContent || "").length;
        if (count + len > 3000 && chunks[chunks.length - 1].length > 0) {
          chunks.push([]);
          count = 0;
        }
        chunks[chunks.length - 1].push(el.outerHTML);
        count += len;
      }
      result = chunks.map((c) => c.join("\n")).filter((p) => p.trim().length > 0);
    }
  }
  return result;
}

/** Re-split an existing book whose pages were merged into one DB row.
 * Pass the combined HTML of all current pages; returns the new page HTMLs
 * (each already wrapped + style-scoped, ready to insert into pages.content_html). */
export function resplitCombinedHtml(combinedHtml: string): string[] {
  if (typeof document === "undefined") return [combinedHtml];
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<!doctype html><html><body>${combinedHtml}</body></html>`,
    "text/html",
  );
  const rawCss = extractStyles(doc);
  const scopedCss = sanitizeCss(rawCss);
  doc.querySelectorAll("style").forEach((s) => s.remove());
  // Unwrap any prior .imported-html wrappers so we don't treat them as one block
  doc.querySelectorAll(".imported-html").forEach((w) => {
    while (w.firstChild) w.parentNode?.insertBefore(w.firstChild, w);
    w.remove();
  });
  if (doc.body) sanitizeInlineStyles(doc.body);
  const pages = doc.body ? splitIntoPages(doc.body) : [];
  const styleTag = scopedCss ? `<style>${scopedCss}</style>` : "";
  return pages.map((p) => `${styleTag}<div class="imported-html">${p}</div>`);
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
