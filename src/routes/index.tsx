import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Shield, Volume2, Eye } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "섭리 웹북 — 보안 디지털 도서관" },
      { name: "description", content: "회원 전용 보안 웹북. 워터마크 추적 + 음성 읽기 + 진도 자동 저장." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            섭리 <span className="text-primary">웹북</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            회원 전용 보안 디지털 도서관. 본문 위에 회원 정보 워터마크가 표시되며,
            캡처 시도는 자동으로 기록됩니다.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/library"><Button size="lg"><BookOpen className="mr-2 h-4 w-4" />도서관 입장</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">로그인 / 가입</Button></Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: "7중 보안", desc: "우클릭·복사·인쇄·F12·PrintScreen 차단 + 캡처 로그" },
              { icon: Eye, title: "추적 워터마크", desc: "회원 이름·이메일·시각이 본문 위에 반투명 표시" },
              { icon: Volume2, title: "음성 읽기", desc: "5개 언어 TTS, 재생·속도 조절·문장 하이라이트" },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border border-border bg-card p-6">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
