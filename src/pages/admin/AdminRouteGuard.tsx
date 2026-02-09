import { Navigate, Outlet, useLocation } from "react-router-dom";

export const AdminRouteGuard = () => {
  const location = useLocation();
  const isAuthenticated = typeof window !== "undefined" && localStorage.getItem("alphabag_admin_authenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default AdminRouteGuard;


