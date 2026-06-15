import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "이용약관 — 섭리 웹북" },
      { name: "description", content: "섭리 웹북 이용약관" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 font-serif text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-primary" />
        섭리 웹북
      </Link>
      <h1 className="mb-2 font-serif text-3xl font-semibold">이용약관</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        시행일: 2026년 6월 15일
      </p>

      <div className="prose prose-sm max-w-none space-y-4 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">제1조 (목적)</h2>
          <p>
            본 약관은 섭리신학연구소(이하 "회사")가 제공하는 웹북 및 부속 서비스(이하 "서비스")의 이용과 관련하여
            회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제2조 (서비스의 제공)</h2>
          <p>
            회사는 학술 도서 및 디지털 콘텐츠 열람, 음성 낭독(TTS), 결제 및 구독, 회원 관리 등의 서비스를 제공합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제3조 (계정 및 보안)</h2>
          <p>
            이용자는 본인의 계정 정보(이메일, 비밀번호)에 대한 관리 책임을 지며, 제3자에게 양도하거나 공유할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제4조 (지식재산권)</h2>
          <p>
            서비스 내 모든 콘텐츠(텍스트, 이미지, 음성 등)의 저작권 및 기타 지적재산권은 회사 또는 정당한 권리자에게
            귀속됩니다. 이용자는 개인적 학습 목적 외에 무단으로 복제·배포·전송·촬영·녹화할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제5조 (결제 및 환불)</h2>
          <p>
            본 서비스의 결제 및 청구는 Merchant of Record인 <strong>Paddle.com Market Limited</strong>가
            대행합니다. 결제 관련 약관은 <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Paddle Buyer Terms</a>를 따릅니다.
            환불은 별도의 <Link to="/refund" className="text-primary underline">환불 정책</Link>을 따릅니다.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Our order process is conducted by our online reseller Paddle.com.
            Paddle.com is the Merchant of Record for all our orders.
            Paddle provides all customer service inquiries and handles returns.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제6조 (금지 행위)</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>불법 행위, 사기, 스팸, 타인 권리 침해</li>
            <li>서비스의 보안 침해(악성코드, 무단 스크래핑, 우회 접근 등)</li>
            <li>저작권 및 기타 지적재산권 침해</li>
            <li>화면 캡처·녹화·외부기기 촬영을 통한 콘텐츠 유출</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제7조 (서비스 중단 및 해지)</h2>
          <p>
            회사는 본 약관 위반, 미결제, 보안·사기 위험, 정책 위반 시 서비스 이용을 일시 중지 또는 해지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제8조 (보안 및 무단 사용 금지)</h2>
          <p>
            이용자는 다음 행위를 일체 하지 않을 의무를 부담합니다. 위반 시 회사는 즉시 계정을 정지하고
            <strong> 징벌적 손해배상</strong>을 청구할 수 있습니다.
          </p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>화면 캡처(스크린샷, OS 캡처 도구), 화면 녹화, 외부기기(휴대폰·카메라 등) 촬영</li>
            <li>인쇄, PDF·이미지 추출, 텍스트 복사 및 그 우회 시도</li>
            <li>계정 공유 또는 양도 (1계정 1인 사용 원칙)</li>
            <li>봇, 크롤러, 자동화 스크립트, 스크래핑 도구 등을 통한 자동 접근</li>
            <li>본 서비스의 보안 메커니즘(촬영 감지, 디바이스 핑거프린트, 세션 검증 등) 우회·무력화</li>
            <li>유출된 콘텐츠의 재배포·공유·게시</li>
          </ul>
          <p className="mt-3">
            <strong>손해배상액</strong>은 위반 사실 발생 시 콘텐츠 정가의 <strong>최소 100배 또는 1천만원 중 큰 금액</strong>으로
            정합니다. 이는 저작권법상의 손해배상과 별개이며, 형사 고소(저작권법 제136조 등) 및 부정경쟁방지법상의
            청구권에도 영향을 미치지 않습니다.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            본 조항은 회사가 제공하는 학술 저작물의 가치를 보호하고, 정당한 이용자의 권익을 지키기 위한 것입니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제9조 (책임의 제한)</h2>
          <p>
            서비스는 "있는 그대로(as is)" 제공되며, 법령이 허용하는 최대한도 내에서 회사는 묵시적 보증을 부인합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제10조 (준거법 및 관할)</h2>
          <p>
            본 약관은 대한민국 법률에 따르며, 분쟁 발생 시 민사소송법상 관할 법원에 소를 제기합니다.
          </p>
        </section>

        <section className="border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            문의: <a href="mailto:contact@providencetheology.org" className="text-primary underline">contact@providencetheology.org</a>
          </p>
        </section>
      </div>
    </div>
  );
}
