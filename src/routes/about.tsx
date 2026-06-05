import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Library, ScrollText } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

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
    links: [
      { rel: "canonical", href: "https://bookguard-speak-easy.lovable.app/about" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Institute for Providence Theology",
          alternateName: "섭리신학연구소",
          description:
            "An independent academic research institute publishing scholarly digital works in theology, philosophy, and the humanities.",
          url: "https://bookguard-speak-easy.lovable.app/about",
          knowsAbout: [
            "Theology",
            "Philosophy",
            "Humanities",
            "Religious Studies",
            "Comparative Religion",
            "Academic Publishing",
          ],
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            About the Institute
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Institute for Providence Theology
          </h1>
          <p className="mt-2 font-serif text-xl text-muted-foreground">섭리신학연구소</p>
          <p className="mt-4 text-sm italic text-muted-foreground">
            An independent academic research institute · Theology · Philosophy · Humanities
          </p>
        </header>

        <section className="prose prose-neutral mt-10 max-w-none space-y-6 text-foreground/90">
          <p className="leading-relaxed">
            <strong>Institute for Providence Theology</strong> (섭리신학연구소) is an
            independent academic research institute dedicated to the scholarly study and
            publication of works in <em>theology, philosophy, and the humanities</em>. We
            operate as an independent research and publishing body — not as a religious
            organization, congregation, or denominational body.
          </p>
          <p className="leading-relaxed">
            Our work follows the long tradition of academic theology as practiced in
            university divinity faculties and humanities departments worldwide. We
            publish peer-considered digital monographs, essays, and reference works
            intended for students, scholars, and the educated general reader.
          </p>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <Card icon={GraduationCap} title="Academic in Nature">
            Scholarly research and analysis. Not a religious service, ministry, or
            denominational activity.
          </Card>
          <Card icon={Library} title="Digital Publications">
            Long-form scholarly e-books and monographs, distributed to verified
            members through a secure digital reader.
          </Card>
          <Card icon={ScrollText} title="Research Fields">
            Theology · Philosophy of Religion · Comparative Religion · History of
            Ideas · Humanities.
          </Card>
          <Card icon={BookOpen} title="Comparable Publishers">
            Our publishing model is comparable to academic imprints such as Routledge,
            Brill, De Gruyter, and Oxford Academic.
          </Card>
        </section>

        <section className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Editorial Statement</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            All works published by the Institute are issued as academic publications.
            Content is presented for the purpose of study, scholarly discussion, and
            critical engagement. The Institute does not solicit donations, conduct
            religious services, or operate as a faith-based organization.
          </p>
        </section>

        <div className="mt-12 flex justify-center">
          <Link to="/library">
            <Button size="lg">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Publications
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Institute for Providence Theology · 섭리신학연구소
        <br />
        Independent Academic Research Institute
      </footer>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <h3 className="font-serif text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
