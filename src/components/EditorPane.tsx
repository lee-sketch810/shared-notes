import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { ko } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Note, NoteStore } from "../lib/types";

interface Props {
  note: Note;
  store: NoteStore;
  onSaved: () => void;
  onShare: () => void;
  canShare: boolean;
}

type SaveState = "idle" | "dirty" | "saving" | "saved";

const SAVE_DEBOUNCE_MS = 800;

export default function EditorPane({
  note,
  store,
  onSaved,
  onShare,
  canShare,
}: Props) {
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ title?: string; content?: unknown } | null>(null);

  const editor = useCreateBlockNote({
    dictionary: ko,
    initialContent:
      note.content && note.content.length > 0 ? note.content : undefined,
  });

  function scheduleSave(patch: { title?: string; content?: unknown }) {
    pendingRef.current = { ...pendingRef.current, ...patch };
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }

  async function flush() {
    const patch = pendingRef.current;
    if (!patch) return;
    pendingRef.current = null;
    setSaveState("saving");
    try {
      await store.saveNote(note.id, patch as never);
      setSaveState("saved");
      onSaved();
    } catch {
      setSaveState("dirty");
    }
  }

  // 노트를 떠날 때(언마운트) 남은 변경사항 즉시 저장
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current) {
        const patch = pendingRef.current;
        pendingRef.current = null;
        void store.saveNote(note.id, patch as never);
      }
    };
  }, [note.id, store]);

  return (
    <div className="editor-pane">
      <div className="editor-toolbar">
        <span className={`save-indicator ${saveState}`}>
          {saveState === "saving" && "저장 중…"}
          {saveState === "dirty" && "수정됨"}
          {saveState === "saved" && "저장됨 ✓"}
        </span>
        {canShare && store.mode === "supabase" && (
          <button className="btn-small" onClick={onShare}>
            공유
          </button>
        )}
        {canShare && store.mode === "local" && (
          <button
            className="btn-small"
            title="로컬 데모 모드에서는 같은 브라우저의 다른 탭과만 공유됩니다"
            onClick={onShare}
          >
            공유
          </button>
        )}
      </div>
      <input
        className="title-input"
        placeholder="제목 없음"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleSave({ title: e.target.value });
        }}
      />
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => scheduleSave({ content: editor.document })}
      />
    </div>
  );
}
