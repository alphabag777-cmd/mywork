import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

export default function SignUp() {
  const { signUpEmail, signInGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [referrerCode, setReferrerCode] = useState(searchParams.get("ref") || "");
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 이메일 회원가입
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: "❌ 오류", description: "이름을 입력해 주세요.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "❌ 오류", description: "비밀번호는 6자 이상이어야 합니다.", variant: "destructive" });
      return;
    }
    if (password !== passwordConfirm) {
      toast({ title: "❌ 오류", description: "비밀번호가 일치하지 않습니다.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await signUpEmail(email, password, displayName.trim(), referrerCode || undefined);
      toast({ title: "✅ 회원가입 완료", description: "환영합니다! 로그인되었습니다." });
      navigate("/");
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use" ? "이미 사용 중인 이메일입니다." :
        err.code === "auth/invalid-email" ? "이메일 형식이 올바르지 않습니다." :
        err.code === "auth/weak-password" ? "비밀번호가 너무 약합니다 (6자 이상)." :
        "회원가입에 실패했습니다. 다시 시도해 주세요.";
      toast({ title: "❌ 회원가입 실패", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // 구글 회원가입
  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      await signInGoogle(referrerCode || undefined);
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
            <CardTitle className="text-2xl font-bold text-foreground">회원가입</CardTitle>
            <CardDescription className="text-muted-foreground">
              이메일 또는 구글 계정으로 가입하세요
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* 구글 회원가입 */}
            <Button
              variant="outline"
              className="w-full h-11 border-border/60 hover:bg-muted/50 gap-2"
              onClick={handleGoogleSignUp}
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
              Google로 시작하기
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">또는 이메일로 가입</span>
              <Separator className="flex-1" />
            </div>

            {/* 이메일 회원가입 폼 */}
            <form onSubmit={handleSignUp} className="space-y-3">
              {/* 이름 */}
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-sm text-foreground">이름 (닉네임)</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="홍길동"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="h-11 bg-muted/30 border-border/60"
                  required
                />
              </div>

              {/* 이메일 */}
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

              {/* 비밀번호 */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-foreground">비밀번호 (6자 이상)</Label>
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
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirm" className="text-sm text-foreground">비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPwConfirm ? "text" : "password"}
                    placeholder="비밀번호 재입력"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className={`h-11 bg-muted/30 border-border/60 pr-10 ${
                      passwordConfirm && password !== passwordConfirm ? "border-red-500" : ""
                    }`}
                    required
                  />
                  <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
                )}
              </div>

              {/* 추천인 코드 */}
              <div className="space-y-1.5">
                <Label htmlFor="referrerCode" className="text-sm text-foreground">
                  추천인 코드 <span className="text-muted-foreground text-xs">(선택)</span>
                </Label>
                <Input
                  id="referrerCode"
                  type="text"
                  placeholder="추천인 코드 입력"
                  value={referrerCode}
                  onChange={e => setReferrerCode(e.target.value.toUpperCase())}
                  className="h-11 bg-muted/30 border-border/60 uppercase"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2"
                disabled={loading || (!!passwordConfirm && password !== passwordConfirm)}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><UserPlus className="w-4 h-4 mr-2" />회원가입</>
                )}
              </Button>
            </form>

            <Separator />

            {/* 로그인 링크 */}
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">로그인</Link>
            </p>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">또는</span>
              <Separator className="flex-1" />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              🦊{" "}
              <button onClick={() => navigate("/")}
                className="text-primary font-semibold hover:underline">
                지갑으로 바로 시작하기
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
