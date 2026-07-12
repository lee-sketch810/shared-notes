import { useMemo } from "react";
import { editKey, supabase } from "./lib/supabase";
import { createLocalStore } from "./lib/localStore";
import { createSupabaseStore } from "./lib/supabaseStore";
import type { AppUser } from "./lib/types";
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
  const canEdit = Boolean(editKey);
  const user: AppUser = {
    id: canEdit ? "link-editor" : "public-reader",
    email: canEdit ? "링크 편집자" : "읽기 전용",
  };
  const store = useMemo(
    () => createSupabaseStore(supabase!, canEdit),
    [canEdit]
  );
  return <Workspace user={user} store={store} />;
}
