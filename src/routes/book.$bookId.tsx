import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/book/$bookId")({
  head: () => ({ meta: [{ title: "책 — 섭리 웹북" }] }),
  component: BookPage,
});

type Book = { id: string; title: string; description: string | null; language: string };
type Chapter = { id: string; title: string; order_index: number };
type PageRow = { id: string; chapter_id: string; page_number: number };

function BookPage() {
  const { bookId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pagesByChapter, setPagesByChapter] = useState<Record<string, PageRow[]>>({});
  const [lastPageId, setLastPageId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

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

  if (!book) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">불러오는 중…</p></div>;

  const firstPageId = chapters.length > 0 ? pagesByChapter[chapters[0].id]?.[0]?.id : null;
  const resumeId = lastPageId || firstPageId;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/library" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />도서관</Link>
        <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
        {book.description && <p className="mt-2 text-muted-foreground">{book.description}</p>}

        {resumeId && (
          <div className="mt-6">
            <Link to="/read/$pageId" params={{ pageId: resumeId }}>
              <Button size="lg">{lastPageId ? "이어서 읽기" : "읽기 시작"}<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        )}

        <div className="mt-10 space-y-4">
          <h2 className="font-serif text-xl font-semibold">목차</h2>
          {chapters.length === 0 && <p className="text-muted-foreground">아직 챕터가 없습니다.</p>}
          {chapters.map((c, i) => (
            <div key={c.id} className="rounded-md border border-border bg-card p-4">
              <h3 className="font-serif font-semibold">{i + 1}장. {c.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(pagesByChapter[c.id] ?? []).map((p) => (
                  <Link key={p.id} to="/read/$pageId" params={{ pageId: p.id }}
                    className="rounded-md bg-secondary px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground">
                    p.{p.page_number}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
