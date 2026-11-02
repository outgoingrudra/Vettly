import App from "../App.jsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import Login from "../modules/auth/pages/Login.jsx";
import Signup from "../modules/auth/pages/Signup.jsx";
import VerifyEmail from "../modules/auth/pages/VerifyEmail.jsx";
import ForgotPassword from "../modules/auth/pages/ForgotPassword.jsx";
import ResetPassword from "../modules/auth/pages/ResetPassword.jsx";
import ResendVerification from "../modules/auth/pages/ResendVerification.jsx";
import Profile from "../modules/auth/pages/Profile.jsx";
import Sessions from "../modules/auth/pages/Sessions.jsx";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import Logout from "../modules/auth/pages/Logout.jsx";
import { Link } from "react-router-dom";


function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <h1 className="text-3xl font-bold">Vettly Dashboard</h1>

      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Your account is authenticated.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          to="/profile"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          View profile
        </Link>

        <Link
          to="/sessions"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Manage sessions
        </Link>

        <Link
          to="/logout"
          className="text-red-600 hover:underline dark:text-red-400"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}



export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App/>}/>

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/resend-verification"
            element={<ResendVerification />}
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/me" element={<Profile />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/logout" element={<Logout/>}/>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
