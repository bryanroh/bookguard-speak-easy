import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/book/$bookId")({
  head: () => ({ meta: [{ title: "책 — 섭리 신학 e-BOOK" }] }),
  component: BookPage,
});

type Book = { id: string; title: string; description: string | null; language: string };
type Chapter = { id: string; title: string; order_index: number };
type PageRow = { id: string; chapter_id: string; page_number: number };

function BookPage() {
  const t = useT();
  const { bookId } = Route.useParams();
  const { user, isMember, loading } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pagesByChapter, setPagesByChapter] = useState<Record<string, PageRow[]>>({});
  const [lastPageId, setLastPageId] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: b } = await supabase.from("books").select("id,title,description,language").eq("id", bookId).maybeSingle();
      setBook(b);
      const { data: chs } = await supabase.from("chapters").select("id,title,order_index").eq("book_id", bookId).order("order_index");
      setChapters(chs ?? []);
      if (chs && chs.length > 0) {
        const { data: pgs } = await supabase.from("pages").select("id,chapter_id,page_number").in("chapter_id", chs.map((c) => c.id)).order("page_number");
        const map: Record<string, PageRow[]> = {};
        pgs?.forEach((p) => { (map[p.chapter_id] ||= []).push(p); });
        setPagesByChapter(map);
      }
      const { data: prog } = await supabase.from("reading_progress").select("last_page_id").eq("user_id", user.id).eq("book_id", bookId).maybeSingle();
      setLastPageId(prog?.last_page_id ?? null);
    })();
  }, [user, bookId]);

  if (!book) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">{t("book.loading")}</p></div>;

  const firstPageId = chapters.length > 0 ? pagesByChapter[chapters[0].id]?.[0]?.id : null;
  const resumeId = lastPageId || firstPageId;
  const totalPages = Object.values(pagesByChapter).reduce((a, p) => a + p.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/library" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />{t("book.back")}
        </Link>

        <div className="book-stage">
          <div className="book-spread">
            {/* Cover that fades to reveal the spread */}
            <div className="book-cover-overlay">
              <div className="crest">✦ ✦ ✦</div>
            </div>

            {/* Left page — title page */}
            <div className="book-page book-page--left">
              <div className="book-ornament">❦</div>
              <div className="book-rule" />
              <h1 className="book-title-display">{book.title}</h1>
              {book.description && <p className="book-subtitle-display">{book.description}</p>}
              <div className="book-rule mt-8" />
              <div className="book-ornament">✦</div>

              <div className="mt-10 space-y-3 text-center text-sm" style={{ color: "#6b4118", fontFamily: "var(--font-serif)" }}>
                <div>{t("book.totals", { chapters: chapters.length, pages: totalPages })}</div>
                <div className="italic">{t("book.tagline")}</div>
              </div>

              {isMember ? (
                resumeId && (
                  <div className="mt-10 flex justify-center">
                    <Link to="/read/$pageId" params={{ pageId: resumeId }}>
                      <Button size="lg" className="shadow-lg">
                        {lastPageId ? t("book.continue") : t("book.start")}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )
              ) : (
                <div className="mt-10 rounded-md border border-amber-300/60 bg-amber-50/70 p-4 text-center text-sm text-amber-900">
                  {t("book.memberOnly")}
                </div>
              )}
            </div>

            {/* Right page — table of contents */}
            <div className="book-page book-page--right">
              <div className="book-ornament">{t("book.toc")}</div>
              <div className="book-rule" />
              {!isMember ? (
                <p className="mt-8 text-center italic" style={{ color: "#6b4118", fontFamily: "var(--font-serif)" }}>
                  {t("book.tocMemberOnly")}
                </p>
              ) : chapters.length === 0 ? (
                <p className="mt-8 text-center italic" style={{ color: "#6b4118", fontFamily: "var(--font-serif)" }}>
                  {t("book.noChapters")}
                </p>
              ) : (
                <div className="mt-4 space-y-1">
                  {chapters.map((c, i) => {
                    const firstPg = pagesByChapter[c.id]?.[0];
                    return (
                      <Link
                        key={c.id}
                        to={firstPg ? "/read/$pageId" : "/book/$bookId"}
                        params={firstPg ? { pageId: firstPg.id } : { bookId }}
                        className="book-toc-item"
                      >
                        <span>{t("book.chapter", { n: i + 1 })} &nbsp; {c.title}</span>
                        <span className="leader" />
                        <span className="book-toc-page">{firstPg?.page_number ?? "—"}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
