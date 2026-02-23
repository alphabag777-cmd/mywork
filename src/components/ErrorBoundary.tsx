import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null, copied: false };

  // 구글 번역 관련 DOM 에러인지 판별
  static isTranslationError(error: Error): boolean {
    const msg = error?.message ?? "";
    return (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("NotFoundError") ||
      msg.includes("The node to be removed") ||
      msg.includes("not a child of this node") ||
      msg.includes("Failed to execute") && msg.includes("Node")
    );
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 번역 관련 DOM 에러는 ErrorBoundary가 잡지 않음 → 크래시 UI 표시 안 함
    if (ErrorBoundary.isTranslationError(error)) {
      console.warn("[번역 호환] ErrorBoundary: DOM 에러 무시됨:", error.message);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 번역 에러는 localStorage 저장도 스킵
    if (ErrorBoundary.isTranslationError(error)) return;
    this.setState({ componentStack: info.componentStack || null });
    try {
      const debugInfo = JSON.stringify({
        message: error.message,
        stack: (error.stack || "").slice(0, 2000),
        componentStack: (info.componentStack || "").slice(0, 1500),
        url: window.location.href,
        time: new Date().toISOString(),
        ua: navigator.userAgent,
      }, null, 2);
      localStorage.setItem("errorboundary_last", debugInfo);
    } catch { /* ignore */ }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: null, copied: false });
  };

  handleCopy = () => {
    try {
      const txt = localStorage.getItem("errorboundary_last") || "";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(() => {
          this.setState({ copied: true });
          setTimeout(() => this.setState({ copied: false }), 3000);
        }).catch(() => this.fallbackCopy(txt));
      } else {
        this.fallbackCopy(txt);
      }
    } catch { /* ignore */ }
  };

  fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand("copy"); } catch { /* ignore */ }
    try { if (document.body.contains(el)) document.body.removeChild(el); } catch { /* ignore */ }
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.handleReset);
    }

    const fullDebug = [
      `[오류 메시지]`,
      this.state.error.message,
      ``,
      `[스택 트레이스]`,
      this.state.error.stack || "(없음)",
      ``,
      `[컴포넌트 스택]`,
      this.state.componentStack || "(없음)",
    ].join("\n");

    const card = (
      <Card className="max-w-lg w-full border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive text-base">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            오류가 발생했습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 에러 메시지 — 크게 표시 */}
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-xs font-bold text-destructive mb-1">오류 메시지:</p>
            <p className="text-sm font-mono break-all text-destructive">
              {this.state.error.message}
            </p>
          </div>

          {/* 전체 디버그 — textarea로 선택/복사 가능 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              ▼ 아래 전체 내용을 선택해서 개발자에게 전달해주세요
            </p>
            <textarea
              readOnly
              value={fullDebug}
              rows={10}
              className="w-full text-xs font-mono bg-muted border border-border rounded p-2 resize-none focus:outline-none"
              onFocus={e => e.target.select()}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          </div>

          {/* 버튼 영역 */}
          <Button
            onClick={this.handleCopy}
            variant="default"
            className="w-full"
          >
            {this.state.copied ? "✓ 복사됨!" : "📋 에러 정보 클립보드 복사"}
          </Button>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline" className="flex-1">
              다시 시도
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary" className="flex-1">
              새로 고침
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    if (this.props.inline) {
      return <div className="w-full p-4">{card}</div>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {card}
      </div>
    );
  }
}

export default ErrorBoundary;
