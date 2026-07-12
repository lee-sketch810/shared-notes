import { useCallback, useEffect, useRef, useState } from "react";
import type { AppUser, Note, NoteMeta, NoteStore } from "../lib/types";
import Sidebar from "./Sidebar";
import EditorPane from "./EditorPane";
import ShareDialog from "./ShareDialog";

interface Props {
  user: AppUser;
  store: NoteStore;
  onSignOut?: () => void;
}

export default function Workspace({ user, store, onSignOut }: Props) {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  // 원격 변경으로 다시 불러올 때 에디터를 재마운트시키는 버전 카운터
  const [loadVersion, setLoadVersion] = useState(0);
  const [remoteUpdated, setRemoteUpdated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const noteRef = useRef<Note | null>(null);
  noteRef.current = note;

  const refreshList = useCallback(async () => {
    setNotes(await store.listNotes());
  }, [store]);

  // 최초 진입: 필요 시 5개 섹션 시드 → 목록 로드 → 첫 번째 노트(메뉴 최상단) 자동 열기
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await store.ensureSeeded();
      } catch (e) {
        console.error("seed failed", e);
      }
      const list = await store.listNotes();
      if (cancelled) return;
      setNotes(list);
      if (list.length > 0) {
        openNote(list[0].id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // 원격 변경 감지: 목록 갱신 + 열려 있는 노트가 남이 고친 것이면 배너 표시
  useEffect(() => {
    return store.onRemoteChange(async () => {
      await refreshList();
      const current = noteRef.current;
      if (!current) return;
      const fresh = await store.getNote(current.id);
      if (!fresh) {
        // 노트가 삭제됨
        setNote(null);
        setSelectedId(null);
        return;
      }
      if (
        fresh.updatedAt !== current.updatedAt &&
        fresh.updatedByEmail !== store.actorId
      ) {
        setRemoteUpdated(true);
      }
    });
  }, [store, refreshList]);

  const openNote = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setRemoteUpdated(false);
      const n = await store.getNote(id);
      setNote(n);
      setLoadVersion((v) => v + 1);
    },
    [store]
  );

  async function handleCreate() {
    const n = await store.createNote();
    await refreshList();
    setSelectedId(n.id);
    setNote(n);
    setRemoteUpdated(false);
    setLoadVersion((v) => v + 1);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 노트를 삭제할까요?")) return;
    await store.deleteNote(id);
    if (selectedId === id) {
      setSelectedId(null);
      setNote(null);
    }
    await refreshList();
  }

  async function handleSaved() {
    // 저장 후 목록의 제목·시간 갱신 (로컬 변경이므로 배너는 띄우지 않음)
    await refreshList();
    const current = noteRef.current;
    if (current) {
      const fresh = await store.getNote(current.id);
      if (fresh) {
        noteRef.current = { ...fresh, content: current.content };
        setNote((prev) =>
          prev && prev.id === fresh.id
            ? { ...prev, updatedAt: fresh.updatedAt, updatedByEmail: fresh.updatedByEmail }
            : prev
        );
      }
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        userEmail={user.email}
        mode={store.mode}
        onSelect={openNote}
        onHome={() => {
          if (notes.length > 0) void openNote(notes[0].id);
        }}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onSignOut={onSignOut}
      />
      <main className="main-pane">
        {note ? (
          <>
            {remoteUpdated && (
              <div className="remote-banner">
                다른 사람이 이 노트를 수정했어요.
                <button
                  className="btn-small"
                  onClick={() => openNote(note.id)}
                >
                  최신 내용 불러오기
                </button>
              </div>
            )}
            <EditorPane
              key={`${note.id}:${loadVersion}`}
              note={note}
              store={store}
              onSaved={handleSaved}
              onShare={() => setShareOpen(true)}
              canShare={note.ownerEmail === user.email}
            />
            {shareOpen && (
              <ShareDialog
                note={note}
                store={store}
                onClose={() => setShareOpen(false)}
              />
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>왼쪽에서 노트를 선택하거나 새 노트를 만드세요.</p>
            <button className="btn-primary" onClick={handleCreate}>
              + 새 노트
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
