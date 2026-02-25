import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

export default function Login() {
  const { signInEmail, signInGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 이메일 로그인
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInEmail(email, password);
      toast({ title: "✅ 로그인 성공", description: "환영합니다!" });
      navigate("/");
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? "등록된 이메일이 없습니다." :
        err.code === "auth/wrong-password" ? "비밀번호가 올바르지 않습니다." :
        err.code === "auth/invalid-email" ? "이메일 형식이 올바르지 않습니다." :
        err.code === "auth/too-many-requests" ? "너무 많은 시도. 잠시 후 다시 시도하세요." :
        "로그인에 실패했습니다.";
      toast({ title: "❌ 로그인 실패", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // 구글 로그인
  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await signInGoogle();
      toast({ title: "✅ 구글 로그인 성공", description: "환영합니다!" });
      navigate("/");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast({ title: "❌ 구글 로그인 실패", description: "다시 시도해 주세요.", variant: "destructive" });
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-foreground">로그인</CardTitle>
            <CardDescription className="text-muted-foreground">
              이메일 또는 구글 계정으로 로그인하세요
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* 구글 로그인 */}
            <Button
              variant="outline"
              className="w-full h-11 border-border/60 hover:bg-muted/50 gap-2"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google로 로그인
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">또는</span>
              <Separator className="flex-1" />
            </div>

            {/* 이메일 로그인 폼 */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-foreground">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-11 bg-muted/30 border-border/60"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-foreground">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-11 bg-muted/30 border-border/60 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/reset-password" className="text-xs text-primary hover:underline">
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><Mail className="w-4 h-4 mr-2" />이메일로 로그인</>
                )}
              </Button>
            </form>

            <Separator />

            {/* 회원가입 링크 */}
            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                회원가입
              </Link>
            </p>

            {/* 지갑 로그인 구분선 */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">또는</span>
              <Separator className="flex-1" />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              🦊{" "}
              <button
                onClick={() => navigate("/")}
                className="text-primary font-semibold hover:underline"
              >
                지갑으로 바로 시작하기
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
