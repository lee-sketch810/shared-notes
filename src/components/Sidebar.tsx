import { useState } from "react";
import type { NoteMeta } from "../lib/types";

const HOME_NOTE_ID = "b0bc0d19-0000-4000-8000-000000000000";

interface Props {
  notes: NoteMeta[];
  selectedId: string | null;
  userEmail: string;
  mode: "supabase" | "local";
  canEdit: boolean;
  onSelect: (id: string) => void;
  onHome: () => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onMove: (sourceId: string, targetId: string) => void;
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
  canEdit,
  onSelect,
  onHome,
  onCreate,
  onDelete,
  onMove,
  onSignOut,
}: Props) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="sidebar-logo" onClick={onHome} title="홈으로 이동">
          📝 밥 코딩 공유 노트
        </button>
        {canEdit && (
          <button className="btn-small" onClick={onCreate} title="새 노트">
            +
          </button>
        )}
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
            className={`note-item ${n.id === selectedId ? "selected" : ""} ${
              dragOverId === n.id ? "drag-over" : ""
            }`}
            draggable={canEdit && n.id !== HOME_NOTE_ID}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/note-id", n.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              if (!canEdit || n.id === HOME_NOTE_ID) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverId(n.id);
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOverId(null);
              const sourceId = event.dataTransfer.getData("text/note-id");
              if (sourceId && sourceId !== n.id) onMove(sourceId, n.id);
            }}
            onDragEnd={() => setDragOverId(null)}
            onClick={() => onSelect(n.id)}
          >
            {canEdit && n.id !== HOME_NOTE_ID && (
              <span className="note-drag-handle" title="끌어서 순서 변경">
                ⋮⋮
              </span>
            )}
            <div className="note-item-main">
              <span className="note-item-title">
                {n.title || "제목 없음"}
                {mode === "local" && n.ownerEmail !== userEmail && (
                  <span className="shared-tag" title={`${n.ownerEmail} 님이 공유`}>
                    공유됨
                  </span>
                )}
              </span>
              <span className="note-item-time">{formatTime(n.updatedAt)}</span>
            </div>
            {canEdit && (
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
            )}
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
