import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRoles = async (targetUser: User | null) => {
      if (!targetUser) {
        lastCheckedUserId.current = null;
        if (active) {
          setIsAdmin(false);
          setIsMember(false);
        }
        return;
      }
      if (lastCheckedUserId.current === targetUser.id) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUser.id);
      if (active) {
        lastCheckedUserId.current = targetUser.id;
        const roles = (data ?? []).map((r: { role: string }) => r.role);
        const admin = roles.includes("admin");
        setIsAdmin(admin);
        // 정회원: admin도 포함, 또는 명시적 'member' 역할
        setIsMember(admin || roles.includes("member"));
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      const nextUser = s?.user ?? null;
      setSession(s);
      setUser(nextUser);
      if (lastCheckedUserId.current !== (nextUser?.id ?? null)) {
        setIsAdmin(false);
        setIsMember(false);
      }
      setTimeout(async () => {
        await loadRoles(nextUser);
        if (active) setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!active) return;
      const nextUser = s?.user ?? null;
      setSession(s);
      setUser(nextUser);
      await loadRoles(nextUser);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, isMember, loading };
}
