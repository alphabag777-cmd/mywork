import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, Loader2, CheckCircle2, Shield } from "lucide-react";
import { verifyAdminCredentials } from "@/lib/adminConfig";
import { verifySubAdminCredentials, clearAdminSession } from "@/lib/adminAuth";

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

    // 세션 초기화
    clearAdminSession();

    try {
      // 1) 마스터 어드민 확인
      const isAdmin = await verifyAdminCredentials(username, password);
      if (isAdmin) {
        setSuccess(true);
        localStorage.setItem("alphabag_admin_authenticated", "true");
        localStorage.setItem("alphabag_admin_role", "admin");
        setTimeout(() => navigate("/admin/dashboard"), 400);
        return;
      }

      // 2) 부운영자 확인
      const subAdmin = await verifySubAdminCredentials(username, password);
      if (subAdmin) {
        setSuccess(true);
        localStorage.setItem("alphabag_admin_authenticated", "true");
        localStorage.setItem("alphabag_admin_role", "sub");
        localStorage.setItem("alphabag_admin_subid", subAdmin.id);
        localStorage.setItem(
          "alphabag_admin_permissions",
          JSON.stringify(subAdmin.permissions ?? [])
        );
        // 부운영자는 첫 번째 허용 메뉴로 이동
        const perms = subAdmin.permissions ?? [];
        const firstRoute = perms.length > 0
          ? `/admin/${perms[0]}`
          : "/admin/dashboard";
        setTimeout(() => navigate(firstRoute), 400);
        return;
      }

      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } catch {
      setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
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
          <CardDescription>
            Sign in to manage AlphaBag admin area.
          </CardDescription>
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
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              관리자 및 부운영자 계정으로 로그인 가능합니다
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
