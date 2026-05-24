import { useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Indent, Outdent, Link2, Unlink, Eraser,
  Undo, Redo, Subscript, Superscript, Pilcrow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { value: string; onChange: (html: string) => void; placeholder?: string };

const FONT_FAMILIES = [
  { v: "", label: "글꼴" },
  { v: "'Noto Serif KR', serif", label: "본명조" },
  { v: "'Noto Sans KR', sans-serif", label: "본고딕" },
  { v: "'Nanum Myeongjo', serif", label: "나눔명조" },
  { v: "'Nanum Gothic', sans-serif", label: "나눔고딕" },
  { v: "Georgia, serif", label: "Georgia" },
  { v: "'Times New Roman', serif", label: "Times" },
  { v: "Arial, sans-serif", label: "Arial" },
  { v: "'Courier New', monospace", label: "Courier" },
];

const FONT_SIZES = [
  { v: "", label: "크기" },
  { v: "1", label: "10" }, { v: "2", label: "13" }, { v: "3", label: "16" },
  { v: "4", label: "18" }, { v: "5", label: "24" }, { v: "6", label: "32" }, { v: "7", label: "48" },
];

/** Lightweight contentEditable rich editor with Word-like toolbar. */
export function RichEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const promptLink = () => {
    const url = prompt("링크 URL:"); if (!url) return;
    exec("createLink", url);
  };

  const btn = "h-8 w-8 p-0";

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
        {/* Font family */}
        <select onChange={(e) => exec("fontName", e.target.value)} defaultValue=""
          className="h-8 rounded border border-border bg-background px-2 text-xs">
          {FONT_FAMILIES.map((f) => <option key={f.label} value={f.v} style={{ fontFamily: f.v || undefined }}>{f.label}</option>)}
        </select>
        {/* Font size */}
        <select onChange={(e) => exec("fontSize", e.target.value)} defaultValue=""
          className="h-8 rounded border border-border bg-background px-2 text-xs">
          {FONT_SIZES.map((s) => <option key={s.label} value={s.v}>{s.label}</option>)}
        </select>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Color & highlight */}
        <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border bg-background text-xs font-bold" title="글자 색">
          A
          <input type="color" defaultValue="#000000" onChange={(e) => exec("foreColor", e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border bg-yellow-200 text-xs font-bold" title="형광펜">
          H
          <input type="color" defaultValue="#fff176" onChange={(e) => exec("hiliteColor", e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Bold/Italic/Underline/Strike */}
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("bold")}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("italic")}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("underline")}><Underline className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("strikeThrough")}><Strikethrough className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("subscript")}><Subscript className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("superscript")}><Superscript className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Headings */}
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("formatBlock", "<h1>")}><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("formatBlock", "<h2>")}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("formatBlock", "<h3>")}><Heading3 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("formatBlock", "<p>")}><Pilcrow className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("formatBlock", "<blockquote>")}><Quote className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Lists */}
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("outdent")}><Outdent className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("indent")}><Indent className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Alignment */}
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("justifyLeft")}><AlignLeft className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("justifyCenter")}><AlignCenter className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("justifyRight")}><AlignRight className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("justifyFull")}><AlignJustify className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Link, clear */}
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={promptLink}><Link2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("unlink")}><Unlink className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("removeFormat")}><Eraser className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />

        {/* Undo/Redo */}
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("undo")}><Undo className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn} onClick={() => exec("redo")}><Redo className="h-4 w-4" /></Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose-book min-h-[400px] max-w-none p-6 outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-muted-foreground"
      />
    </div>
  );
}
