import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Mail, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

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

const ROLES = [
  {
    role: "Editor-in-Chief",
    field: "Systematic Theology",
    desc: "Oversees the editorial direction of the Institute's monograph programme.",
  },
  {
    role: "Associate Editor",
    field: "Philosophy of Religion",
    desc: "Manages the Essays in Philosophical Theology series.",
  },
  {
    role: "Associate Editor",
    field: "Historical Theology",
    desc: "Curates the Texts & Commentaries critical edition series.",
  },
  {
    role: "Editorial Advisor",
    field: "Comparative Religion",
    desc: "Advises on cross-tradition and comparative studies.",
  },
  {
    role: "Editorial Advisor",
    field: "Humanities & History of Ideas",
    desc: "Provides counsel on interdisciplinary humanities volumes.",
  },
  {
    role: "Managing Editor",
    field: "Publication & Production",
    desc: "Coordinates manuscript preparation, copy-editing, and digital production.",
  },
];

function EditorialBoardPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Governance
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Editorial Board
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The Institute operates under a collegial editorial structure. All publications
            pass through editorial review before issue.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Editorial Structure</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {ROLES.map((r) => (
              <div key={r.role + r.field} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap className="h-4 w-4" />
                  <h3 className="font-serif text-base font-semibold text-foreground">{r.role}</h3>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {r.field}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs italic text-muted-foreground">
            Editorial roles are filled by affiliated scholars of the Institute. Named
            appointments are listed on the colophon of each published volume.
          </p>
        </section>

        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Editorial &amp; Review Policy
            </h2>
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Each manuscript is read by at least two editors before acceptance.
            </li>
            <li>
              External readers may be invited for specialised volumes; reader identities
              remain confidential.
            </li>
            <li>
              Authors are required to disclose conflicts of interest and prior publication
              of related material.
            </li>
            <li>
              The Institute follows the spirit of the COPE (Committee on Publication
              Ethics) guidelines on authorship, originality, and corrections.
            </li>
            <li>
              Published volumes may be revised; revisions are issued as new editions with
              clear version notes.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Submissions &amp; Correspondence</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manuscript proposals, editorial correspondence, and review enquiries may be
            directed to the Managing Editor.
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-mono text-muted-foreground">editorial @ providence-theology.org</span>
          </div>
          <p className="mt-2 text-xs italic text-muted-foreground">
            Address shown in unlinked form to limit automated scraping.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Institute for Providence Theology · 섭리신학연구소
      </footer>
    </div>
  );
}
