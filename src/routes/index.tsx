import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ScrollText,
  GraduationCap,
  Globe2,
  Library as LibraryIcon,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Institute for Providence Theology — 섭리신학연구소" },
      {
        name: "description",
        content:
          "Independent academic research institute publishing scholarly digital works in theology, philosophy, and the humanities.",
      },
      { property: "og:title", content: "Institute for Providence Theology" },
      {
        property: "og:description",
        content: "Scholarly digital publications in theology, philosophy, and the humanities.",
      },
      { property: "og:url", content: "https://bookguard-speak-easy.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://bookguard-speak-easy.lovable.app/" }],
  }),
  component: HomePage,
});

type BookCard = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  language: string;
};

const DISCIPLINES = [
  {
    key: "theology",
    label: "Theology",
    icon: ScrollText,
    desc: "Systematic, biblical, and historical theology.",
  },
  {
    key: "philosophy",
    label: "Philosophy of Religion",
    icon: GraduationCap,
    desc: "Metaphysics, epistemology, ethics.",
  },
  {
    key: "comparative",
    label: "Comparative Religion",
    icon: Globe2,
    desc: "Traditions in cross-cultural perspective.",
  },
  {
    key: "humanities",
    label: "Humanities",
    icon: BookOpen,
    desc: "History of ideas, literature, culture.",
  },
];

const FORTHCOMING = [
  { title: "On Providence: A Systematic Re-examination", series: "SIP 01", expected: "2026" },
  { title: "Reading the Tradition: Essays in Philosophical Theology", series: "EPT 01", expected: "2026" },
  { title: "Critical Edition: Selected Sermons", series: "TC 01", expected: "2026" },
];

function HomePage() {
  const t = useT();
  const [books, setBooks] = useState<BookCard[]>([]);

  useEffect(() => {
    supabase
      .from("books")
      .select("id,title,description,created_at,language")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setBooks(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* HERO — academic press style */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.4fr_1fr] lg:py-24">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                Institute for Providence Theology
              </p>
              <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Scholarly works in
                <br />
                <span className="text-primary">theology, philosophy,</span>
                <br />
                and the humanities.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                An independent academic research institute publishing peer-reviewed digital
                monographs, essays, and critical editions for scholars and serious readers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/publications">
                  <Button size="lg">
                    <LibraryIcon className="mr-2 h-4 w-4" />
                    Browse Publications
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline">
                    About the Institute
                  </Button>
                </Link>
              </div>

              {/* stats strip */}
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
                <Stat label="Disciplines" value="4" />
                <Stat label="Series" value="3" />
                <Stat label="Languages" value="6" />
                <Stat label="Forthcoming" value={String(FORTHCOMING.length)} />
              </dl>
            </div>

            {/* Editorial quote / colophon block */}
            <aside className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-8">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Editorial Statement
                </p>
                <blockquote className="mt-4 font-serif text-lg leading-relaxed text-foreground">
                  "Scholarship in the long tradition of academic theology — rigorous,
                  text-centred, and addressed to the educated reader."
                </blockquote>
              </div>
              <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
                <p className="font-medium uppercase tracking-wider">섭리신학연구소</p>
                <p className="mt-1">Independent · Academic · Non-denominational</p>
              </div>
            </aside>
          </div>
        </section>

        {/* DISCIPLINES */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                Subject Areas
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">Browse by Discipline</h2>
            </div>
            <Link
              to="/publications"
              className="hidden text-sm text-muted-foreground hover:text-primary sm:inline-flex sm:items-center sm:gap-1"
            >
              All publications <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DISCIPLINES.map((d) => {
              const Icon = d.icon;
              return (
                <Link
                  key={d.key}
                  to="/publications"
                  className="group rounded-lg border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-serif text-lg font-semibold group-hover:text-primary">
                    {d.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* RECENTLY PUBLISHED */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Catalogue
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold">Recently Published</h2>
              </div>
              <Link to="/library" className="text-sm text-muted-foreground hover:text-primary">
                {t("home.more")}
              </Link>
            </div>

            {books.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
                Inaugural volumes are in editorial preparation. See <em>Forthcoming</em> below.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((b) => (
                  <Link
                    key={b.id}
                    to="/book/$bookId"
                    params={{ bookId: b.id }}
                    className="group rounded-lg border border-border bg-background p-6 transition hover:border-primary hover:shadow-md"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Monograph · {b.language.toUpperCase()} · {new Date(b.created_at).getFullYear()}
                    </p>
                    <h3 className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-primary">
                      {b.title}
                    </h3>
                    {b.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {b.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FORTHCOMING */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              In Preparation
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Forthcoming Volumes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FORTHCOMING.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-dashed border-border bg-card/50 p-6"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Forthcoming {f.expected}</span>
                  <span>·</span>
                  <span className="font-mono">{f.series}</span>
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold leading-snug">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs italic text-muted-foreground">
                  Editorial Collective, IPT
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/editorial-board">
              <Button variant="outline">
                Editorial Board &amp; Review Policy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <p className="font-serif text-base font-semibold">Institute for Providence Theology</p>
            <p className="mt-1 text-xs text-muted-foreground">섭리신학연구소</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Independent academic research institute. Theology · Philosophy · Humanities.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Catalogue
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><Link to="/publications" className="hover:text-primary">Publications</Link></li>
              <li><Link to="/library" className="hover:text-primary">Library</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Institute
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/editorial-board" className="hover:text-primary">Editorial Board</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Institute for Providence Theology · 섭리신학연구소
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-serif text-2xl font-semibold">{value}</dd>
    </div>
  );
}
