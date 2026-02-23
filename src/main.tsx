import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/* ═══════════════════════════════════════════════════════════════════
   구글 번역 / Chrome 자동번역 호환성 패치
   
   [문제]
   Chrome Android 자동번역이 React 텍스트 노드를 <font> 태그로 감싸면:
     <p>텍스트</p>  →  <p><font>번역된텍스트</font></p>
   이후 React가 원본 텍스트 노드를 찾아 업데이트하려 할 때
   노드가 <font> 안으로 이동했으므로 removeChild/insertBefore 실패
   → NotFoundError: Failed to execute 'removeChild' on 'Node'

   [해결 전략]
   1. translate="no" + notranslate 로 번역 자체를 차단 시도
   2. 번역이 강행되어도 React가 크래시하지 않도록:
      - createRoot의 onRecoverableError로 DOM 불일치 에러 suppress
      - MutationObserver로 <font> 태그 삽입 즉시 언래핑(unwrap)
        → <font>번역텍스트</font>를 텍스트노드로 다시 교체하지 않고
          <font>를 제거하고 내용을 원 위치에 유지 (React DOM 보호)
   3. 번역 클래스(translated-ltr/rtl) 감지 시 조용히 제거
═══════════════════════════════════════════════════════════════════ */

// ─── 1. translate="no" 강제 설정 ────────────────────────────────────
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

// ─── 2. Chrome 번역 클래스 감지 → 조용히 제거 ────────────────────────
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

// ─── 3. <font> 언래핑: Chrome 번역이 삽입한 <font> 태그를
//        React DOM을 건드리지 않는 방식으로 처리 ────────────────────────
//
//  [핵심 전략]
//  Chrome 번역이 삽입한 <font> 태그를 React가 처리하기 전에
//  제거하지 않고, 번역 후 <font> 노드를 그대로 DOM에 유지시킨다.
//  React는 텍스트 노드를 참조하는데, <font>로 감싸진 경우
//  부모 노드에서 원본 텍스트 노드를 찾을 수 없어 에러가 발생한다.
//  → <font> 태그를 즉시 unwrap(내용만 남기고 태그 제거)하면
//    React의 참조가 다시 유효해진다.

function unwrapFontTags(root: Node) {
  // #root 하위의 모든 <font> 태그를 unwrap
  const fonts = (root as Element).querySelectorAll?.("font");
  if (!fonts) return;
  fonts.forEach((font) => {
    const parent = font.parentNode;
    if (!parent) return;
    // <font> 안의 내용을 부모에 직접 삽입
    while (font.firstChild) {
      parent.insertBefore(font.firstChild, font);
    }
    parent.removeChild(font);
  });
}

// body 전체를 감시: <font> 태그가 삽입되면 즉시 언래핑
const _fontObserver = new MutationObserver((mutations) => {
  let hasFontInsert = false;
  for (const m of mutations) {
    if (m.type === "childList") {
      m.addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).tagName === "FONT"
        ) {
          hasFontInsert = true;
        }
      });
    }
  }
  if (hasFontInsert) {
    // 마이크로태스크 대기 후 한꺼번에 처리 (성능 최적화)
    queueMicrotask(() => unwrapFontTags(rootEl));
  }
});

// ─── 4. React 마운트 ────────────────────────────────────────────────
// onRecoverableError: DOM 불일치 에러를 콘솔에만 출력하고 크래시 방지
const root = createRoot(rootEl, {
  onRecoverableError(error: unknown) {
    const msg = (error as Error)?.message ?? String(error);
    // 번역 관련 DOM 에러는 무시 (크래시 방지)
    if (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("NotFoundError") ||
      msg.includes("The node to be removed") ||
      msg.includes("not a child of this node")
    ) {
      console.warn("[번역 호환] DOM 불일치 에러 무시됨:", msg);
      return;
    }
    // 그 외 에러는 콘솔에 출력
    console.error("[RecoverableError]", error);
  },
});

root.render(<App />);

// React 마운트 후 font 감시 시작 (마운트 전 감시 불필요)
if (document.body) {
  _fontObserver.observe(document.body, { childList: true, subtree: true });
}
