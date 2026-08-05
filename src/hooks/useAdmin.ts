import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const user = data.user;
      setEmail(user?.email ?? null);
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (!active) return;
      setIsAdmin((roles?.length ?? 0) > 0);
      setLoading(false);
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void check();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, isAdmin, email };
}