# 배포 가이드 — 밥 코딩 공유 노트

전용 저장소 **lee-sketch810/shared-notes** → **GitHub Pages** 자동 배포 + **Supabase 공유 모드**.
최종 주소: **https://lee-sketch810.github.io/shared-notes/**

로컬 저장소는 이미 초기화·커밋까지 끝난 상태입니다(`git log`로 확인). 아래 순서만 따라오시면 됩니다.

---

## 1단계 — GitHub 저장소 만들기 + 올리기

### A. 저장소 생성
브라우저에서 https://github.com/new 접속 →
- **Repository name**: `shared-notes`
- **Public** 선택 (GitHub Pages 무료는 Public 필요)
- README·gitignore·license 체크 **모두 해제** (이미 로컬에 있음)
- **Create repository**

### B. 올리기 (PowerShell 또는 Git Bash에서)
```bash
cd "D:/AI 프로그램/AgenticWorkflow/shared-notes"
git remote add origin https://github.com/lee-sketch810/shared-notes.git
git push -u origin main
```
> 인증 창이 뜨면 GitHub 계정으로 로그인(또는 Personal Access Token).
> ai-news-cards를 올릴 때와 동일한 방식입니다.

---

## 2단계 — GitHub Pages 켜기

저장소 페이지 → **Settings → Pages** →
- **Source**: **GitHub Actions** 선택 (Deploy from a branch 아님)

이러면 push할 때마다 `.github/workflows/deploy.yml`이 자동으로 빌드·배포합니다.
1단계 push 직후 **Actions** 탭에서 첫 배포가 도는 걸 볼 수 있고,
2~3분 뒤 https://lee-sketch810.github.io/shared-notes/ 에서 **로컬 데모 모드**로 접속됩니다.

> 이 시점에서 이미 5개 섹션 노트가 보이는 완성된 사이트가 공개됩니다.
> (데모 모드 = 로그인 없이, 각자 브라우저에 저장. 공유는 3단계에서 켬)

---

## 3단계 — Supabase 공유 모드 켜기 (실제 다인 공유)

### A. 프로젝트 생성
1. https://supabase.com 가입 → **New Project** (Free 플랜)
2. 프로젝트 이름·비밀번호(DB용) 정하고 생성 — 1~2분 소요

### B. 스키마 적용
프로젝트 대시보드 → **SQL Editor** → **New query** →
저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용 **전체 복사·붙여넣기** → **Run**
(테이블 2개 + 접근제어 RLS + 실시간 발행까지 한 번에 설정됨)

### C. 이메일 로그인 설정
**Authentication → Providers → Email** 켜져 있는지 확인.
가족·팀이 바로 쓰려면 **Confirm email** 을 꺼두면 편합니다(가입 즉시 로그인).

### D. 키 복사
**Project Settings → API** 에서 두 값 복사:
- `Project URL`
- `anon` `public` 키

### E. GitHub에 키 등록
저장소 → **Settings → Secrets and variables → Actions → New repository secret** 로 2개 추가:
| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | 복사한 Project URL |
| `VITE_SUPABASE_ANON_KEY` | 복사한 anon public 키 |

### F. 재배포
**Actions** 탭 → 최근 워크플로 → **Re-run all jobs**
(또는 아무 커밋이나 push). 빌드 시 키가 주입되어 **공유 모드**로 바뀝니다.

이제 사이트에 접속하면 로그인 화면이 뜹니다.

---

## 4단계 — 팀원과 공유하기

1. **사장님이 먼저** 이메일로 가입·로그인 → 5개 섹션이 자동 생성됩니다(사장님 소유).
2. 각 노트 우측 상단 **공유** → 팀원의 **가입 이메일** 추가.
3. 팀원이 그 이메일로 가입·로그인하면 왼쪽 메뉴에 노트가 나타나고 함께 편집 가능.
4. 누군가 저장하면 다른 사람 화면에 *"다른 사람이 이 노트를 수정했어요"* 배너 → 클릭 한 번으로 최신화.

> 팀원도 각 섹션을 편집할 수 있게 하려면, 5개 노트 각각에 팀원 이메일을 공유로 추가하면 됩니다.

---

## 요약 체크리스트
- [ ] GitHub에 `shared-notes` 저장소 생성 + `git push`
- [ ] Settings → Pages → Source: **GitHub Actions**
- [ ] (공개 확인) https://lee-sketch810.github.io/shared-notes/ — 데모 모드로 뜸
- [ ] Supabase 프로젝트 생성 + `schema.sql` 실행 + 이메일 로그인
- [ ] GitHub Secrets 2개 등록 + 워크플로 Re-run
- [ ] 로그인 화면 확인 → 사장님 가입 → 팀원 이메일 공유
