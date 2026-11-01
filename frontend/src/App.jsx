import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ProfessorWorkspace from "./components/professor/ProfessorWorkspace";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("acadNexusToken");

  useEffect(() => {
    if (!token) return;

    // Push initial history state so browser Back button fires a popstate event
    window.history.pushState({ protectedDashboard: true }, "", window.location.href);

    const handlePopState = () => {
      const activeToken = localStorage.getItem("acadNexusToken");
      if (!activeToken) return;

      const confirmLogout = window.confirm("Are you sure you want to log out?");
      if (confirmLogout) {
        localStorage.removeItem("acadNexusToken");
        localStorage.removeItem("acadNexusUser");
        window.dispatchEvent(new Event("acadNexusAuthChanged"));
        window.location.replace("/login");
      } else {
        // Re-push history entry so the user stays on dashboard and future Back presses are caught
        window.history.pushState({ protectedDashboard: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem("acadNexusToken");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("acadNexusUser") || "null")
  );

  useEffect(() => {
    const syncUser = () => {
      setUser(JSON.parse(localStorage.getItem("acadNexusUser") || "null"));
    };

    const checkAuthRouteRedirect = () => {
      const token = localStorage.getItem("acadNexusToken");
      const currentPath = window.location.pathname;
      if (token && (currentPath === "/login" || currentPath === "/register")) {
        window.location.replace("/dashboard");
      }
    };

    window.addEventListener("acadNexusAuthChanged", syncUser);
    window.addEventListener("popstate", checkAuthRouteRedirect);
    window.addEventListener("pageshow", checkAuthRouteRedirect);

    return () => {
      window.removeEventListener("acadNexusAuthChanged", syncUser);
      window.removeEventListener("popstate", checkAuthRouteRedirect);
      window.removeEventListener("pageshow", checkAuthRouteRedirect);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Main role-based dashboard router */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === "admin" ? (
              <AdminDashboard />
            ) : user?.role === "professor" ? (
              <ProfessorWorkspace />
            ) : (
              <StudentDashboard />
            )}
          </ProtectedRoute>
        }
      />

      {/* Explicit Professor Workspace route */}
      <Route
        path="/professor"
        element={
          <ProtectedRoute>
            <ProfessorWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/*"
        element={
          <ProtectedRoute>
            <ProfessorWorkspace />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
