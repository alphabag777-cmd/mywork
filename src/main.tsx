import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
// translate="no" 를 루트 엘리먼트에 강제 설정
// → 모바일 Chrome/Safari 자동번역이 React 텍스트 노드를 건드려
//   발생하는 removeChild NotFoundError 완전 차단
rootEl.setAttribute("translate", "no");
rootEl.setAttribute("class", (rootEl.getAttribute("class") || "") + " notranslate");

createRoot(rootEl).render(<App />);
