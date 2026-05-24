import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Sparkles, Wand2, Eraser, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { RichEditor } from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  htmlToText,
  textToHtml,
  normalizeWhitespace,
  spaceBetweenKoreanAndLatin,
  autoCleanHtml,
} from "@/lib/text-cleanup";

export const Route = createFileRoute("/admin/edit/$pageId")({
  head: () => ({ meta: [{ title: "페이지 편집 — 섭리 신학 e-BOOK" }, { name: "robots", content: "noindex" }] }),
  component: EditPage,
});

type PageRow = {
  id: string;
  chapter_id: string;
  page_number: number;
  content_html: string;
};
type ChapterCtx = { id: string; title: string; book_id: string; book_title: string };

function EditPage() {
  const { pageId } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageRow | null>(null);
  const [ctx, setCtx] = useState<ChapterCtx | null>(null);
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"rich" | "text" | "preview">("rich");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/login" });
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("pages").select("*").eq("id", pageId).single();
      if (!p) return;
      setPage(p as PageRow);
      setHtml(p.content_html);
      const { data: c } = await supabase.from("chapters").select("id,title,book_id").eq("id", p.chapter_id).single();
      if (c) {
        const { data: b } = await supabase.from("books").select("title").eq("id", c.book_id).single();
        setCtx({ id: c.id, title: c.title, book_id: c.book_id, book_title: b?.title ?? "" });
      }
    })();
  }, [pageId]);

  // Sync text view when switching from rich → text
  const switchTo = (m: typeof mode) => {
    if (m === "text" && mode !== "text") setText(htmlToText(html));
    if (mode === "text" && m !== "text") setHtml(textToHtml(text));
    setMode(m);
  };

  const save = async () => {
    if (!page) return;
    const finalHtml = mode === "text" ? textToHtml(text) : html;
    setSaving(true);
    const { error } = await supabase.from("pages").update({ content_html: finalHtml }).eq("id", page.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("저장됨"); setHtml(finalHtml); }
  };

  const runCleanText = () => {
    const cur = mode === "text" ? text : htmlToText(html);
    const cleaned = spaceBetweenKoreanAndLatin(normalizeWhitespace(cur));
    if (mode === "text") setText(cleaned);
    else setHtml(textToHtml(cleaned));
    toast.success("공백·자간 정리 완료");
  };

  const runAutoClean = () => {
    if (mode === "text") {
      setText(spaceBetweenKoreanAndLatin(normalizeWhitespace(text)));
    } else {
      setHtml(autoCleanHtml(html));
    }
    toast.success("자동 교정 적용");
  };

  if (loading || !isAdmin) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">권한 확인 중…</p></div>;
  if (!page) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">불러오는 중…</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-1 h-4 w-4" />관리자
            </Link>
            <h1 className="mt-1 truncate font-serif text-2xl font-bold">
              {ctx?.book_title ?? ""} <span className="text-muted-foreground">›</span> {ctx?.title ?? ""} <span className="text-muted-foreground">›</span> p.{page.page_number}
            </h1>
          </div>
          <Button onClick={save} disabled={saving}><Save className="mr-1 h-4 w-4" />{saving ? "저장 중…" : "저장"}</Button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2">
          <div className="flex rounded-md border border-border">
            <Button size="sm" variant={mode === "rich" ? "default" : "ghost"} onClick={() => switchTo("rich")}>
              <FileText className="mr-1 h-3 w-3" />서식
            </Button>
            <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => switchTo("text")}>
              텍스트
            </Button>
            <Button size="sm" variant={mode === "preview" ? "default" : "ghost"} onClick={() => switchTo("preview")}>
              <Eye className="mr-1 h-3 w-3" />미리보기
            </Button>
          </div>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" variant="outline" onClick={runCleanText}>
            <Eraser className="mr-1 h-3 w-3" />공백·줄바꿈 정리
          </Button>
          <Button size="sm" variant="outline" onClick={runAutoClean}>
            <Wand2 className="mr-1 h-3 w-3" />자동 교정 (한·영 띄어쓰기 + 자간 제거)
          </Button>
          <span className="ml-auto inline-flex items-center text-xs text-muted-foreground">
            <Sparkles className="mr-1 h-3 w-3" />변경 후 반드시 저장
          </span>
        </div>

        {mode === "rich" && <RichEditor value={html} onChange={setHtml} placeholder="본문…" />}
        {mode === "text" && (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60vh] font-mono text-[15px] leading-7"
            placeholder="본문 텍스트…"
          />
        )}
        {mode === "preview" && (
          <article
            className="prose-book imported-html rounded-md border border-border bg-card p-6"
            dangerouslySetInnerHTML={{ __html: mode === "preview" ? html : "" }}
          />
        )}
      </main>
    </div>
  );
}
