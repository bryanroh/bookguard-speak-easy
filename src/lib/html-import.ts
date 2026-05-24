/**
 * Parse an uploaded HTML file (from 한글/Word "다른 이름으로 저장 → 웹 페이지")
 * into book metadata + pages, preserving inline styles/fonts as much as possible.
 */
export type ParsedHtmlBook = {
  title: string;
  pages: string[]; // each page = HTML string for one page
  styleBlock: string; // <style>…</style> contents from <head>, prefixed/scoped
};

function extractStyles(doc: Document): string {
  const parts: string[] = [];
  doc.querySelectorAll("style").forEach((s) => parts.push(s.textContent || ""));
  return parts.join("\n");
}

/** Split a body element into pages. Heuristic:
 *  1) Explicit page-break markers (mso page-break, hr.page-break, style="page-break-before")
 *  2) Otherwise group every ~3500 chars of text into a page.
 */
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

  // Fallback: if only one page resulted but content is huge, chunk by size
  if (pages.length === 1) {
    const text = body.textContent || "";
    if (text.length > 4000) {
      const chunks: string[][] = [[]];
      let count = 0;
      for (const el of children) {
        const len = (el.textContent || "").length;
        if (count + len > 3500 && chunks[chunks.length - 1].length > 0) {
          chunks.push([]);
          count = 0;
        }
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
  const styleBlock = extractStyles(doc);
  const body = doc.body;
  const pages = body ? splitIntoPages(body) : [];
  // Prepend the style block to each page so fonts/colors render inside the reader.
  const wrappedStyle = styleBlock ? `<style>${styleBlock}</style>` : "";
  const finalPages = pages.map((p) => `${wrappedStyle}<div class="imported-html">${p}</div>`);
  return { title, pages: finalPages, styleBlock };
}
