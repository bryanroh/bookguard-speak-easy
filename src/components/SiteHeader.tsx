import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  LogOut,
  Shield,
  Users,
  User as UserIcon,
  LibrarySquare,
  Menu,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/login" });
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-serif leading-tight min-w-0">
          <BookOpen className="h-5 w-5 shrink-0 text-primary" />
          <span className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold tracking-wide sm:text-base lg:text-lg">
              섭리신학연구소
            </span>
            <span className="hidden truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground lg:block">
              Institute for Providence Theology
            </span>
          </span>
        </Link>

        {/* DESKTOP NAV (lg+) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {user && (
            <Link to="/library">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LibrarySquare className="h-4 w-4" />
                <span>{t("nav.library")}</span>
              </Button>
            </Link>
          )}
          <Link to="/publications">
            <Button variant="ghost" size="sm">{t("nav.publications")}</Button>
          </Link>
          <Link to="/editorial-board">
            <Button variant="ghost" size="sm">{t("nav.editorial")}</Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" size="sm">{t("nav.about")}</Button>
          </Link>

          {isAdmin && (
            <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-1 py-0.5">
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:bg-primary/10">
                  <Shield className="h-4 w-4" />
                  <span>{t("nav.admin")}</span>
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:bg-primary/10">
                  <Users className="h-4 w-4" />
                  <span>{t("nav.users")}</span>
                </Button>
              </Link>
            </div>
          )}

          <LanguageSwitcher />

          {user ? (
            <>
              <span className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex">
                <UserIcon className="h-3 w-3" />
                <span className="max-w-[160px] truncate">{user.email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span>{t("nav.signOut")}</span>
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">{t("nav.signIn")}</Button>
            </Link>
          )}
        </nav>

        {/* MOBILE/TABLET TRIGGER (<lg) */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
              <div className="mt-6 flex flex-col gap-1">
                {user && (
                  <Link to="/library" onClick={closeMenu}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <LibrarySquare className="h-4 w-4" />
                      {t("nav.library")}
                    </Button>
                  </Link>
                )}
                <Link to="/publications" onClick={closeMenu}>
                  <Button variant="ghost" className="w-full justify-start">
                    {t("nav.publications")}
                  </Button>
                </Link>
                <Link to="/editorial-board" onClick={closeMenu}>
                  <Button variant="ghost" className="w-full justify-start">
                    {t("nav.editorial")}
                  </Button>
                </Link>
                <Link to="/about" onClick={closeMenu}>
                  <Button variant="ghost" className="w-full justify-start">
                    {t("nav.about")}
                  </Button>
                </Link>

                {isAdmin && (
                  <div className="mt-3 flex flex-col gap-1 rounded-md border border-primary/30 bg-primary/5 p-1">
                    <Link to="/admin" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full justify-start gap-2 text-primary hover:bg-primary/10">
                        <Shield className="h-4 w-4" />
                        {t("nav.admin")}
                      </Button>
                    </Link>
                    <Link to="/admin/users" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full justify-start gap-2 text-primary hover:bg-primary/10">
                        <Users className="h-4 w-4" />
                        {t("nav.users")}
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="mt-4 border-t border-border pt-4">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                        <UserIcon className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <Button variant="outline" onClick={signOut} className="w-full justify-start gap-2">
                        <LogOut className="h-4 w-4" />
                        {t("nav.signOut")}
                      </Button>
                    </div>
                  ) : (
                    <Link to="/login" onClick={closeMenu}>
                      <Button className="w-full">{t("nav.signIn")}</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
