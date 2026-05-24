import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "섭리 신학 e-BOOK" },
      { name: "description", content: "회원 전용 디지털 도서관." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            섭리 신학 <span className="text-primary">e-BOOK</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            회원 전용 디지털 도서관에 오신 것을 환영합니다.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/library"><Button size="lg"><BookOpen className="mr-2 h-4 w-4" />도서관 입장</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">로그인 / 가입</Button></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
