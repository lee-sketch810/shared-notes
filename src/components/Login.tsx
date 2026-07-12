import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(
          "가입 완료! 이메일 확인이 켜져 있다면 받은 편지함에서 인증 후 로그인하세요."
        );
        setMode("signin");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="login-card" onSubmit={submit}>
        <h1 className="login-title">밥 코딩 공유 노트</h1>
        <p className="login-sub">팀원 누구나 함께 쓰는 공유 노트</p>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "처리 중…" : mode === "signin" ? "로그인" : "가입하기"}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "계정이 없나요? 가입하기"
            : "이미 계정이 있나요? 로그인"}
        </button>
        {message && <p className="login-message">{message}</p>}
      </form>
    </div>
  );
}
