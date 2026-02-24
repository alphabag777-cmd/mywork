import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { verifyAdminCredentials } from "@/lib/adminConfig";

export const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;
    setError("");
    setLoading(true);

    try {
      const ok = await verifyAdminCredentials(username, password);
      if (ok) {
        setSuccess(true);
        localStorage.setItem("alphabag_admin_authenticated", "true");
        // 짧은 딜레이 후 이동 (성공 피드백 표시)
        setTimeout(() => navigate("/admin/dashboard"), 400);
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {success
              ? <CheckCircle2 className="w-6 h-6 text-green-500" />
              : <ShieldCheck  className="w-6 h-6 text-primary" />
            }
          </div>
          <CardTitle className="text-2xl font-display">Admin Panel</CardTitle>
          <CardDescription>Sign in to manage AlphaBag admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={loading || success}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading || success}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading || success || !username || !password}
            >
              {success ? (
                <><CheckCircle2 className="w-4 h-4" /> 로그인 성공!</>
              ) : loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 로그인 중...</>
              ) : (
                <><Lock className="w-4 h-4" /> Sign in</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
