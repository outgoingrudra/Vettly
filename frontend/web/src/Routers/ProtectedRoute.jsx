
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, authLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Wait until the existing session is checked.
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />

          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  // Redirect users who are not logged in.
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Optional role-based access control.
  if (allowedRoles?.length) {
    const userRole = String(
      user.role?.name ??
      user.role?.roleName ??
      user.role ??
      user.roleName ??
      ""
    ).toUpperCase();

    const permittedRoles = allowedRoles.map((role) =>
      String(role).toUpperCase()
    );

    if (!permittedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Render nested protected routes.
  return <Outlet />;
}
