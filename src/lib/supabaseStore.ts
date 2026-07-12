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
  canEdit: boolean
): NoteStore {
  const actor = canEdit ? `링크 편집자-${crypto.randomUUID().slice(0, 6)}` : "읽기 전용";
  return {
    mode: "supabase",
    canEdit,
    actorId: actor,

    async ensureSeeded() {
      // 계정당 1회만 시도 (중복 생성 방지). 이미 노트가 있으면 심지 않음.
      if (!canEdit) return;
      const flag = "shared-notes-link-seeded-v1";
      if (localStorage.getItem(flag)) return;
      const { count, error: cErr } = await supabase
        .from("notes")
        .select("id", { count: "exact", head: true });
      if (cErr) throw cErr;
      if ((count ?? 0) === 0) {
        const now = new Date().toISOString();
        const rows = SEED_NOTES.map((s, i) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          owner_email: "링크 편집자",
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
          owner_email: "링크 편집자",
          updated_by_email: actor,
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
        updated_by_email: actor,
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

    async reorderNotes(ids) {
      const results = await Promise.all(
        ids.map((id, index) =>
          supabase
            .from("notes")
            .update({ sort_key: index, updated_by_email: actor })
            .eq("id", id)
        )
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },

    async listShares(noteId) {
      void noteId;
      return [];
    },

    async addShare(noteId, email) {
      void noteId;
      void email;
    },

    async removeShare(noteId, email) {
      void noteId;
      void email;
    },

    onRemoteChange(cb) {
      const channel = supabase
        .channel("notes-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notes" },
          () => cb()
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}
