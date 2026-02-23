import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3, Users, Wallet, LayoutDashboard, PlusSquare,
  LogOut, MessageSquare, Layers, FileText, Network, Menu, X, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { subscribeAllTickets } from "@/lib/support";

const navItems = [
  { to: "/admin/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { to: "/admin/plans",      label: "Plans",           icon: PlusSquare },
  { to: "/admin/content",    label: "Content",         icon: FileText },
  { to: "/admin/users-org",  label: "Users & Org",     icon: Users },
  { to: "/admin/assets",        label: "Assets",          icon: Layers },
  { to: "/admin/support",       label: "Support Tickets", icon: MessageSquare, badge: true },
  { to: "/admin/notifications", label: "Notifications",   icon: Bell },
];

function NavItems({ openTickets, onClick }: { openTickets: number; onClick?: () => void }) {
  return (
    <>
      {navItems.map((item) => {
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

  // Real-time open ticket count for badge
  useEffect(() => {
    const unsub = subscribeAllTickets((tickets) => {
      setOpenTickets(tickets.filter(t => t.status === "open").length);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("alphabag_admin_authenticated");
    navigate("/admin");
  };

  const SidebarContent = ({ onClick }: { onClick?: () => void }) => (
    <>
      <div className="h-16 border-b border-border/60 flex items-center px-4 gap-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-display font-semibold text-sm">AlphaBag Admin</div>
          <div className="text-xs text-muted-foreground">Control center</div>
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

          {/* Open tickets indicator in header (mobile only) */}
          {openTickets > 0 && (
            <Badge variant="destructive" className="text-xs md:hidden">
              {openTickets} open ticket{openTickets > 1 ? "s" : ""}
            </Badge>
          )}
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
