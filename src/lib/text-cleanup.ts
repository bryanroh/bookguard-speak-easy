/**
 * Korean text cleanup helpers. All functions operate on plain text;
 * call htmlToText / textToHtml to bridge with content_html.
 */

export function htmlToText(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  // Convert <br> and block tags into newlines so plain-text editing is sane.
  div.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  div.querySelectorAll("p,div,h1,h2,h3,h4,h5,h6,li,blockquote").forEach((el) => {
    el.append("\n");
  });
  return (div.textContent || "").replace(/\u00a0/g, " ");
}

export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Collapse weird whitespace, normalize line breaks. */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u2000-\u200b\u3000]/g, " ") // NBSP, thin spaces, ideographic space → normal
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ +([,.!?;:、。])/g, "$1") // no space before punctuation
    .trim();
}

/** Insert a space between adjacent Hangul and Latin/digit characters. */
export function spaceBetweenKoreanAndLatin(text: string): string {
  return text
    .replace(/([\uac00-\ud7a3])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\uac00-\ud7a3])/g, "$1 $2");
}

/** Remove inline letter-spacing / word-spacing from HTML (자간 정리). */
export function stripLetterSpacing(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const cleaned = (el.getAttribute("style") || "")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !/^(letter-spacing|word-spacing)\s*:/i.test(s))
      .join("; ");
    if (cleaned) el.setAttribute("style", cleaned);
    else el.removeAttribute("style");
  });
  return div.innerHTML;
}

/** Strip Word/한글 특유 잡코드: MsoNormal, o:p, conditional comments, smart quotes, 빈 단락 */
export function stripWordCruft(html: string): string {
  if (typeof document === "undefined") return html;
  const h = html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, "")
    .replace(/<o:p\b[^>]*>[\s\S]*?<\/o:p>/gi, "")
    .replace(/<o:p\b[^>]*\/?>/gi, "")
    .replace(/\sclass="?Mso[A-Za-z0-9]*"?/g, "")
    .replace(/\sxmlns:[a-z]+="[^"]*"/gi, "")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  const div = document.createElement("div");
  div.innerHTML = h;
  div.querySelectorAll("p,span,div").forEach((el) => {
    if (!el.textContent?.trim() && el.children.length === 0) el.remove();
  });
  return div.innerHTML;
}

/** One-shot: Word 잡코드 + 공백 정리 + 한·영 띄어쓰기 + 자간 제거 (HTML in/out, preserves tags). */
export function autoCleanHtml(html: string): string {
  const stripped = stripLetterSpacing(stripWordCruft(html));
  if (typeof document === "undefined") return stripped;
  const div = document.createElement("div");
  div.innerHTML = stripped;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      const cleaned = spaceBetweenKoreanAndLatin(
        t.replace(/[\u00a0\u3000]/g, " ").replace(/[ \t]{2,}/g, " "),
      );
      if (cleaned !== t) node.textContent = cleaned;
      return;
    }
    node.childNodes.forEach(walk);
  };
  walk(div);
  return div.innerHTML;
}
