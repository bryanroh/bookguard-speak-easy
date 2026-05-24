import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Outdent,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo,
  Unlink,
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
  { v: "1", label: "10" },
  { v: "2", label: "13" },
  { v: "3", label: "16" },
  { v: "4", label: "18" },
  { v: "5", label: "24" },
  { v: "6", label: "32" },
  { v: "7", label: "48" },
];

const LETTER_SPACING = [
  { v: "", label: "자간" },
  { v: "normal", label: "기본" },
  { v: "0.03em", label: "넓게" },
  { v: "0.06em", label: "더 넓게" },
  { v: "-0.02em", label: "좁게" },
];

const LINE_HEIGHTS = [
  { v: "", label: "줄간격" },
  { v: "1.4", label: "좁게" },
  { v: "1.8", label: "기본" },
  { v: "2.2", label: "넓게" },
  { v: "2.6", label: "더 넓게" },
];

const btnBase = "h-8 w-8 p-0 transition-colors";
const activeBtn =
  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground";

export function RichEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const sync = () => {
    if (ref.current) onChange(ref.current.innerHTML);
    updateActiveState();
  };

  const updateActiveState = () => {
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      subscript: document.queryCommandState("subscript"),
      superscript: document.queryCommandState("superscript"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
    });
  };

  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !ref.current) return;
      const node = selection.anchorNode;
      if (node && ref.current.contains(node)) updateActiveState();
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    sync();
  };

  const applyInlineStyle = (style: string) => {
    ref.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.setAttribute("style", style);
    try {
      range.surroundContents(span);
    } catch {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);
    sync();
  };

  const promptLink = () => {
    const url = prompt("링크 URL:");
    if (!url) return;
    exec("createLink", url);
  };

  const toolbarButton = (
    command: string,
    icon: ReactNode,
    label: string,
    arg?: string,
    activeKey = command,
  ) => (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      title={label}
      aria-pressed={!!active[activeKey]}
      className={`${btnBase} ${active[activeKey] ? activeBtn : ""}`}
      onClick={() => exec(command, arg)}
    >
      {icon}
    </Button>
  );

  return (
    <div className="rounded-md border border-border bg-card shadow-sm">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
        <select
          onChange={(e) => exec("fontName", e.target.value)}
          defaultValue=""
          className="h-8 rounded border border-border bg-background px-2 text-xs"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.v} style={{ fontFamily: f.v || undefined }}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue=""
          className="h-8 rounded border border-border bg-background px-2 text-xs"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.label} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => e.target.value && applyInlineStyle(`letter-spacing:${e.target.value}`)}
          defaultValue=""
          className="h-8 rounded border border-border bg-background px-2 text-xs"
        >
          {LETTER_SPACING.map((s) => (
            <option key={s.label} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => e.target.value && applyInlineStyle(`line-height:${e.target.value}`)}
          defaultValue=""
          className="h-8 rounded border border-border bg-background px-2 text-xs"
        >
          {LINE_HEIGHTS.map((s) => (
            <option key={s.label} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="mx-1 h-5 w-px bg-border" />

        <label
          className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border bg-background text-xs font-bold"
          title="글자 색"
        >
          A
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <label
          className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border bg-accent text-xs font-bold text-accent-foreground"
          title="형광펜"
        >
          H
          <input
            type="color"
            defaultValue="#fff176"
            onChange={(e) => exec("hiliteColor", e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <span className="mx-1 h-5 w-px bg-border" />

        {toolbarButton("bold", <Bold className="h-4 w-4" />, "굵게")}
        {toolbarButton("italic", <Italic className="h-4 w-4" />, "기울임")}
        {toolbarButton("underline", <Underline className="h-4 w-4" />, "밑줄")}
        {toolbarButton("strikeThrough", <Strikethrough className="h-4 w-4" />, "취소선")}
        {toolbarButton("subscript", <Subscript className="h-4 w-4" />, "아래첨자")}
        {toolbarButton("superscript", <Superscript className="h-4 w-4" />, "위첨자")}
        <span className="mx-1 h-5 w-px bg-border" />

        {toolbarButton(
          "formatBlock",
          <Heading1 className="h-4 w-4" />,
          "제목 1",
          "<h1>",
          "formatBlockH1",
        )}
        {toolbarButton(
          "formatBlock",
          <Heading2 className="h-4 w-4" />,
          "제목 2",
          "<h2>",
          "formatBlockH2",
        )}
        {toolbarButton(
          "formatBlock",
          <Heading3 className="h-4 w-4" />,
          "제목 3",
          "<h3>",
          "formatBlockH3",
        )}
        {toolbarButton(
          "formatBlock",
          <Pilcrow className="h-4 w-4" />,
          "본문",
          "<p>",
          "formatBlockP",
        )}
        {toolbarButton(
          "formatBlock",
          <Quote className="h-4 w-4" />,
          "인용",
          "<blockquote>",
          "formatBlockQuote",
        )}
        <span className="mx-1 h-5 w-px bg-border" />

        {toolbarButton("insertUnorderedList", <List className="h-4 w-4" />, "글머리 기호")}
        {toolbarButton("insertOrderedList", <ListOrdered className="h-4 w-4" />, "번호 목록")}
        {toolbarButton("outdent", <Outdent className="h-4 w-4" />, "내어쓰기")}
        {toolbarButton("indent", <Indent className="h-4 w-4" />, "들여쓰기")}
        <span className="mx-1 h-5 w-px bg-border" />

        {toolbarButton("justifyLeft", <AlignLeft className="h-4 w-4" />, "왼쪽 정렬")}
        {toolbarButton("justifyCenter", <AlignCenter className="h-4 w-4" />, "가운데 정렬")}
        {toolbarButton("justifyRight", <AlignRight className="h-4 w-4" />, "오른쪽 정렬")}
        {toolbarButton("justifyFull", <AlignJustify className="h-4 w-4" />, "양쪽 정렬")}
        <span className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="링크"
          className={btnBase}
          onClick={promptLink}
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="링크 해제"
          className={btnBase}
          onClick={() => exec("unlink")}
        >
          <Unlink className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="서식 지우기"
          className={btnBase}
          onClick={() => exec("removeFormat")}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="실행 취소"
          className={btnBase}
          onClick={() => exec("undo")}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="다시 실행"
          className={btnBase}
          onClick={() => exec("redo")}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onMouseUp={updateActiveState}
        onKeyUp={updateActiveState}
        data-placeholder={placeholder}
        className="prose-book min-h-[60vh] max-w-none bg-background p-6 leading-8 outline-none focus:ring-2 focus:ring-primary/40 [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-muted-foreground"
      />
    </div>
  );
}
