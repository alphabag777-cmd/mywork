import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/* ═══════════════════════════════════════════════════════════════════
   구글 번역 / Chrome 자동번역 호환성 패치

   [문제 시나리오]
   1. Chrome 자동번역 활성화
   2. 번역이 텍스트 노드를 <font> 태그로 감쌈:
      <p>텍스트</p>  →  <p><font>번역텍스트</font></p>
   3. 다른 페이지 이동 후 프로필 페이지 재방문
   4. React Router가 컴포넌트 재마운트 시 기존 DOM(font 포함) 재사용
   5. React가 원본 텍스트 노드 위치를 잃어버림
   6. → removeChild / insertBefore NotFoundError 발생

   [해결 계층]
   L1: translate="no" + notranslate → 번역 자체 차단 시도
   L2: MutationObserver → <font> 삽입 즉시 동기 언래핑
   L3: RouteChangeGuard (React 컴포넌트) → 페이지 전환 전 useLayoutEffect로 정리
   L4: onRecoverableError → 미처 잡지 못한 에러 suppress
   L5: ErrorBoundary.isTranslationError → UI 에러 화면 표시 차단
═══════════════════════════════════════════════════════════════════ */

// ─── L1: translate="no" 강제 설정 ───────────────────────────────────
const html = document.documentElement;
html.setAttribute("translate", "no");
html.classList.add("notranslate");
html.setAttribute("lang", "ko");

if (!document.querySelector('meta[name="google"]')) {
  const m = document.createElement("meta");
  m.setAttribute("name", "google");
  m.setAttribute("content", "notranslate");
  document.head.appendChild(m);
}

const rootEl = document.getElementById("root")!;
rootEl.setAttribute("translate", "no");
rootEl.classList.add("notranslate");

// ─── L2a: Chrome 번역 클래스 감지 → 즉시 제거 ──────────────────────
const _htmlObserver = new MutationObserver(() => {
  if (
    html.classList.contains("translated-ltr") ||
    html.classList.contains("translated-rtl")
  ) {
    html.classList.remove("translated-ltr", "translated-rtl");
    html.classList.add("notranslate");
  }
});
_htmlObserver.observe(html, {
  attributes: true,
  attributeFilter: ["class"],
});

// ─── L2b: <font> 태그 즉시 동기 언래핑 ─────────────────────────────
// Chrome 번역이 삽입하는 <font> 태그를 감지하여 즉시 언래핑
// queueMicrotask 대신 동기 처리 → React 렌더 사이클 전에 DOM 정리

function unwrapFontNode(font: Element) {
  const parent = font.parentNode;
  if (!parent) return;
  try {
    while (font.firstChild) {
      parent.insertBefore(font.firstChild, font);
    }
    if (parent.contains(font)) {
      parent.removeChild(font);
    }
  } catch {
    // 이미 제거됐거나 부모가 없는 경우 스킵
  }
}

// root 하위 모든 <font> 태그 일괄 언래핑
function unwrapAllFontsInRoot() {
  try {
    // live HTMLCollection이므로 배열로 복사
    let fonts = Array.from(rootEl.getElementsByTagName("font"));
    // 안쪽부터 처리 (중첩 font 대응): 역순으로 처리
    for (let i = fonts.length - 1; i >= 0; i--) {
      unwrapFontNode(fonts[i]);
    }
  } catch { /* ignore */ }
}

let _unwrapScheduled = false;
const _fontObserver = new MutationObserver((mutations) => {
  let hasFontNode = false;

  for (const m of mutations) {
    if (m.type !== "childList") continue;
    for (const node of Array.from(m.addedNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node as Element;
      // <font> 태그 직접 삽입 또는 <font>를 포함하는 노드 삽입
      if (el.tagName === "FONT" || el.querySelector?.("font")) {
        hasFontNode = true;
        break;
      }
    }
    if (hasFontNode) break;
  }

  if (!hasFontNode) return;

  // 동기 처리: React 다음 paint 전에 DOM 정리
  // requestAnimationFrame보다 빠른 타이밍에 실행
  if (!_unwrapScheduled) {
    _unwrapScheduled = true;
    // Promise.resolve().then → 현재 마이크로태스크 큐 후, React 커밋 전
    Promise.resolve().then(() => {
      _unwrapScheduled = false;
      unwrapAllFontsInRoot();
    });
  }
});

// ─── L4: React 마운트 ────────────────────────────────────────────────
const root = createRoot(rootEl, {
  onRecoverableError(error: unknown) {
    const msg = (error as Error)?.message ?? String(error);
    // 번역 관련 DOM 에러 suppress
    if (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("NotFoundError") ||
      msg.includes("The node to be removed") ||
      msg.includes("not a child of this node") ||
      msg.includes("Failed to execute")
    ) {
      console.warn("[번역호환] onRecoverableError 무시:", msg.slice(0, 120));
      return;
    }
    console.error("[RecoverableError]", error);
  },
});

root.render(<App />);

// React 마운트 후 font 감시 시작 (subtree:true 로 모든 깊이 감시)
_fontObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

// 초기 언래핑 (혹시 이미 번역된 상태로 로드된 경우)
unwrapAllFontsInRoot();
