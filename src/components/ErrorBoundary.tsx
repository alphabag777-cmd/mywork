import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error.message);
    console.error("[ErrorBoundary] Stack:", error.stack);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
    this.setState({ componentStack: info.componentStack || null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.handleReset);
    }

    // 에러 메시지 — 프로덕션에서도 표시 (디버깅용)
    const shortStack = this.state.error.stack
      ?.split("\n")
      .slice(0, 5)
      .join("\n") || "";

    // componentStack에서 첫 번째 컴포넌트 추출
    const compLine = this.state.componentStack
      ?.split("\n")
      .find((l) => l.trim().startsWith("at ") && !l.includes("ErrorBoundary")) || "";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              오류가 발생했습니다
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              페이지를 새로고침하거나 아래 Try Again을 눌러주세요.
            </p>

            {/* 에러 상세 — 항상 표시 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-destructive">
                오류: {this.state.error.message}
              </p>
              {compLine && (
                <p className="text-xs text-muted-foreground break-all">
                  위치: {compLine.trim()}
                </p>
              )}
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 text-destructive whitespace-pre-wrap break-all">
                {shortStack}
                {this.state.componentStack
                  ? "\n\n--- Component Stack ---\n" +
                    this.state.componentStack
                      .split("\n")
                      .slice(0, 8)
                      .join("\n")
                  : ""}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
