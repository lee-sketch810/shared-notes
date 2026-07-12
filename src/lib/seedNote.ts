import type { PartialBlock } from "@blocknote/core";

/**
 * 로컬 데모 모드 최초 실행 시 심어주는 섹션 노트들.
 * 원본: Notion "밥 코딩 공유 노트 (여러 사람이 작성 가능)" — 섹션별로 분리.
 * 이미지·PDF는 public/notion-import/ 에 다운로드해 로컬 경로로 연결.
 */

export interface SeedNote {
  id: string;
  title: string;
  content: PartialBlock[];
}

/** GitHub Pages처럼 하위 경로에 배포돼도 동작하도록 BASE_URL 기준으로 자산 경로 생성 */
function asset(path: string): string {
  return import.meta.env.BASE_URL + path;
}

function bullet(term: string, desc: string): PartialBlock {
  return {
    type: "bulletListItem",
    content: [
      { type: "text", text: term, styles: { bold: true } },
      { type: "text", text: desc, styles: {} },
    ],
  };
}

function linkPara(text: string, href: string): PartialBlock {
  return {
    type: "paragraph",
    content: [{ type: "link", href, content: text }],
  };
}

export const SEED_NOTES: SeedNote[] = [
  {
    id: "b0bc0d19-0000-4000-8000-000000000000",
    title: "홈",
    content: [
      { type: "image", props: { url: asset("notion-import/intro-image.png") } },
      { type: "paragraph", content: "" },
    ],
  },
  {
    id: "b0bc0d19-0000-4000-8000-000000000001",
    title: "기본 용어 정리",
    content: [
      {
        type: "paragraph",
        content:
          "이 노트는 팀원 누구나 같이 작성할 수 있는 공유 노트입니다.",
      },
      { type: "heading", props: { level: 2 }, content: "모델 관련" },
      bullet(
        "LLM (거대언어모델)",
        ": 방대한 텍스트로 학습해 언어를 생성·이해하는 AI 모델"
      ),
      bullet("파라미터", ": 모델이 학습한 가중치 수. 많을수록 대체로 성능↑, 비용↑"),
      bullet(
        "토큰",
        ": AI가 텍스트를 처리하는 최소 단위(단어보다 작은 조각). 요금·컨텍스트 길이 계산 기준"
      ),
      bullet("컨텍스트 윈도우", ": 모델이 한 번에 참고할 수 있는 최대 토큰 양"),
      { type: "heading", props: { level: 2 }, content: "입력·제어" },
      bullet("프롬프트", ": 모델에게 주는 지시문/질문"),
      bullet("프롬프트 엔지니어링", ": 원하는 결과를 얻기 위해 지시문을 설계하는 기법"),
      bullet("시스템 프롬프트", ": 대화 전반의 역할·규칙을 정하는 배경 지시"),
      bullet(
        "Few-shot / Zero-shot",
        ": 예시를 몇 개 주고(Few-shot) vs 안 주고(Zero-shot) 시키는 방식"
      ),
      { type: "heading", props: { level: 2 }, content: "품질·한계" },
      bullet("할루시네이션", ": 그럴듯하지만 사실이 아닌 내용을 생성하는 현상"),
      bullet("환각 검증/그라운딩", ": 생성 결과를 실제 근거와 대조해 검증하는 작업"),
      { type: "heading", props: { level: 2 }, content: "확장 기법" },
      bullet(
        "RAG (검색증강생성)",
        ": 외부 문서·DB를 검색해 답변에 반영하는 방식. 사내 문서 기반 챗봇의 핵심 기법"
      ),
      bullet("파인튜닝", ": 특정 목적에 맞게 모델을 추가 학습시키는 것"),
      bullet("임베딩", ": 텍스트를 의미 기반 벡터로 변환한 것 (검색·유사도 비교에 사용)"),
      { type: "heading", props: { level: 2 }, content: "작업 방식" },
      bullet("에이전트", ": 스스로 여러 단계를 계획·실행하는 AI 시스템 (도구 호출 포함)"),
      bullet("멀티 에이전트", ": 역할이 다른 여러 에이전트가 협업하는 구조"),
      bullet("파이프라인", ": 입력→처리→출력을 여러 단계로 자동화한 흐름"),
    ],
  },
  {
    id: "b0bc0d19-0000-4000-8000-000000000002",
    title: "활용 팁",
    content: [
      {
        type: "image",
        props: { url: asset("notion-import/claude-tips.png") },
      },
    ],
  },
  {
    id: "b0bc0d19-0000-4000-8000-000000000003",
    title: "자비스 관련",
    content: [
      linkPara(
        "AI Javis version (Notion)",
        "https://cream-shaker-d8a.notion.site/AI-Javis-version-279e43a115c883b38c09817a11bd0a24"
      ),
      linkPara(
        "Mymux 릴리스 (GitHub)",
        "https://github.com/ChoiGyber/Mymux/releases"
      ),
    ],
  },
  {
    id: "b0bc0d19-0000-4000-8000-000000000004",
    title: "가이드",
    content: [
      {
        type: "file",
        props: {
          url: asset("notion-import/chatgpt-guide.pdf"),
          name: "ChatGPT_초보자_실전_활용_가이드_2026-07-12.pdf",
        },
      },
    ],
  },
  {
    id: "b0bc0d19-0000-4000-8000-000000000005",
    title: "참고 링크",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "유튜브 - 추천 강의 채널", styles: { bold: true } },
        ],
      },
      {
        type: "bulletListItem",
        content: [
          {
            type: "link",
            href: "https://www.youtube.com/@aiadjunct/videos",
            content: "https://www.youtube.com/@aiadjunct/videos",
          },
        ],
      },
      {
        type: "bulletListItem",
        content: [
          {
            type: "link",
            href: "https://youtube.com/@youtubeshinssam?si=tJEL1xivMprHskU3",
            content: "https://youtube.com/@youtubeshinssam",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "밥 코딩 멤버들이 만든 사이트",
            styles: { bold: true },
          },
        ],
      },
      {
        type: "bulletListItem",
        content: [
          {
            type: "link",
            href: "https://generative-ai-guide.lee0623.chatgpt.site/#top",
            content: "생성형 AI 활용가이드",
          },
          {
            type: "text",
            text: " → 챗 지피티 '사이트' 기능으로 생성",
            styles: {},
          },
        ],
      },
      {
        type: "bulletListItem",
        content: [
          {
            type: "link",
            href: "https://lee-sketch810.github.io/ai-news-cards/",
            content: "오늘의 AI 뉴스",
          },
          { type: "text", text: " → 클로드 코드로 제작", styles: {} },
        ],
      },
    ],
  },
];

/** v1에서 심었던 단일 통합 노트 — v2 시드 시 제거 */
export const LEGACY_SEED_NOTE_ID = "b0bc0d19-0000-4000-8000-bobcoding001";
