import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { createLocalStore } from "./lib/localStore";
import { createSupabaseStore } from "./lib/supabaseStore";
import type { AppUser } from "./lib/types";
import Login from "./components/Login";
import Workspace from "./components/Workspace";

const LOCAL_USER: AppUser = { id: "local-user", email: "demo@local" };

export default function App() {
  // Supabase 미설정 시 → 로컬 데모 모드로 즉시 진입
  if (!supabase) {
    const store = useMemo(() => createLocalStore(LOCAL_USER.email), []);
    return (
      <Workspace user={LOCAL_USER} store={store} onSignOut={undefined} />
    );
  }
  return <SupabaseApp />;
}

function SupabaseApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user: AppUser | null = session?.user
    ? { id: session.user.id, email: session.user.email ?? "" }
    : null;

  const store = useMemo(
    () => (user ? createSupabaseStore(supabase!, user.id, user.email) : null),
    [user?.id]
  );

  if (loading) return <div className="center-screen">불러오는 중…</div>;
  if (!user || !store) return <Login />;

  return (
    <Workspace
      user={user}
      store={store}
      onSignOut={() => supabase!.auth.signOut()}
    />
  );
}
