import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Quote, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { value: string; onChange: (html: string) => void; placeholder?: string };

/** Lightweight contentEditable rich editor (no external deps). */
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

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("underline")}><Underline className="h-4 w-4" /></Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("formatBlock", "<h1>")}><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("formatBlock", "<h2>")}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("formatBlock", "<blockquote>")}><Quote className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("formatBlock", "<p>")}>P</Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("undo")}><Undo className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("redo")}><Redo className="h-4 w-4" /></Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose-book min-h-[300px] max-w-none p-4 outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-muted-foreground"
      />
    </div>
  );
}
