import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Watermark } from "@/components/Watermark";
import { TTSControls } from "@/components/TTSControls";
import { SiteHeader } from "@/components/SiteHeader";
import { useReaderProtection } from "@/hooks/use-reader-protection";
import { useCameraDetection } from "@/hooks/use-camera-detection";
import { CameraGate } from "@/components/CameraGate";
import { CanvasReader } from "@/components/CanvasReader";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/read/$pageId")({
  head: () => ({ meta: [{ title: "읽기 — 섭리 웹북" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ReaderPageGated,
});

function ReaderPageGated() {
  return (
    <CameraGate>
      <ReaderPage />
    </CameraGate>
  );
}

type PageDetail = {
  id: string; chapter_id: string; page_number: number; content_html: string;
  chapter: { id: string; book_id: string; title: string; book: { id: string; title: string; language: string } };
};

function ReaderPage() {
  const t = useT();
  const { pageId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageDetail | null>(null);
  const [siblingPages, setSiblingPages] = useState<{ id: string; page_number: number; chapter_id: string }[]>([]);
  const [activeSentence, setActiveSentence] = useState<number>(-1);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("pages")
        .select("id,chapter_id,page_number,content_html, chapter:chapters!inner(id,book_id,title, book:books!inner(id,title,language))")
        .eq("id", pageId).maybeSingle();
      if (!data) return;
      setPage(data as unknown as PageDetail);
      const bookId = (data as any).chapter.book.id as string;
      const { data: chs } = await supabase.from("chapters").select("id").eq("book_id", bookId).order("order_index");
      if (chs) {
        const { data: pgs } = await supabase.from("pages").select("id,page_number,chapter_id").in("chapter_id", chs.map((c) => c.id)).order("page_number");
        setSiblingPages(pgs ?? []);
      }
      // save progress
      await supabase.from("reading_progress").upsert({
        user_id: user.id, book_id: bookId, last_page_id: pageId, updated_at: new Date().toISOString(),
      });
    })();
  }, [user, pageId]);

  useReaderProtection({
    userId: user?.id ?? null,
    bookId: page?.chapter.book.id ?? "",
    pageId,
    enabled: !!page,
  });

  const handleForceLogout = useCallback(async () => {
    try { window.speechSynthesis?.cancel(); } catch {}
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }, [navigate]);

  const { status: camStatus, detectedLabel } = useCameraDetection({
    enabled: !!page && !!user,
    userId: user?.id ?? null,
    bookId: page?.chapter.book.id ?? "",
    pageId,
    onForceLogout: handleForceLogout,
  });

  const idx = useMemo(() => siblingPages.findIndex((p) => p.id === pageId), [siblingPages, pageId]);
  const prev = idx > 0 ? siblingPages[idx - 1] : null;
  const next = idx >= 0 && idx < siblingPages.length - 1 ? siblingPages[idx + 1] : null;

  const userLabel = user ? `${user.email} • ${user.id.slice(0, 8)}` : "";

  const addBookmark = async () => {
    if (!user) return;
    const note = prompt(t("read.bookmarkPrompt")) || null;
    const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, page_id: pageId, note });
    if (error) toast.error(error.message); else toast.success(t("read.bookmarkSaved"));
  };

  // Sentence-highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!page) return "";
    if (typeof document === "undefined" || activeSentence < 0) return page.content_html;
    const div = document.createElement("div");
    div.innerHTML = page.content_html;
    const text = div.textContent || "";
    const sentences = text.split(/(?<=[.!?。！？\n])\s+/).map((s) => s.trim()).filter(Boolean);
    if (activeSentence >= sentences.length) return page.content_html;
    const target = sentences[activeSentence];
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return page.content_html.replace(new RegExp(escaped, "i"), `<mark class="tts-active">${target}</mark>`);
  }, [page, activeSentence]);

  if (!page) return <div className="min-h-screen bg-background p-8 text-center">{t("read.loading")}</div>;

  return (
    <div className="relative min-h-screen bg-background">
      <Watermark userLabel={userLabel} />
      <SiteHeader />
      <header className="sticky top-16 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
          <Link to="/book/$bookId" params={{ bookId: page.chapter.book.id }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />{page.chapter.book.title}
          </Link>
          <div className="hidden text-xs text-muted-foreground sm:block">
            {page.chapter.title} · p.{page.page_number}
          </div>
          <div className="flex items-center gap-2">
            <CamStatusBadge status={camStatus} label={detectedLabel} />
            <Button size="sm" variant="ghost" onClick={addBookmark}><Bookmark className="mr-1 h-4 w-4" />{t("read.bookmark")}</Button>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-3">
          <TTSControls html={page.content_html} lang={page.chapter.book.language} onSentenceChange={setActiveSentence} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <article
          className="reader-content imported-html prose-book no-select"
          // Protected content
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        <div className="mt-12 flex items-center justify-between">
          {prev ? (
            <Link to="/read/$pageId" params={{ pageId: prev.id }}><Button variant="outline"><ChevronLeft className="mr-1 h-4 w-4" />{t("read.prev")}</Button></Link>
          ) : <div />}
          {next && (
            <Link to="/read/$pageId" params={{ pageId: next.id }}><Button>{t("read.next")}<ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
          )}
        </div>
      </main>
    </div>
  );
}

function CamStatusBadge({ status, label }: { status: string; label: string | null }) {
  if (status === "active") {
    return (
      <span className="hidden items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 sm:inline-flex" title="촬영 기기 감지 보호 작동 중">
        <ShieldCheck className="h-3 w-3" />보호 작동중
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-600">
        <ShieldAlert className="h-3 w-3" />{label ?? "촬영 기기"} 감지
      </span>
    );
  }
  if (status === "denied" || status === "unsupported") {
    return (
      <span className="hidden items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 sm:inline-flex" title="카메라 권한이 없어 촬영 기기 감지가 비활성화됨">
        <ShieldOff className="h-3 w-3" />보호 비활성
      </span>
    );
  }
  return null;
}
