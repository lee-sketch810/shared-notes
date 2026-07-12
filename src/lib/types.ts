import type { PartialBlock } from "@blocknote/core";

export interface AppUser {
  id: string;
  email: string;
}

export interface NoteMeta {
  id: string;
  title: string;
  ownerEmail: string;
  updatedAt: string;
  updatedByEmail: string | null;
  /** 사이드바 고정 순서 (작을수록 위). 새 노트는 맨 아래에 추가 */
  sortKey: number;
}

export interface Note extends NoteMeta {
  content: PartialBlock[] | null;
}

/** 데이터 계층 인터페이스 — Supabase(공유) 또는 localStorage(데모) 구현체가 붙는다 */
export interface NoteStore {
  readonly mode: "supabase" | "local";
  readonly canEdit: boolean;
  /** 이 저장소 인스턴스(=이 탭/이 사용자)를 식별. 원격 변경이 '내 것인지' 판별에 사용 */
  readonly actorId: string;
  /** 최초 진입 시 5개 섹션 노트를 (한 번만) 심는다. 이미 있으면 아무것도 안 함 */
  ensureSeeded(): Promise<void>;
  listNotes(): Promise<NoteMeta[]>;
  getNote(id: string): Promise<Note | null>;
  createNote(): Promise<Note>;
  saveNote(
    id: string,
    patch: { title?: string; content?: PartialBlock[] }
  ): Promise<void>;
  deleteNote(id: string): Promise<void>;
  reorderNotes(ids: string[]): Promise<void>;
  listShares(noteId: string): Promise<string[]>;
  addShare(noteId: string, email: string): Promise<void>;
  removeShare(noteId: string, email: string): Promise<void>;
  /** 다른 사용자의 저장 등 원격 변경 알림 구독. 해제 함수 반환 */
  onRemoteChange(cb: () => void): () => void;
}
