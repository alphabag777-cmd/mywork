import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/* ─────────────────────────────────────────────────────────────────
   구글 번역 / 크롬 자동번역 완전 차단
   Chrome Android 자동번역이 React 텍스트 노드를 직접 변경하면
   → React DOM reconciliation removeChild NotFoundError 발생
   → 아래 코드로 번역 시도 자체를 차단
───────────────────────────────────────────────────────────────── */

// 1) HTML 루트에 translate="no" + notranslate 클래스 강제 설정
const html = document.documentElement;
html.setAttribute("translate", "no");
html.classList.add("notranslate");
html.setAttribute("lang", "ko");

// 2) meta google notranslate 동적 삽입 (혹시 누락된 경우 대비)
if (!document.querySelector('meta[name="google"]')) {
  const m = document.createElement("meta");
  m.setAttribute("name", "google");
  m.setAttribute("content", "notranslate");
  document.head.appendChild(m);
}

// 3) root 엘리먼트에도 translate="no" 강제
const rootEl = document.getElementById("root")!;
rootEl.setAttribute("translate", "no");
rootEl.classList.add("notranslate");

// 4) MutationObserver: Chrome이 번역을 시작하면 즉시 페이지 리로드
//    - Chrome 번역은 <html class="translated-ltr"> 또는 "translated-rtl" 추가
//    - font.gstatic.com 스크립트 삽입 등의 패턴으로 감지
let _translationReloadScheduled = false;
const _translateObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    // HTML 클래스 변경 감지 (Chrome 번역 시작 신호)
    if (
      m.type === "attributes" &&
      m.attributeName === "class" &&
      m.target === html
    ) {
      const cls = html.className || "";
      if (cls.includes("translated-ltr") || cls.includes("translated-rtl")) {
        // 번역 클래스 즉시 제거
        html.classList.remove("translated-ltr", "translated-rtl");
        // notranslate 재설정
        html.classList.add("notranslate");
        html.setAttribute("translate", "no");
        return;
      }
    }
    // 번역 스크립트/iframe 삽입 감지
    if (m.type === "childList") {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const src = el.getAttribute?.("src") || "";
          const id = el.getAttribute?.("id") || "";
          if (
            src.includes("translate.googleapis") ||
            src.includes("gstatic.com/translate") ||
            id === "google_translate_element" ||
            id.startsWith("goog-gt")
          ) {
            el.remove();
          }
        }
      });
    }
  }
});
_translateObserver.observe(html, {
  attributes: true,
  attributeFilter: ["class", "translate"],
  childList: true,
  subtree: false,
});

// 5) body에서도 번역 관련 노드 삽입 차단
const _bodyObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === "childList") {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const id = el.getAttribute?.("id") || "";
          const cls = el.getAttribute?.("class") || "";
          if (
            id.startsWith("goog-") ||
            cls.includes("goog-te") ||
            id === "google_translate_element" ||
            el.tagName === "FONT" // Chrome 번역이 텍스트 노드를 <font>로 감싸는 패턴
          ) {
            el.remove();
          }
        }
      });
    }
  }
});
// body가 준비되면 observe
if (document.body) {
  _bodyObserver.observe(document.body, { childList: true, subtree: false });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    _bodyObserver.observe(document.body, { childList: true, subtree: false });
  });
}

createRoot(rootEl).render(<App />);
