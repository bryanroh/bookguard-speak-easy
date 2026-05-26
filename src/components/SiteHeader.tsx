import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, LogOut, Shield, Users, User as UserIcon } from "lucide-react";
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-wide">
          <BookOpen className="h-5 w-5 text-primary" />
          섭리 신학 <span className="text-primary">{t("brand.suffix")}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link to="/library"><Button variant="ghost" size="sm">{t("nav.library")}</Button></Link>
              {isAdmin && (
                <>
                  <Link to="/admin"><Button variant="ghost" size="sm"><Shield className="mr-1 h-4 w-4" />{t("nav.admin")}</Button></Link>
                  <Link to="/admin/users"><Button variant="ghost" size="sm"><Users className="mr-1 h-4 w-4" />{t("nav.users")}</Button></Link>
                </>
              )}
              <span className="hidden text-sm text-muted-foreground sm:flex sm:items-center sm:gap-1">
                <UserIcon className="h-3 w-3" />{user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />{t("nav.signOut")}</Button>
            </>
          ) : (
            <Link to="/login"><Button size="sm">{t("nav.signIn")}</Button></Link>
          )}
        </nav>
      </div>
    </header>
  );
}
