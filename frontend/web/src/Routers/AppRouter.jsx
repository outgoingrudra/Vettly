
import App from "../App.jsx";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "../context/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import DashboardLayout from "../components/layout/DashboardLayout.jsx";

// Dashboard
import Dashboard from "../modules/dashboard/pages/Dashboard.jsx";

// Authentication Pages
import Login from "../modules/auth/pages/Login.jsx";
import Signup from "../modules/auth/pages/Signup.jsx";
import VerifyEmail from "../modules/auth/pages/VerifyEmail.jsx";
import ForgotPassword from "../modules/auth/pages/ForgotPassword.jsx";
import ResetPassword from "../modules/auth/pages/ResetPassword.jsx";
import ResendVerification from "../modules/auth/pages/ResendVerification.jsx";
import Profile from "../modules/auth/pages/Profile.jsx";
import Sessions from "../modules/auth/pages/Sessions.jsx";
import Logout from "../modules/auth/pages/Logout.jsx";

// Video Interview
import VideoInterview from "../modules/video/pages/VideoInterview.jsx";

// Interview Module
import InterviewDashboard from "../modules/interview/pages/InterviewDashboard.jsx";
import CreateInterview from "../modules/interview/pages/CreateInterview.jsx";
import InterviewDetails from "../modules/interview/pages/InterviewDetails.jsx";
import EditInterview from "../modules/interview/pages/EditInterview.jsx";
import QuestionManagement from "../modules/interview/pages/QuestionManagement.jsx";
import CandidateInterview from "../modules/interview/pages/CandidateInterview.jsx";
import InterviewAttempt from "../modules/interview/pages/InterviewAttempt.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<App />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resend-verification" element={<ResendVerification />} />

          {/* PROTECTED ROUTES */}
          <Route element={<ProtectedRoute />}>
            
            {/* SHARED DASHBOARD LAYOUT */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Account */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/sessions" element={<Sessions />} />

              {/* Interview Module */}
              <Route path="/interviews" element={<InterviewDashboard />} />
              <Route path="/interviews/create" element={<CreateInterview />} />
              <Route path="/interviews/:id" element={<InterviewDetails />} />
              <Route path="/interviews/:id/edit" element={<EditInterview />} />
              <Route path="/interviews/:id/questions" element={<QuestionManagement />} />

              {/* Candidate Interview */}
              <Route path="/interviews/:id/join" element={<CandidateInterview />} />

              {/* Assessment Attempt */}
              <Route path="/interviews/:id/attempt" element={<InterviewAttempt />} />

              {/* Live Video Interview */}
              <Route path="/interviews/:id/video" element={<VideoInterview />} />
            </Route>

            {/* Routes outside the dashboard layout */}
            <Route path="/logout" element={<Logout />} />
            <Route
              path="/me"
              element={<Navigate to="/profile" replace />}
            />
          </Route>

          {/* FALLBACK */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
