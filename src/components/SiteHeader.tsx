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
        <Link to="/" className="flex items-center gap-2 font-serif leading-tight">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="flex flex-col">
            <span className="text-base font-semibold tracking-wide sm:text-lg">
              섭리신학연구소
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Institute for Providence Theology
            </span>
          </span>
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

          <Link to="/publications">
            <Button variant="ghost" size="sm">
              <span className="hidden md:inline">{t("nav.publications")}</span>
              <span className="md:hidden">{t("nav.publications")}</span>
            </Button>
          </Link>

          <Link to="/editorial-board">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              <span>{t("nav.editorial")}</span>
            </Button>
          </Link>

          <Link to="/about">
            <Button variant="ghost" size="sm">
              <span>{t("nav.about")}</span>
            </Button>
          </Link>

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
