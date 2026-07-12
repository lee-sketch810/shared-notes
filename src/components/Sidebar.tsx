import type { NoteMeta } from "../lib/types";

interface Props {
  notes: NoteMeta[];
  selectedId: string | null;
  userEmail: string;
  mode: "supabase" | "local";
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onSignOut?: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function Sidebar({
  notes,
  selectedId,
  userEmail,
  mode,
  onSelect,
  onCreate,
  onDelete,
  onSignOut,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">📝 밥 코딩 공유 노트</span>
        <button className="btn-small" onClick={onCreate} title="새 노트">
          +
        </button>
      </div>

      {mode === "local" && (
        <div className="demo-badge" title="Supabase 키를 설정하면 실제 공유 모드로 전환됩니다">
          로컬 데모 모드
        </div>
      )}

      <ul className="note-list">
        {notes.length === 0 && (
          <li className="note-list-empty">아직 노트가 없어요</li>
        )}
        {notes.map((n) => (
          <li
            key={n.id}
            className={`note-item ${n.id === selectedId ? "selected" : ""}`}
            onClick={() => onSelect(n.id)}
          >
            <div className="note-item-main">
              <span className="note-item-title">
                {n.title || "제목 없음"}
                {n.ownerEmail !== userEmail && (
                  <span className="shared-tag" title={`${n.ownerEmail} 님이 공유`}>
                    공유됨
                  </span>
                )}
              </span>
              <span className="note-item-time">{formatTime(n.updatedAt)}</span>
            </div>
            <button
              className="note-item-delete"
              title="삭제"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(n.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <span className="user-email" title={userEmail}>
          {userEmail}
        </span>
        {onSignOut && (
          <button className="btn-link" onClick={onSignOut}>
            로그아웃
          </button>
        )}
      </div>
    </aside>
  );
}
