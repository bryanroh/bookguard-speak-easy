import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "개인정보처리방침 — 섭리 웹북" },
      { name: "description", content: "섭리 웹북 개인정보처리방침" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 font-serif text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-primary" />
        섭리 웹북
      </Link>
      <h1 className="mb-2 font-serif text-3xl font-semibold">개인정보처리방침</h1>
      <p className="mb-8 text-sm text-muted-foreground">시행일: 2026년 6월 15일</p>

      <div className="space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. 개인정보 처리자 (Data Controller)</h2>
          <p>섭리신학연구소 (Institute for Providence Theology) — 이하 "회사"</p>
          <p className="text-sm text-muted-foreground">문의: privacy@providencetheology.org</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. 수집하는 개인정보 항목 및 목적</h2>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="border border-border p-2 text-left">항목</th>
                <th className="border border-border p-2 text-left">수집 목적</th>
                <th className="border border-border p-2 text-left">법적 근거</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">이메일</td>
                <td className="border border-border p-2">계정 식별, 로그인, 영수증 발송, 고객 지원</td>
                <td className="border border-border p-2">계약 이행</td>
              </tr>
              <tr>
                <td className="border border-border p-2">비밀번호(해시)</td>
                <td className="border border-border p-2">본인 인증</td>
                <td className="border border-border p-2">계약 이행</td>
              </tr>
              <tr>
                <td className="border border-border p-2">이름</td>
                <td className="border border-border p-2">영수증 및 세금계산서 발행</td>
                <td className="border border-border p-2">법적 의무</td>
              </tr>
              <tr>
                <td className="border border-border p-2">접속 로그, 기기 정보, IP</td>
                <td className="border border-border p-2">보안, 부정 이용 방지, 서비스 개선</td>
                <td className="border border-border p-2">정당한 이익</td>
              </tr>
              <tr>
                <td className="border border-border p-2">카메라 영상 (저장하지 않음)</td>
                <td className="border border-border p-2">콘텐츠 유출 방지(촬영기기 감지) — 영상은 기기 내에서만 처리되며 서버 전송 없음</td>
                <td className="border border-border p-2">동의</td>
              </tr>
              <tr>
                <td className="border border-border p-2">결제 정보</td>
                <td className="border border-border p-2">Paddle.com이 직접 수집·처리 (회사는 보유하지 않음)</td>
                <td className="border border-border p-2">계약 이행</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. 제3자 제공 및 처리 위탁</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            <li><strong>Paddle.com Market Limited</strong> — Merchant of Record, 결제 처리, 세금 신고, 영수증 발송</li>
            <li><strong>Supabase / Cloudflare</strong> — 데이터 호스팅 및 인프라 (EU/US 리전)</li>
            <li>법령에 의한 요청 시 관할 기관</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. 보유 및 이용 기간</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            <li>회원 정보: 회원 탈퇴 시 즉시 삭제</li>
            <li>결제 기록: 전자상거래법에 따라 5년 보관</li>
            <li>접속 로그: 통신비밀보호법에 따라 3개월 보관</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. 이용자의 권리</h2>
          <p className="text-sm">
            이용자는 언제든지 본인 정보의 열람, 수정, 삭제, 처리 정지, 이전을 요청할 수 있으며,
            동의를 철회할 권리가 있습니다. EU/UK 이용자는 GDPR/UK GDPR에 따른 권리를 행사할 수 있으며,
            감독기관에 민원을 제기할 수 있습니다.
          </p>
          <p className="mt-2 text-sm">요청: <a href="mailto:privacy@providencetheology.org" className="text-primary underline">privacy@providencetheology.org</a></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. 보안 조치</h2>
          <p className="text-sm">
            전송 구간 암호화(TLS), 저장 비밀번호 해시(bcrypt/scrypt), 접근 권한 분리(RLS), 정기 보안 점검을 수행합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. 국외 이전</h2>
          <p className="text-sm">
            서비스 제공을 위해 EU/US 소재 클라우드(Supabase, Cloudflare, Paddle)에 데이터가 이전될 수 있으며,
            표준계약조항(SCCs) 등 적절한 안전장치를 적용합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. 쿠키</h2>
          <p className="text-sm">
            서비스 운영에 필요한 필수 쿠키(로그인 세션)만 사용합니다. 분석/마케팅 쿠키는 별도 동의 시에만 사용됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
