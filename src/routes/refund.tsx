import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "환불 정책 — 섭리 웹북" },
      { name: "description", content: "섭리 웹북 환불 정책" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 font-serif text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-primary" />
        섭리 웹북
      </Link>
      <h1 className="mb-2 font-serif text-3xl font-semibold">환불 정책</h1>
      <p className="mb-8 text-sm text-muted-foreground">시행일: 2026년 6월 15일</p>

      <div className="space-y-5 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">30일 환불 보장</h2>
          <p>
            결제일로부터 <strong>30일 이내</strong>에 만족하지 못하신 경우 전액 환불을 요청하실 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">환불 요청 방법</h2>
          <p>
            환불은 Merchant of Record인 <strong>Paddle.com</strong>에서 처리됩니다.
          </p>
          <ul className="ml-5 mt-2 list-disc space-y-1 text-sm">
            <li>결제 시 받으신 영수증 이메일에서 "Manage" 링크 클릭 후 환불 요청</li>
            <li>또는 <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> 방문</li>
            <li>또는 <a href="mailto:contact@providencetheology.org" className="text-primary underline">contact@providencetheology.org</a>으로 연락</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">처리 기간</h2>
          <p>승인된 환불은 영업일 기준 5~10일 내에 결제 수단으로 환급됩니다.</p>
        </section>

        <section className="border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            본 정책은 Paddle의{" "}
            <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Refund Policy
            </a>
            를 보완합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
