import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAdminRole, hasPermission, type AdminPermission } from "@/lib/adminAuth";

// 경로 → 필요 권한 매핑 (admin-only: sub 접근 불가)
const ROUTE_PERMISSIONS: Record<string, AdminPermission | "admin-only"> = {
  "dashboard":     "dashboard",
  "plans":         "plans",
  "content":       "content",
  "assets":        "assets",
  "support":       "support",
  "notifications": "notifications",
  "users-org":     "admin-only",
  "airdrop":       "admin-only",
  "sub-admins":    "admin-only",
};

export const AdminRouteGuard = () => {
  const location = useLocation();
  const isAuthenticated =
    typeof window !== "undefined" &&
    localStorage.getItem("alphabag_admin_authenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

/** 특정 페이지에 대한 권한 가드 */
export const AdminPermissionGuard = ({ routeKey }: { routeKey: string }) => {
  const location = useLocation();
  const role = getAdminRole();

  if (!role) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  // admin은 모든 페이지 접근 가능
  if (role === "admin") return <Outlet />;

  const required = ROUTE_PERMISSIONS[routeKey];

  // admin-only 페이지에 sub가 접근하면 dashboard로 리다이렉트
  if (required === "admin-only") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // 해당 권한 없으면 dashboard로 리다이렉트
  if (required && !hasPermission(required)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRouteGuard;
