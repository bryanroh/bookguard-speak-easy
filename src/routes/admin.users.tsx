import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, User as UserIcon, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "회원 관리 — 섭리 신학 e-BOOK" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsersPage,
});

type Profile = { id: string; email: string | null; display_name: string | null; created_at: string };
type RoleRow = { user_id: string; role: "admin" | "member" | "user" };

function AdminUsersPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, Set<string>>>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/login" });
      else if (!isAdmin) navigate({ to: "/library" });
    }
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    setBusy(true);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    setProfiles((ps as Profile[]) ?? []);
    const map: Record<string, Set<string>> = {};
    ((rs as RoleRow[]) ?? []).forEach((r) => {
      (map[r.user_id] ||= new Set()).add(r.role);
    });
    setRoles(map);
    setBusy(false);
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  const setMember = async (userId: string, makeMember: boolean) => {
    if (makeMember) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "member" });
      if (error && !error.message.includes("duplicate")) return toast.error(error.message);
      toast.success("정회원으로 승격");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "member");
      if (error) return toast.error(error.message);
      toast.success("일반회원으로 변경");
    }
    await refresh();
  };

  if (loading || !isAdmin)
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-8 text-center">권한 확인 중…</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/admin" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />관리
        </Link>
        <div className="mb-5 border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">관리자 전용</p>
          <h1 className="font-sans text-3xl font-bold">회원 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            정회원은 모든 책의 본문을 읽을 수 있고, 일반회원은 책 제목과 줄거리(설명)만 볼 수 있습니다.
          </p>
        </div>

        {busy ? (
          <p className="text-muted-foreground">불러오는 중…</p>
        ) : (
          <section className="overflow-hidden rounded-md border border-border bg-background">
            <div className="grid grid-cols-[2fr_2fr_1fr_1.4fr] items-center border-b border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span>이름</span>
              <span>이메일</span>
              <span>등급</span>
              <span className="text-right">변경</span>
            </div>
            <ul className="divide-y divide-border">
              {profiles.map((p) => {
                const userRoles = roles[p.id] ?? new Set<string>();
                const isAdminRole = userRoles.has("admin");
                const isMemberRole = userRoles.has("member") || isAdminRole;
                return (
                  <li key={p.id} className="grid grid-cols-[2fr_2fr_1fr_1.4fr] items-center gap-3 px-4 py-3 text-sm">
                    <span className="truncate font-medium">{p.display_name || "(이름 없음)"}</span>
                    <span className="truncate text-muted-foreground">{p.email}</span>
                    <span className="text-xs">
                      {isAdminRole ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                          <Shield className="h-3 w-3" />관리자
                        </span>
                      ) : isMemberRole ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Crown className="h-3 w-3" />정회원
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          <UserIcon className="h-3 w-3" />일반회원
                        </span>
                      )}
                    </span>
                    <div className="flex justify-end">
                      {isAdminRole ? (
                        <span className="text-xs text-muted-foreground">관리자는 변경 불가</span>
                      ) : isMemberRole ? (
                        <Button size="sm" variant="outline" onClick={() => setMember(p.id, false)}>
                          일반회원으로
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setMember(p.id, true)}>
                          <Crown className="mr-1 h-3 w-3" />정회원 승격
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
              {profiles.length === 0 && (
                <li className="px-4 py-12 text-center text-sm text-muted-foreground">회원이 없습니다.</li>
              )}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
