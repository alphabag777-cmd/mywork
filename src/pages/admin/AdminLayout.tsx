import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Users, Wallet, LayoutDashboard, PlusSquare, Share2, LogOut, Network, Image, FileText, Lock, GitGraph, MessageSquare, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/add-plans", label: "Add Plans", icon: PlusSquare },
  { to: "/admin/staking-plans", label: "Staking Plans", icon: Lock },
  { to: "/admin/nodes", label: "Nodes", icon: Network },
  { to: "/admin/notices", label: "Notices", icon: FileText },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/ads", label: "Ad Images", icon: Image },
  { to: "/admin/referred", label: "Referred", icon: Share2 },
  { to: "/admin/organization", label: "Organization", icon: GitGraph },
  { to: "/admin/support", label: "Support Tickets", icon: MessageSquare },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/total-earning", label: "Total Earning", icon: BarChart3 },
];

export const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("alphabag_admin_authenticated");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border/60 bg-background/80 backdrop-blur">
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/60">
          <Button variant="outline" className="w-full justify-between" size="sm" onClick={handleLogout}>
            <span className="flex items-center gap-2 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </span>
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Admin Panel</span>
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


