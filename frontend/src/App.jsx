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

    window.addEventListener("acadNexusAuthChanged", syncUser);

    return () => {
      window.removeEventListener("acadNexusAuthChanged", syncUser);
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
