import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Feather, Crown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "섭리 신학 e-BOOK" },
      { name: "description", content: "회원 전용 디지털 도서관." },
    ],
  }),
  component: HomePage,
});

type BookCard = { id: string; title: string; description: string | null };

const SHELVES: { key: "best" | "new" | "poem"; icon: typeof Crown; accent: string }[] = [
  { key: "best", icon: Crown, accent: "from-amber-200/30 to-amber-500/10" },
  { key: "new", icon: Sparkles, accent: "from-sky-200/30 to-sky-500/10" },
  { key: "poem", icon: Feather, accent: "from-rose-200/30 to-rose-500/10" },
];

function HomePage() {
  const t = useT();
  const [books, setBooks] = useState<BookCard[]>([]);
  useEffect(() => {
    supabase
      .from("books")
      .select("id,title,description")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setBooks(data ?? []));
  }, []);

  // distribute books across shelves (round-robin)
  const shelfBooks = SHELVES.map((_, i) => books.filter((_, j) => j % 3 === i));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            섭리 신학 <span className="text-primary">{t("brand.suffix")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("home.subtitle")}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/library"><Button size="lg"><BookOpen className="mr-2 h-4 w-4" />{t("home.enterLibrary")}</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">{t("home.loginSignup")}</Button></Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-16 px-4 pb-24">
          {SHELVES.map((shelf, idx) => {
            const Icon = shelf.icon;
            const items = shelfBooks[idx];
            return (
              <div key={shelf.key}>
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-foreground">
                    <Icon className="h-5 w-5 text-primary" />
                    {t(`home.shelf.${shelf.key}`)}
                  </h2>
                  <Link to="/library" className="text-sm text-muted-foreground hover:text-primary">
                    {t("home.more")}
                  </Link>
                </div>

                <div className={`relative rounded-2xl border border-border bg-gradient-to-br ${shelf.accent} p-6`}>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
                    {(items.length > 0 ? items : Array.from({ length: 5 })).map((b: any, i) => (
                      <BookSpine key={b?.id ?? `ph-${i}`} book={b} />
                    ))}
                  </div>
                  {/* wooden shelf bar */}
                  <div className="pointer-events-none absolute inset-x-6 bottom-3 h-2 rounded-full bg-gradient-to-r from-[#7a4a25]/60 via-[#a06a3a]/60 to-[#7a4a25]/60 shadow-[0_4px_10px_rgba(0,0,0,0.18)]" />
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function BookSpine({ book }: { book?: BookCard }) {
  const t = useT();
  const title = book?.title ?? t("home.comingSoon");
  const inner = (
    <div className="group relative mx-auto h-48 w-32 [perspective:800px]">
      <div
        className="relative h-full w-full rounded-r-md rounded-l-sm shadow-[0_10px_25px_-8px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:[transform:rotateY(-12deg)]"
        style={{
          background:
            "linear-gradient(135deg,#3a2a1a 0%,#5a3a22 45%,#42301d 100%)",
        }}
      >
        {/* spine highlight */}
        <div className="absolute left-2 top-0 h-full w-[3px] bg-gradient-to-b from-amber-200/50 via-amber-300/20 to-amber-200/40" />
        {/* gold trim */}
        <div className="absolute inset-x-3 top-4 h-px bg-amber-200/40" />
        <div className="absolute inset-x-3 bottom-4 h-px bg-amber-200/40" />
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
          <span className="font-serif text-[13px] font-semibold leading-snug text-amber-50/95 line-clamp-5">
            {title}
          </span>
        </div>
        {/* pages edge */}
        <div className="absolute -right-1 inset-y-2 w-1 rounded-r-sm bg-gradient-to-b from-amber-50 via-amber-100 to-amber-50" />
      </div>
    </div>
  );
  if (!book) return inner;
  return (
    <Link to="/book/$bookId" params={{ bookId: book.id }}>
      {inner}
    </Link>
  );
}
