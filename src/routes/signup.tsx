import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "회원가입 — 섭리 웹북" },
      { name: "description", content: "섭리 웹북 회원가입 페이지" },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  displayName: z.string().trim().min(1, "이름을 입력해 주세요").max(60),
  email: z.string().trim().email("올바른 이메일을 입력해 주세요").max(255),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다").max(128),
});

function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [loading, setLoading] = useState(false);

  const allRequired = agreeTerms && agreePrivacy;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/library" });
    });
  }, [navigate]);

  const toggleAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ displayName, email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("비밀번호가 일치하지 않습니다");
    if (!agreeTerms) return toast.error("이용약관에 동의해 주세요");
    if (!agreePrivacy) return toast.error("개인정보처리방침에 동의해 주세요");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/library",
        data: {
          display_name: displayName,
          marketing_opt_in: agreeMarketing,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("가입이 완료되었습니다! 이메일을 확인해 주세요.");
    navigate({ to: "/login" });
  };

  const google = async () => {
    if (!agreeTerms || !agreePrivacy) {
      return toast.error("Google 가입 전 필수 약관에 먼저 동의해 주세요");
    }
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/library",
    });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex items-center justify-center gap-2 font-serif text-xl font-semibold"
        >
          <BookOpen className="h-5 w-5 text-primary" />
          섭리 웹북
        </Link>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold">회원가입</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            계정을 만들어 도서관을 이용하세요. 결제에 꼭 필요한 최소 정보만 받습니다.
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">이름 <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
              <p className="mt-1 text-xs text-muted-foreground">영수증 발행에 사용됩니다.</p>
            </div>
            <div>
              <Label htmlFor="email">이메일 <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">비밀번호 <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(8자 이상)</span></Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm">비밀번호 확인 <span className="text-destructive">*</span></Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* 약관 동의 영역 */}
            <div className="mt-4 space-y-2 rounded-md border border-border bg-muted/30 p-3">
              <label className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={agreeTerms && agreePrivacy && agreeMarketing}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>전체 동의</span>
              </label>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="flex-1">
                  <span className="text-destructive">[필수]</span> 이용약관에 동의합니다.{" "}
                  <Link to="/terms" target="_blank" className="text-primary underline">
                    전문 보기
                  </Link>
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="flex-1">
                  <span className="text-destructive">[필수]</span> 개인정보처리방침에 동의합니다.{" "}
                  <Link to="/privacy" target="_blank" className="text-primary underline">
                    전문 보기
                  </Link>
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="flex-1 text-muted-foreground">
                  <span>[선택]</span> 신간/이벤트 안내 메일 수신에 동의합니다.
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !allRequired}>
              {loading ? "처리 중…" : "가입하기"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google} disabled={!allRequired}>
            Google로 가입
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
