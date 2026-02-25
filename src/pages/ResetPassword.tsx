import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast({ title: "✅ 이메일 전송 완료", description: "비밀번호 재설정 링크를 이메일로 전송했습니다." });
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? "등록된 이메일이 없습니다." :
        err.code === "auth/invalid-email" ? "이메일 형식이 올바르지 않습니다." :
        "이메일 전송에 실패했습니다.";
      toast({ title: "❌ 오류", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">비밀번호 재설정</CardTitle>
            <CardDescription className="text-muted-foreground">
              가입한 이메일 주소를 입력하시면 재설정 링크를 보내드립니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">📧</div>
                <p className="text-foreground font-medium">이메일을 확인해 주세요</p>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-semibold">{email}</span>으로<br />
                  비밀번호 재설정 링크를 전송했습니다
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> 로그인으로 돌아가기
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">이메일</Label>
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
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Mail className="w-4 h-4 mr-2" />재설정 링크 전송</>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> 로그인으로 돌아가기
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
