import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("acadNexusToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

 export default function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("acadNexusUser") || "null")
  );

  useEffect(() => {
    const syncUser = () => {
      setUser(
        JSON.parse(localStorage.getItem("acadNexusUser") || "null")
      );
    };

    window.addEventListener("acadNexusAuthChanged", syncUser);

    return () => {
      window.removeEventListener("acadNexusAuthChanged", syncUser);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === "admin" ? (
              <AdminDashboard />
            ) : user?.role === "professor" ? (
              <div style={{ padding: "32px" }}>
                <h1>Professor Dashboard</h1>
                <p>Welcome, {user.name}.</p>
                <p>Professor features will be added next.</p>
              </div>
            ) : (
              <StudentDashboard />
            )}
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
