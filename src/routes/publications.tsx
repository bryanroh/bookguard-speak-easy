import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Calendar, ScrollText, GraduationCap, Globe2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/publications")({
  head: () => ({
    meta: [
      { title: "Publications — Institute for Providence Theology" },
      {
        name: "description",
        content:
          "Scholarly digital publications from the Institute for Providence Theology — monographs and essays across theology, philosophy, and the humanities.",
      },
      { property: "og:title", content: "Publications — Institute for Providence Theology" },
      {
        property: "og:description",
        content: "Browse scholarly digital publications by subject, series, and forthcoming volumes.",
      },
    ],
    links: [{ rel: "canonical", href: "https://bookguard-speak-easy.lovable.app/publications" }],
  }),
  component: PublicationsPage,
});

type Book = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  language: string;
  created_at: string;
};

const DISCIPLINES = [
  { key: "theology", label: "Theology", icon: ScrollText, desc: "Systematic, biblical, and historical theology." },
  { key: "philosophy", label: "Philosophy of Religion", icon: GraduationCap, desc: "Metaphysics, epistemology, and ethics." },
  { key: "comparative", label: "Comparative Religion", icon: Globe2, desc: "Traditions in cross-cultural perspective." },
  { key: "humanities", label: "Humanities", icon: BookOpen, desc: "History of ideas, literature, and culture." },
];

const SERIES = [
  {
    name: "Studies in Providence",
    code: "SIP",
    desc: "Monograph series on the doctrine and history of providence.",
  },
  {
    name: "Essays in Philosophical Theology",
    code: "EPT",
    desc: "Short-form scholarly essays at the boundary of philosophy and theology.",
  },
  {
    name: "Texts & Commentaries",
    code: "TC",
    desc: "Critical editions and commentaries on primary sources.",
  },
];

function PublicationsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("books")
      .select("id,title,description,cover_url,language,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBooks(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Catalogue
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Publications
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Scholarly digital monographs and essays issued by the Institute, organised by
            discipline and series.
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Stat label="Published volumes" value={loading ? "—" : String(books.length)} />
            <Stat label="Series" value={String(SERIES.length)} />
            <Stat label="Disciplines" value={String(DISCIPLINES.length)} />
            <Stat label="Languages" value="6" />
          </dl>
        </header>

        {/* Disciplines */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">Browse by Discipline</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DISCIPLINES.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.key} className="rounded-lg border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-serif text-base font-semibold">{d.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Series */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">Series &amp; Collections</h2>
          <div className="mt-5 space-y-3">
            {SERIES.map((s) => (
              <div
                key={s.code}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 font-serif text-xs font-bold text-primary">
                  {s.code}
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Published */}
        <section className="mt-12">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold">Recently Published</h2>
            <Link to="/library" className="text-sm text-muted-foreground hover:text-primary">
              View all →
            </Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : books.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              The inaugural volumes are in preparation. See <em>Forthcoming</em> below.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {books.slice(0, 6).map((b) => (
                <Link
                  key={b.id}
                  to="/book/$bookId"
                  params={{ bookId: b.id }}
                  className="group rounded-lg border border-border bg-card p-5 transition hover:border-primary hover:shadow-md"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Monograph · {b.language.toUpperCase()}
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-primary">
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{b.description}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Published {new Date(b.created_at).getFullYear()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Forthcoming */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">Forthcoming</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Volumes currently in editorial preparation.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FORTHCOMING.map((f) => (
              <div key={f.title} className="rounded-lg border border-dashed border-border bg-card/50 p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{f.expected}</span>
                  <span>·</span>
                  <span>{f.series}</span>
                </div>
                <h3 className="mt-2 font-serif text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm italic text-muted-foreground">{f.author}</p>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial note */}
        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-semibold">A Note on the Catalogue</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The Institute is an independent academic publisher. All volumes are issued for
            scholarly study and critical engagement. Where appropriate, future volumes will
            carry ISBN and DOI identifiers in accordance with standard academic publishing
            practice.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Institute for Providence Theology · 섭리신학연구소
      </footer>
    </div>
  );
}

const FORTHCOMING = [
  {
    title: "On Providence: A Systematic Re-examination",
    author: "Editorial Collective, IPT",
    series: "SIP 01",
    expected: "Forthcoming 2026",
    desc: "A long-form study of the doctrine of providence in modern systematic theology.",
  },
  {
    title: "Reading the Tradition: Essays in Philosophical Theology",
    author: "Editorial Collective, IPT",
    series: "EPT 01",
    expected: "Forthcoming 2026",
    desc: "Collected essays at the intersection of analytic philosophy and theological reasoning.",
  },
  {
    title: "Critical Edition: Selected Sermons",
    author: "Editorial Collective, IPT",
    series: "TC 01",
    expected: "Forthcoming 2026",
    desc: "Annotated edition with historical and theological commentary.",
  },
  {
    title: "Comparative Studies in Religious Experience",
    author: "Editorial Collective, IPT",
    series: "SIP 02",
    expected: "Forthcoming 2027",
    desc: "Cross-tradition study of mystical and religious experience in modern thought.",
  },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-serif text-lg font-semibold">{value}</dd>
    </div>
  );
}
