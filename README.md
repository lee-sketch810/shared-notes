# 우리 노트 (shared-notes)

가족·팀 등 소수가 함께 쓰는 Notion식 블록 에디터 공유 노트앱.

- **에디터**: BlockNote — `/` 명령으로 제목·체크리스트·표·이미지 등 블록 추가 (한국어 UI)
- **저장**: 입력 후 0.8초 자동 저장 (저장 시 동기화 방식)
- **공유**: 노트별로 상대방 이메일을 추가하면 그 사람 목록에 노트가 나타남
- **실시간 감지**: 다른 사람이 저장하면 "다른 사람이 이 노트를 수정했어요" 배너 + 원클릭 최신화
- **비용**: Supabase 무료 티어 + Vercel 무료 티어 = **월 0원**

## 두 가지 모드

| 모드 | 조건 | 동작 |
|------|------|------|
| **로컬 데모** | `.env` 없이 실행 | 브라우저 localStorage 저장. 탭 2개 열면 공유 시뮬레이션 가능. 로그인 불필요 |
| **공유 모드** | `.env`에 Supabase 키 설정 | 이메일 로그인 + 실제 다인 공유 + 실시간 변경 감지 |

## 로컬에서 돌려보기 (데모 모드)

```bash
cd shared-notes
npm install
npm run dev
# → http://localhost:5180
```

## 공유 모드 켜기 (Supabase 설정 — 약 10분)

1. https://supabase.com 가입 → **New Project** 생성 (Free 플랜)
2. 프로젝트 대시보드 → **SQL Editor** → `supabase/schema.sql` 내용 전체를 붙여넣고 **Run**
3. **Authentication → Providers → Email**: 켜져 있는지 확인
   - 간편하게 쓰려면 **Confirm email 끄기** (가입 즉시 로그인 가능)
4. **Project Settings → API**에서 `URL`과 `anon public` 키 복사
5. `shared-notes/.env` 파일 생성:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
6. `npm run dev` 재시작 → 로그인 화면이 나오면 성공

> 보안: 접근 제어는 전부 Postgres RLS(Row Level Security)로 처리한다.
> anon 키가 노출되어도 자기 노트와 공유받은 노트 외에는 접근 불가.

## 배포 (Vercel 무료 — PC 꺼도 동작)

1. 이 폴더를 GitHub 저장소로 푸시
2. https://vercel.com → **Add New Project** → 저장소 선택
   - Framework: Vite (자동 감지)
   - Root Directory: `shared-notes` (모노레포인 경우)
3. **Environment Variables**에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
4. Deploy → 발급된 URL을 가족·팀원에게 공유

## 사용 방법

1. 각자 이메일로 가입
2. 노트 작성 → 우측 상단 **공유** → 상대방 가입 이메일 추가
3. 상대방 목록에 노트가 나타나고, 서로 편집 가능
4. 동시에 열어둔 상태에서 상대가 저장하면 배너로 알림 → 클릭 한 번으로 최신화

## 구조

```
shared-notes/
├── src/
│   ├── App.tsx                  # 모드 분기 (Supabase ↔ 로컬 데모) + 인증
│   ├── components/
│   │   ├── Workspace.tsx        # 목록·에디터·원격 변경 감지 조율
│   │   ├── EditorPane.tsx       # BlockNote 에디터 + 자동 저장
│   │   ├── Sidebar.tsx          # 노트 목록
│   │   ├── ShareDialog.tsx      # 이메일 공유 관리
│   │   └── Login.tsx            # 이메일 로그인/가입
│   └── lib/
│       ├── types.ts             # NoteStore 인터페이스 (데이터 계층 추상화)
│       ├── supabaseStore.ts     # 공유 모드 구현 (RLS + Realtime)
│       └── localStore.ts        # 데모 모드 구현 (localStorage + BroadcastChannel)
└── supabase/schema.sql          # 테이블 + RLS 정책 + Realtime 발행
```

## 한계 (설계상 선택)

- **글자 단위 실시간 동시 편집은 아님** — 마지막 저장이 이김(last-write-wins).
  같은 노트를 동시에 고치면 배너로 알려주지만, 문서를 자동 병합하지는 않는다.
  소수 인원용으로는 충분하며, 진짜 동시 편집이 필요해지면 Yjs(CRDT) 도입이 다음 단계.
