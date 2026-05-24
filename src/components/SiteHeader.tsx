import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, LogOut, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-wide">
          <BookOpen className="h-5 w-5 text-primary" />
          섭리 신학 <span className="text-primary">e-BOOK</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/library"><Button variant="ghost" size="sm">도서관</Button></Link>
              {isAdmin && (
                <Link to="/admin"><Button variant="ghost" size="sm"><Shield className="mr-1 h-4 w-4" />관리</Button></Link>
              )}
              <span className="hidden text-sm text-muted-foreground sm:flex sm:items-center sm:gap-1">
                <UserIcon className="h-3 w-3" />{user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />로그아웃</Button>
            </>
          ) : (
            <Link to="/login"><Button size="sm">로그인</Button></Link>
          )}
        </nav>
      </div>
    </header>
  );
}
