import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      미리보기의 모든 결제는 테스트 모드로 진행됩니다.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline"
      >
        자세히 보기
      </a>
    </div>
  );
}
