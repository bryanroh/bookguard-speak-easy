import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, LogOut, Shield, Users, User as UserIcon, LibrarySquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-wide">
          <BookOpen className="h-5 w-5 text-primary" />
          섭리 신학 <span className="text-primary">{t("brand.suffix")}</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {user && (
            <Link to="/library">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LibrarySquare className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.library")}</span>
              </Button>
            </Link>
          )}

          {/* 관리자 전용 메뉴 — 시각적으로 강조 */}
          {isAdmin && (
            <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-1 py-0.5">
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:bg-primary/10">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.admin")}</span>
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:bg-primary/10">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.users")}</span>
                </Button>
              </Link>
            </div>
          )}

          <LanguageSwitcher />

          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground lg:flex lg:items-center lg:gap-1">
                <UserIcon className="h-3 w-3" />
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.signOut")}</span>
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">{t("nav.signIn")}</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
