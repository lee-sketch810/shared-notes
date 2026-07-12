import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartialBlock } from "@blocknote/core";
import type { Note, NoteMeta, NoteStore } from "./types";
import { SEED_NOTES } from "./seedNote";

interface NoteRow {
  id: string;
  title: string;
  owner_email: string;
  updated_at: string;
  updated_by_email: string | null;
  sort_key: number;
  content?: PartialBlock[] | null;
}

function toMeta(r: NoteRow): NoteMeta {
  return {
    id: r.id,
    title: r.title,
    ownerEmail: r.owner_email,
    updatedAt: r.updated_at,
    updatedByEmail: r.updated_by_email,
    sortKey: r.sort_key ?? 0,
  };
}

/** Supabase 기반 공유 저장소 — RLS로 소유자·공유대상만 접근 가능 */
export function createSupabaseStore(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): NoteStore {
  return {
    mode: "supabase",
    actorId: userEmail,

    async ensureSeeded() {
      // 계정당 1회만 시도 (중복 생성 방지). 이미 노트가 있으면 심지 않음.
      const flag = `shared-notes-supabase-seeded-${userId}`;
      if (localStorage.getItem(flag)) return;
      const { count, error: cErr } = await supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId);
      if (cErr) throw cErr;
      if ((count ?? 0) === 0) {
        const now = new Date().toISOString();
        const rows = SEED_NOTES.map((s, i) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          owner_id: userId,
          owner_email: userEmail,
          updated_by_email: null,
          updated_at: now,
          sort_key: i + 1,
        }));
        // 이미 존재하면(다른 사람이 먼저 심음) 무시
        const { error } = await supabase
          .from("notes")
          .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
        if (error) throw error;
      }
      localStorage.setItem(flag, "1");
    },

    async listNotes() {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, owner_email, updated_at, updated_by_email, sort_key")
        .order("sort_key", { ascending: true });
      if (error) throw error;
      return (data as NoteRow[]).map(toMeta);
    },

    async getNote(id) {
      const { data, error } = await supabase
        .from("notes")
        .select(
          "id, title, owner_email, updated_at, updated_by_email, sort_key, content"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as NoteRow;
      return { ...toMeta(r), content: r.content ?? null };
    },

    async createNote() {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          title: "",
          content: null,
          owner_id: userId,
          owner_email: userEmail,
          updated_by_email: userEmail,
          sort_key: Date.now(),
        })
        .select(
          "id, title, owner_email, updated_at, updated_by_email, sort_key, content"
        )
        .single();
      if (error) throw error;
      const r = data as NoteRow;
      return { ...toMeta(r), content: r.content ?? null };
    },

    async saveNote(id, patch) {
      const update: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        updated_by_email: userEmail,
      };
      if (patch.title !== undefined) update.title = patch.title;
      if (patch.content !== undefined) update.content = patch.content;
      const { error } = await supabase.from("notes").update(update).eq("id", id);
      if (error) throw error;
    },

    async deleteNote(id) {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },

    async listShares(noteId) {
      const { data, error } = await supabase
        .from("note_shares")
        .select("email")
        .eq("note_id", noteId);
      if (error) throw error;
      return (data as { email: string }[]).map((r) => r.email);
    },

    async addShare(noteId, email) {
      const { error } = await supabase
        .from("note_shares")
        .insert({ note_id: noteId, email: email.trim().toLowerCase() });
      if (error) throw error;
    },

    async removeShare(noteId, email) {
      const { error } = await supabase
        .from("note_shares")
        .delete()
        .eq("note_id", noteId)
        .eq("email", email);
      if (error) throw error;
    },

    onRemoteChange(cb) {
      const channel = supabase
        .channel("notes-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notes" },
          () => cb()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "note_shares" },
          () => cb()
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}
