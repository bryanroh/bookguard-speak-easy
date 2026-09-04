import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, ShieldCheck, ShieldAlert, ShieldOff, Minus, Plus, Type } from "lucide-react";
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

type ReaderTheme = "sepia" | "paper" | "ink";
const THEME_CLASS: Record<ReaderTheme, string> = {
  sepia: "reader-sepia",
  paper: "reader-paper",
  ink: "reader-ink",
};
const FONT_MIN = 15;
const FONT_MAX = 28;


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

  // Note: visual sentence highlighting is removed in canvas mode (text is now
  // rendered as pixels). TTS playback itself still works via TTSControls.
  void activeSentence;

  const progress = siblingPages.length > 0 && idx >= 0 ? ((idx + 1) / siblingPages.length) * 100 : 0;

  // keyboard paging
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) navigate({ to: "/read/$pageId", params: { pageId: prev.id } });
      if (e.key === "ArrowRight" && next) navigate({ to: "/read/$pageId", params: { pageId: next.id } });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, navigate]);

  if (!page) return <div className="min-h-screen bg-background p-8 text-center">{t("read.loading")}</div>;

  return (
    <div className={`reader-surface relative min-h-screen ${THEME_CLASS[theme]}`}>
      <Watermark userLabel={userLabel} />
      <SiteHeader />

      <header className="sticky top-16 z-20 border-b border-border/60 bg-[var(--reader-bg)]/90 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:flex sm:h-14 sm:justify-between sm:py-0">
          <Link
            to="/book/$bookId"
            params={{ bookId: page.chapter.book.id }}
            className="flex min-w-0 items-center gap-1 text-sm opacity-70 hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{page.chapter.book.title}</span>
          </Link>
          <div className="hidden text-xs opacity-60 md:block">
            {page.chapter.title} · p.{page.page_number}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CamStatusBadge status={camStatus} label={detectedLabel} />

            {/* font size */}
            <div className="flex items-center rounded-full border border-border/70">
              <button
                type="button"
                aria-label="글자 작게"
                className="grid h-7 w-7 place-items-center rounded-l-full disabled:opacity-30"
                disabled={fontSize <= FONT_MIN}
                onClick={() => setFontSize((s) => Math.max(FONT_MIN, s - 1))}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <Type className="h-3.5 w-3.5 opacity-60" />
              <button
                type="button"
                aria-label="글자 크게"
                className="grid h-7 w-7 place-items-center rounded-r-full disabled:opacity-30"
                disabled={fontSize >= FONT_MAX}
                onClick={() => setFontSize((s) => Math.min(FONT_MAX, s + 1))}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* theme */}
            <div className="hidden items-center rounded-full border border-border/70 p-0.5 sm:flex">
              {(["sepia", "paper", "ink"] as ReaderTheme[]).map((th) => (
                <button
                  key={th}
                  type="button"
                  aria-label={th}
                  onClick={() => setTheme(th)}
                  className={`h-5 w-5 rounded-full border border-border/60 ${
                    th === "sepia" ? "bg-[oklch(0.955_0.018_85)]" : th === "paper" ? "bg-white" : "bg-[oklch(0.19_0.012_70)]"
                  } ${theme === th ? "ring-2 ring-primary ring-offset-1 ring-offset-[var(--reader-bg)]" : ""}`}
                />
              ))}
            </div>

            <Button size="sm" variant="ghost" onClick={addBookmark}>
              <Bookmark className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("read.bookmark")}</span>
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 pb-3">
          <TTSControls html={page.content_html} lang={page.chapter.book.language} onSentenceChange={setActiveSentence} />
        </div>

        {/* reading progress */}
        <div className="h-0.5 w-full bg-border/50">
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* fixed side paging — position never shifts with page length */}
      <div className="pointer-events-none fixed inset-y-0 left-0 right-0 z-30 hidden items-center justify-between px-2 lg:flex">
        {prev ? (
          <Link to="/read/$pageId" params={{ pageId: prev.id }} aria-label={t("read.prev")} className="pointer-events-auto">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-border/60 bg-[var(--reader-bg)]/80 shadow-sm backdrop-blur transition hover:bg-[var(--reader-bg)]">
              <ChevronLeft className="h-5 w-5" />
            </span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to="/read/$pageId" params={{ pageId: next.id }} aria-label={t("read.next")} className="pointer-events-auto">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-border/60 bg-[var(--reader-bg)]/80 shadow-sm backdrop-blur transition hover:bg-[var(--reader-bg)]">
              <ChevronRight className="h-5 w-5" />
            </span>
          </Link>
        ) : <span />}
      </div>

      <main className="mx-auto w-full max-w-[46rem] px-6 py-12 sm:px-10 lg:px-4">
        <div className="reader-content no-select">
          <CanvasReader key={theme} html={page.content_html} fontSize={fontSize} lineHeight={1.85} />
        </div>

        {/* mobile / tablet paging bar (fixed at the bottom, never moves) */}
        <div className="h-24 lg:h-6" />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-[var(--reader-bg)]/92 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          {prev ? (
            <Link to="/read/$pageId" params={{ pageId: prev.id }}>
              <Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-4 w-4" />{t("read.prev")}</Button>
            </Link>
          ) : <span />}
          <span className="text-xs opacity-60">
            {idx >= 0 ? `${idx + 1} / ${siblingPages.length}` : ""}
          </span>
          {next ? (
            <Link to="/read/$pageId" params={{ pageId: next.id }}>
              <Button size="sm">{t("read.next")}<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          ) : <span />}
        </div>
      </div>

      {/* desktop page counter — fixed, out of the text column */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 hidden -translate-x-1/2 rounded-full border border-border/60 bg-[var(--reader-bg)]/85 px-3 py-1 text-xs opacity-70 backdrop-blur lg:block">
        {idx >= 0 ? `${idx + 1} / ${siblingPages.length}` : ""}
      </div>
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
