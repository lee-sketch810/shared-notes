import type { PartialBlock } from "@blocknote/core";
import type { Note, NoteMeta, NoteStore } from "./types";
import { SEED_NOTES, LEGACY_SEED_NOTE_ID } from "./seedNote";

const STORAGE_KEY = "shared-notes-local-v1";
const SEEDED_KEY = "shared-notes-seeded-v2";
const CHANNEL_NAME = "shared-notes-local";

interface LocalNote {
  id: string;
  title: string;
  ownerEmail: string;
  updatedAt: string;
  updatedByEmail: string | null;
  sortKey: number;
  content: PartialBlock[] | null;
  shares: string[];
}

function load(): LocalNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalNote[]) : [];
  } catch {
    return [];
  }
}

function persist(notes: LocalNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function toMeta(n: LocalNote): NoteMeta {
  return {
    id: n.id,
    title: n.title,
    ownerEmail: n.ownerEmail,
    updatedAt: n.updatedAt,
    updatedByEmail: n.updatedByEmail,
    sortKey: n.sortKey ?? 0,
  };
}

/**
 * 로컬 데모 모드 저장소.
 * localStorage에 저장하고 BroadcastChannel로 다른 탭에 변경을 알린다
 * — 탭 두 개를 열면 공유 동작을 그대로 시뮬레이션할 수 있다.
 */
/** 최초 실행 시 섹션 노트들을 한 번만 심는다. 삭제하면 다시 생기지 않음 */
function seedIfFirstRun(userEmail: string) {
  if (localStorage.getItem(SEEDED_KEY)) return;
  // v1 통합 노트가 남아 있으면 제거 (섹션 분리 버전으로 대체)
  let notes = load().filter((n) => n.id !== LEGACY_SEED_NOTE_ID);
  const now = new Date().toISOString();
  SEED_NOTES.forEach((seed, i) => {
    if (!notes.some((n) => n.id === seed.id)) {
      notes.push({
        id: seed.id,
        title: seed.title,
        ownerEmail: userEmail,
        updatedAt: now,
        updatedByEmail: null,
        sortKey: i + 1,
        content: seed.content,
        shares: [],
      });
    }
  });
  persist(notes);
  localStorage.setItem(SEEDED_KEY, "1");
}

export function createLocalStore(userEmail: string): NoteStore {
  // 탭마다 다른 ID → 같은 데모 계정이라도 탭 간 편집을 '다른 사람'처럼 감지
  const actorId = `${userEmail}#${Math.random().toString(36).slice(2, 8)}`;
  seedIfFirstRun(userEmail);
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(CHANNEL_NAME)
      : null;

  function notifyOthers() {
    channel?.postMessage({ type: "changed" });
  }

  return {
    mode: "local",
    canEdit: true,
    actorId,

    // 로컬 모드는 생성자에서 이미 동기적으로 시드됨 → no-op
    async ensureSeeded() {},

    async listNotes() {
      return load()
        .map(toMeta)
        .sort((a, b) => a.sortKey - b.sortKey);
    },

    async getNote(id) {
      const n = load().find((n) => n.id === id);
      if (!n) return null;
      const { shares, ...rest } = n;
      return rest as Note;
    },

    async createNote() {
      const notes = load();
      const now = new Date().toISOString();
      const note: LocalNote = {
        id: crypto.randomUUID(),
        title: "",
        ownerEmail: userEmail,
        updatedAt: now,
        updatedByEmail: actorId,
        sortKey: Date.now(),
        content: null,
        shares: [],
      };
      notes.push(note);
      persist(notes);
      notifyOthers();
      const { shares, ...rest } = note;
      return rest as Note;
    },

    async saveNote(id, patch) {
      const notes = load();
      const n = notes.find((n) => n.id === id);
      if (!n) return;
      if (patch.title !== undefined) n.title = patch.title;
      if (patch.content !== undefined) n.content = patch.content;
      n.updatedAt = new Date().toISOString();
      n.updatedByEmail = actorId;
      persist(notes);
      notifyOthers();
    },

    async deleteNote(id) {
      persist(load().filter((n) => n.id !== id));
      notifyOthers();
    },

    async listShares(noteId) {
      return load().find((n) => n.id === noteId)?.shares ?? [];
    },

    async addShare(noteId, email) {
      const notes = load();
      const n = notes.find((n) => n.id === noteId);
      if (!n) return;
      if (!n.shares.includes(email)) n.shares.push(email);
      persist(notes);
      notifyOthers();
    },

    async removeShare(noteId, email) {
      const notes = load();
      const n = notes.find((n) => n.id === noteId);
      if (!n) return;
      n.shares = n.shares.filter((e) => e !== email);
      persist(notes);
      notifyOthers();
    },

    onRemoteChange(cb) {
      const onMessage = () => cb();
      const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) cb();
      };
      channel?.addEventListener("message", onMessage);
      window.addEventListener("storage", onStorage);
      return () => {
        channel?.removeEventListener("message", onMessage);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
