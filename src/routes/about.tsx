import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Library, ScrollText } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Institute for Providence Theology" },
      {
        name: "description",
        content:
          "Institute for Providence Theology (섭리신학연구소) is an independent academic research institute publishing scholarly digital works in theology, philosophy, and the humanities.",
      },
      { property: "og:title", content: "About — Institute for Providence Theology" },
      {
        property: "og:description",
        content:
          "An independent academic research institute publishing scholarly digital works in theology, philosophy, and the humanities.",
      },
      { property: "og:url", content: "https://bookguard-speak-easy.lovable.app/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://bookguard-speak-easy.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const t = useT();

  const cards = [
    { key: "c1", icon: GraduationCap },
    { key: "c2", icon: Library },
    { key: "c3", icon: ScrollText },
    { key: "c4", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {t("about.eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            {t("inst.nameEn")}
          </h1>
          <p className="mt-2 font-serif text-xl text-muted-foreground">{t("inst.name")}</p>
          <p className="mt-4 text-sm italic text-muted-foreground">{t("about.tagline")}</p>
        </header>

        <section className="prose prose-neutral mt-10 max-w-none space-y-6 text-foreground/90">
          <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: t("about.p1") }} />
          <p className="leading-relaxed">{t("about.p2")}</p>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Icon className="h-4 w-4" />
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {t(`about.${c.key}`)}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`about.${c.key}Desc`)}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">{t("about.statementTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("about.statementBody")}
          </p>
        </section>

        <div className="mt-12 flex justify-center">
          <Link to="/library">
            <Button size="lg">
              <BookOpen className="mr-2 h-4 w-4" />
              {t("about.browseCta")}
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("inst.nameEn")} · {t("inst.name")}
        <br />
        {t("about.tagline")}
      </footer>
    </div>
  );
}
