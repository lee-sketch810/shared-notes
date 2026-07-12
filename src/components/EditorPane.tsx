import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { ko } from "@blocknote/core/locales";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Note, NoteStore } from "../lib/types";
import {
  getLocalFile,
  LOCAL_FILE_PREFIX,
  saveLocalFile,
} from "../lib/localFiles";

interface Props {
  note: Note;
  store: NoteStore;
  onSaved: () => void;
  onShare: () => void;
  canShare: boolean;
}

type SaveState = "idle" | "dirty" | "saving" | "saved";

const SAVE_DEBOUNCE_MS = 800;
const MAX_EMBEDDED_FILE_SIZE = 10 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_EMBEDDED_FILE_SIZE) {
    window.alert("추가할 수 있는 파일의 최대 크기는 10MB입니다.");
    return Promise.reject(new Error("file too large"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function EditorPane({
  note,
  store,
  onSaved,
  onShare,
  canShare,
}: Props) {
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isAddingFile, setIsAddingFile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRef = useRef<{ title?: string; content?: unknown } | null>(null);

  const editor = useCreateBlockNote({
    dictionary: ko,
    uploadFile: fileToDataUrl,
    initialContent:
      note.content && note.content.length > 0 ? note.content : undefined,
  });

  function blockTypeForFile(file: File): "image" | "video" | "audio" | "file" {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "file";
  }

  async function insertFile(file: File) {
    setIsAddingFile(true);
    try {
      const blockType = blockTypeForFile(file);
      const url =
        store.mode === "local" && blockType === "file"
          ? await saveLocalFile(file)
          : await fileToDataUrl(file);
      const lastBlock = editor.document[editor.document.length - 1];
      const block = {
        type: blockType,
        props: { url, name: file.name },
      } as PartialBlock;
      editor.insertBlocks([block], lastBlock, "after");
    } finally {
      setIsAddingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!store.canEdit) return;

    const handleImagePaste = (event: ClipboardEvent) => {
      const fileItem = Array.from(event.clipboardData?.items ?? []).find(
        (item) => item.kind === "file"
      );
      const file = fileItem?.getAsFile();
      if (!file) return;

      event.preventDefault();
      void insertFile(file);
    };

    document.addEventListener("paste", handleImagePaste, true);
    return () => document.removeEventListener("paste", handleImagePaste, true);
  }, [editor, store.canEdit]);

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

  async function downloadFileBlock(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const fileBlock = target.closest<HTMLElement>(
      '[data-content-type="file"][data-file-block]'
    );
    if (!fileBlock) return;

    const url = fileBlock.dataset.url;
    if (!url) return;

    event.preventDefault();
    event.stopPropagation();

    let downloadUrl = url;
    let fileName = fileBlock.dataset.name || "download";

    if (url.startsWith(LOCAL_FILE_PREFIX)) {
      const storedFile = await getLocalFile(url);
      if (!storedFile) {
        window.alert("저장된 파일을 찾을 수 없습니다.");
        return;
      }
      downloadUrl = URL.createObjectURL(storedFile.blob);
      fileName = storedFile.name;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (downloadUrl !== url) {
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
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
        {store.canEdit && (
          <>
            <input
              ref={fileInputRef}
              className="file-input-hidden"
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void insertFile(file);
              }}
            />
            <button
              className="btn-small"
              disabled={isAddingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {isAddingFile ? "추가 중…" : "파일·미디어 추가"}
            </button>
          </>
        )}
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
        readOnly={!store.canEdit}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleSave({ title: e.target.value });
        }}
      />
      <div className="editor-content" onClickCapture={downloadFileBlock}>
        <BlockNoteView
          editor={editor}
          theme="light"
          editable={store.canEdit}
          onChange={() => scheduleSave({ content: editor.document })}
        />
      </div>
    </div>
  );
}
