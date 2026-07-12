import { useEffect, useState } from "react";
import type { Note, NoteStore } from "../lib/types";

interface Props {
  note: Note;
  store: NoteStore;
  onClose: () => void;
}

export default function ShareDialog({ note, store, onClose }: Props) {
  const [shares, setShares] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setShares(await store.listShares(note.id));
  }

  useEffect(() => {
    refresh();
  }, [note.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await store.addShare(note.id, target);
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(target: string) {
    await store.removeShare(note.id, target);
    await refresh();
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">노트 공유</h2>
        <p className="dialog-sub">
          상대방이 <strong>가입할 때 쓴 이메일</strong>을 추가하면 그 사람의
          목록에 이 노트가 나타납니다.
        </p>
        <form className="share-form" onSubmit={add}>
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            추가
          </button>
        </form>
        {error && <p className="dialog-error">{error}</p>}
        <ul className="share-list">
          {shares.length === 0 && (
            <li className="share-empty">아직 공유한 사람이 없어요</li>
          )}
          {shares.map((s) => (
            <li key={s} className="share-item">
              <span>{s}</span>
              <button className="btn-link" onClick={() => remove(s)}>
                해제
              </button>
            </li>
          ))}
        </ul>
        <div className="dialog-footer">
          <button className="btn-small" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
