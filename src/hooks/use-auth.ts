import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const PERMANENT_ADMIN_EMAILS = new Set(["bryanroh17@gmail.com"]);

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAdminRole = async (targetUser: User | null) => {
      if (!targetUser) {
        lastCheckedUserId.current = null;
        if (active) setIsAdmin(false);
        return;
      }

      const email = targetUser.email?.toLowerCase() ?? "";
      if (PERMANENT_ADMIN_EMAILS.has(email)) {
        lastCheckedUserId.current = targetUser.id;
        if (active) setIsAdmin(true);
        return;
      }

      // Skip duplicate lookups after this user's role has already been checked.
      if (lastCheckedUserId.current === targetUser.id) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUser.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) {
        lastCheckedUserId.current = targetUser.id;
        setIsAdmin(!!data);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      const nextUser = s?.user ?? null;
      setSession(s);
      setUser(nextUser);
      // Only reset admin flag when user identity changes (sign-in/out/switch)
      if (lastCheckedUserId.current !== (nextUser?.id ?? null)) {
        setIsAdmin(false);
      }
      setTimeout(async () => {
        await loadAdminRole(nextUser);
        if (active) setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!active) return;
      const nextUser = s?.user ?? null;
      setSession(s);
      setUser(nextUser);
      await loadAdminRole(nextUser);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, loading };
}
