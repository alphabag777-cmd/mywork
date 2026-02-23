/**
 * RouteChangeGuard
 *
 * 페이지 전환(React Router) 시 Chrome 구글 번역이 삽입한 <font> 태그를
 * React 렌더링 사이클 시작 전에 동기적으로 제거합니다.
 *
 * [문제 시나리오]
 *  1. 구글 번역 활성화 → 텍스트 노드들이 <font> 태그로 감싸짐
 *  2. 사용자가 다른 페이지로 이동 (예: 홍보 → 프로필)
 *  3. React Router가 새 컴포넌트 마운트 시 기존 DOM 재사용 시도
 *  4. <font> 태그들이 React의 텍스트 노드 참조를 가로막음
 *  5. → removeChild / insertBefore NotFoundError 발생
 *
 * [해결]
 *  useLocation 훅으로 pathname 변경 감지
 *  → React useLayoutEffect(동기)로 렌더링 전에 <font> 태그 언래핑
 *  → React가 새 페이지를 그리기 전 DOM이 깨끗한 상태 보장
 */

import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** #root 하위의 <font> 태그를 모두 언래핑 (내용은 보존) */
function unwrapAllFontTags(): number {
  try {
    const root = document.getElementById("root");
    if (!root) return 0;

    let count = 0;
    // 반복: 중첩 <font> 태그가 있을 수 있으므로 없어질 때까지 반복
    let fonts = root.getElementsByTagName("font");
    // fonts는 live HTMLCollection이므로 배열로 복사
    while (fonts.length > 0) {
      const arr = Array.from(fonts);
      let changed = false;
      for (const font of arr) {
        const parent = font.parentNode;
        if (!parent) continue;
        try {
          // <font> 내용을 부모에 직접 삽입
          while (font.firstChild) {
            parent.insertBefore(font.firstChild, font);
          }
          parent.removeChild(font);
          count++;
          changed = true;
        } catch {
          // 이미 제거됐거나 부모가 다른 경우 스킵
        }
      }
      if (!changed) break; // 무한루프 방지
      fonts = root.getElementsByTagName("font");
    }
    return count;
  } catch {
    return 0;
  }
}

/** HTML 요소에서 구글 번역 클래스 제거 */
function removeTranslationClasses() {
  try {
    const html = document.documentElement;
    html.classList.remove("translated-ltr", "translated-rtl");
    // goog-te 관련 노드 제거
    document.querySelectorAll(
      ".skiptranslate, #goog-gt-tt, .goog-te-banner-frame, #google_translate_element"
    ).forEach((el) => {
      try { el.remove(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
}

export function RouteChangeGuard() {
  const { pathname } = useLocation();
  const prevPath = useRef<string>("");

  // useLayoutEffect: DOM 변경이 화면에 그려지기 전에 동기 실행
  // → React가 새 페이지 컴포넌트를 마운트하기 전에 <font> 태그 제거
  useLayoutEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    // 1) <font> 태그 즉시 언래핑
    const removed = unwrapAllFontTags();
    if (removed > 0) {
      console.debug(`[RouteChangeGuard] <font> 태그 ${removed}개 제거됨 (경로: ${pathname})`);
    }

    // 2) 번역 클래스 정리
    removeTranslationClasses();
  });

  // 초기 마운트 시에도 한 번 실행
  useLayoutEffect(() => {
    unwrapAllFontTags();
    removeTranslationClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // UI 없음
}

export default RouteChangeGuard;
