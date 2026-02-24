import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3, Users, Wallet, LayoutDashboard, PlusSquare,
  LogOut, MessageSquare, Layers, FileText, Network, Menu, X, Bell, Gift, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { subscribeAllTickets } from "@/lib/support";
import {
  getAdminRole,
  hasPermission,
  clearAdminSession,
  type AdminPermission,
} from "@/lib/adminAuth";

// ── 네비게이션 아이템 정의 ────────────────────────────────────────────────────
// permKey: null → 항상 표시 (admin+sub 모두), string → 해당 권한 필요, "admin-only" → admin 전용
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: boolean;
  permKey: AdminPermission | "admin-only" | null;
};

const navItems: NavItem[] = [
  { to: "/admin/dashboard",     label: "Dashboard",        icon: LayoutDashboard, permKey: "dashboard" },
  { to: "/admin/plans",         label: "Plans",             icon: PlusSquare,      permKey: "plans" },
  { to: "/admin/content",       label: "Content",           icon: FileText,        permKey: "content" },
  { to: "/admin/users-org",     label: "Users & Org",       icon: Users,           permKey: "admin-only" },
  { to: "/admin/assets",        label: "Assets",            icon: Layers,          permKey: "assets" },
  { to: "/admin/support",       label: "Support Tickets",   icon: MessageSquare,   badge: true, permKey: "support" },
  { to: "/admin/notifications", label: "Notifications",     icon: Bell,            permKey: "notifications" },
  { to: "/admin/airdrop",       label: "Airdrop",           icon: Gift,            permKey: "admin-only" },
  { to: "/admin/sub-admins",    label: "Sub-Admins",        icon: UserCog,         permKey: "admin-only" },
];

function NavItems({ openTickets, onClick }: { openTickets: number; onClick?: () => void }) {
  const role = getAdminRole();

  const visibleItems = navItems.filter((item) => {
    if (role === "admin") return true;          // admin: 모두 표시
    if (item.permKey === "admin-only") return false;  // admin 전용 메뉴 숨김
    if (item.permKey === null) return true;
    return hasPermission(item.permKey as AdminPermission);
  });

  return (
    <>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={({ isActive }) =>
              [
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && openTickets > 0 && (
              <Badge
                variant="destructive"
                className="h-5 min-w-5 px-1 text-[10px] leading-none flex items-center justify-center animate-pulse"
              >
                {openTickets}
              </Badge>
            )}
          </NavLink>
        );
      })}
    </>
  );
}

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [openTickets, setOpenTickets] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = getAdminRole();

  // Real-time open ticket count for badge
  useEffect(() => {
    const unsub = subscribeAllTickets((tickets) => {
      setOpenTickets(tickets.filter(t => t.status === "open").length);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const roleBadgeLabel = role === "admin" ? "관리자" : "부운영자";
  const roleBadgeClass = role === "admin"
    ? "bg-primary/10 text-primary"
    : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  const SidebarContent = ({ onClick }: { onClick?: () => void }) => (
    <>
      <div className="h-16 border-b border-border/60 flex items-center px-4 gap-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm">AlphaBag Admin</div>
          <div className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium inline-block mt-0.5 ${roleBadgeClass}`}>
            {roleBadgeLabel}
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItems openTickets={openTickets} onClick={onClick} />
      </nav>
      <div className="p-4 border-t border-border/60">
        <Button variant="outline" className="w-full justify-between" size="sm" onClick={handleLogout}>
          <span className="flex items-center gap-2 text-xs">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/60 bg-background/80 backdrop-blur">
        <SidebarContent />
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur flex items-center justify-between px-4 md:px-6">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-56 p-0 flex flex-col">
                <SidebarContent onClick={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold">Admin Panel</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge in header */}
            <span className={`hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-sm font-medium ${roleBadgeClass}`}>
              {roleBadgeLabel}
            </span>
            {/* Open tickets indicator in header (mobile only) */}
            {openTickets > 0 && (
              <Badge variant="destructive" className="text-xs md:hidden">
                {openTickets} open ticket{openTickets > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
