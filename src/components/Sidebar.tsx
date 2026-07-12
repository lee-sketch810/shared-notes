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
  const [readLinkCopied, setReadLinkCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedNote = notes.find((item) => item.id === selectedId);

  function copyReadOnlyLink() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    const text = url.toString();
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text).catch(() => undefined);
    }
    setReadLinkCopied(true);
    window.setTimeout(() => setReadLinkCopied(false), 1800);
  }

  return (
    <aside className={`sidebar ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
      <div className="sidebar-header">
        <button className="sidebar-logo" onClick={onHome} title="홈으로 이동">
          📝 밥 코딩 공유 노트
        </button>
        <div className="sidebar-header-actions">
          {canEdit && (
            <button className="btn-small" onClick={onCreate} title="새 노트">
              +
            </button>
          )}
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="note-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
            <span>목록</span>
            <span className="mobile-menu-count">{notes.length}</span>
          </button>
        </div>
      </div>

      <button
        className="mobile-current-note"
        type="button"
        onClick={() => setMobileMenuOpen(true)}
      >
        <span className="mobile-current-label">현재 문서</span>
        <strong>{selectedNote?.title || "문서를 선택하세요"}</strong>
        <span className="mobile-current-chevron" aria-hidden="true">⌄</span>
      </button>

      {mode === "local" && (
        <div className="demo-badge" title="Supabase 키를 설정하면 실제 공유 모드로 전환됩니다">
          로컬 데모 모드
        </div>
      )}

      <div
        className="mobile-menu-backdrop"
        aria-hidden="true"
        onClick={() => setMobileMenuOpen(false)}
      />

      <div className="mobile-menu-panel" id="note-navigation">
        <div className="mobile-menu-heading">
          <strong>전체 문서</strong>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="목록 닫기">
            ×
          </button>
        </div>
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
            onClick={() => {
              onSelect(n.id);
              setMobileMenuOpen(false);
            }}
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
                title={`${n.title || "제목 없음"} 삭제`}
                aria-label={`${n.title || "제목 없음"} 삭제`}
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
        <button className="copy-read-link" onClick={copyReadOnlyLink}>
          {readLinkCopied ? "복사됨 ✓" : "[읽기] 공유 주소 링크 복사"}
        </button>
        <span className="user-email" title={userEmail}>
          {userEmail}
        </span>
        {onSignOut && (
          <button className="btn-link" onClick={onSignOut}>
            로그아웃
          </button>
        )}
      </div>
      </div>
    </aside>
  );
}
