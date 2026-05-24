import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAdminRole = async (targetUser: User | null) => {
      if (!targetUser) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUser.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setIsAdmin(!!data);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setIsAdmin(false);
      setTimeout(() => loadAdminRole(s?.user ?? null), 0);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      await loadAdminRole(s?.user ?? null);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, loading };
}
