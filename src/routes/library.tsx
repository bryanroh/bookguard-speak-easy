import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "도서관 — 섭리 웹북" }] }),
  component: LibraryPage,
});

type Book = { id: string; title: string; description: string | null; cover_url: string | null; language: string };

function LibraryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("books").select("id,title,description,cover_url,language").eq("is_published", true).order("created_at", { ascending: false })
      .then(({ data }) => { setBooks(data ?? []); setBusy(false); });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold">도서관</h1>
        <p className="mt-1 text-sm text-muted-foreground">읽으실 책을 선택하세요.</p>
        {busy ? (
          <p className="mt-8 text-muted-foreground">불러오는 중…</p>
        ) : books.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-border p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">아직 게시된 책이 없습니다.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <Link key={b.id} to="/book/$bookId" params={{ bookId: b.id }}
                className="group rounded-lg border border-border bg-card p-5 transition hover:border-primary hover:shadow-md">
                <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-accent/15">
                  {b.cover_url ? <img src={b.cover_url} alt={b.title} className="h-full w-full rounded-md object-cover" /> : <BookOpen className="h-12 w-12 text-primary/60" />}
                </div>
                <h3 className="font-serif text-lg font-semibold group-hover:text-primary">{b.title}</h3>
                {b.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>}
                <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{b.language.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
