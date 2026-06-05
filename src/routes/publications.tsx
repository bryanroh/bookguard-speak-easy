import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Calendar, ScrollText, GraduationCap, Globe2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

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

function PublicationsPage() {
  const t = useT();
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

  const disciplines = [
    { key: "theology", icon: ScrollText },
    { key: "philosophy", icon: GraduationCap },
    { key: "comparative", icon: Globe2 },
    { key: "humanities", icon: BookOpen },
  ];

  const series = [
    { code: "SIP", nameKey: "pub.s1", descKey: "pub.s1Desc" },
    { code: "EPT", nameKey: "pub.s2", descKey: "pub.s2Desc" },
    { code: "TC", nameKey: "pub.s3", descKey: "pub.s3Desc" },
  ];

  const forthcoming = [
    { titleKey: "forth.t1", series: "SIP 01", year: "2026" },
    { titleKey: "forth.t2", series: "EPT 01", year: "2026" },
    { titleKey: "forth.t3", series: "TC 01", year: "2026" },
    { titleKey: "forth.t4", series: "SIP 02", year: "2027" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {t("pub.eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            {t("pub.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("pub.intro")}</p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Stat label={t("stat.publishedVolumes")} value={loading ? "—" : String(books.length)} />
            <Stat label={t("stat.series")} value={String(series.length)} />
            <Stat label={t("stat.disciplines")} value={String(disciplines.length)} />
            <Stat label={t("stat.languages")} value="6" />
          </dl>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">{t("pub.browseTitle")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {disciplines.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.key} className="rounded-lg border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-serif text-base font-semibold">{t(`disc.${d.key}`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`disc.${d.key}Desc`)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">{t("pub.seriesTitle")}</h2>
          <div className="mt-5 space-y-3">
            {series.map((s) => (
              <div
                key={s.code}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 font-serif text-xs font-bold text-primary">
                  {s.code}
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold">{t(s.nameKey)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(s.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold">{t("pub.recent")}</h2>
            <Link to="/library" className="text-sm text-muted-foreground hover:text-primary">
              {t("pub.viewAll")}
            </Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground">{t("pub.loading")}</p>
          ) : books.length === 0 ? (
            <p
              className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: t("recent.empty") }}
            />
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
                    {t("recent.kind")} · {b.language.toUpperCase()}
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-semibold leading-snug group-hover:text-primary">
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{b.description}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("pub.publishedYear", { year: new Date(b.created_at).getFullYear() })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">{t("forth.title")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {forthcoming.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-lg border border-dashed border-border bg-card/50 p-5"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {t("forth.label")} {f.year}
                  </span>
                  <span>·</span>
                  <span>{f.series}</span>
                </div>
                <h3 className="mt-2 font-serif text-base font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-1 text-sm italic text-muted-foreground">{t("forth.author")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-semibold">{t("pub.noteTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("pub.noteBody")}</p>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("inst.nameEn")} · {t("inst.name")}
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
      <dd className="mt-0.5 font-serif text-lg font-semibold">{value}</dd>
    </div>
  );
}
