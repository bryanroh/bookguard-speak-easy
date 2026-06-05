import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Mail, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/editorial-board")({
  head: () => ({
    meta: [
      { title: "Editorial Board — Institute for Providence Theology" },
      {
        name: "description",
        content:
          "Editorial structure, peer-review policy, and publication ethics of the Institute for Providence Theology.",
      },
      { property: "og:title", content: "Editorial Board — Institute for Providence Theology" },
      {
        property: "og:description",
        content: "Editorial structure, peer-review policy, and publication ethics.",
      },
    ],
    links: [{ rel: "canonical", href: "https://bookguard-speak-easy.lovable.app/editorial-board" }],
  }),
  component: EditorialBoardPage,
});

function EditorialBoardPage() {
  const t = useT();
  const roles = [1, 2, 3, 4, 5, 6];
  const policies = ["eb.p1", "eb.p2", "eb.p3", "eb.p4", "eb.p5"];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {t("eb.eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            {t("eb.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("eb.intro")}</p>
        </header>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">{t("eb.structureTitle")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {roles.map((n) => (
              <div key={n} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap className="h-4 w-4" />
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {t(`eb.role${n}`)}
                  </h3>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {t(`eb.role${n}Field`)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t(`eb.role${n}Desc`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs italic text-muted-foreground">{t("eb.note")}</p>
        </section>

        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-serif text-xl font-semibold text-foreground">
              {t("eb.policyTitle")}
            </h2>
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {policies.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">{t("eb.submitTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("eb.submitBody")}</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-mono text-muted-foreground">
              editorial @ providence-theology.org
            </span>
          </div>
          <p className="mt-2 text-xs italic text-muted-foreground">{t("eb.submitNote")}</p>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("inst.nameEn")} · {t("inst.name")}
      </footer>
    </div>
  );
}
