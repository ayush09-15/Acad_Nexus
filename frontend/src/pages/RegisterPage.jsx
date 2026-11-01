import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth.api";

export default function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("acadNexusToken");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const [role, setRole] = useState("student"); // "student" | "professor"
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        department: role === "professor" ? form.department.trim() : undefined,
        designation: role === "professor" ? form.designation.trim() : undefined,
      });

      if (role === "professor") {
        setSuccess(
          result.message ||
            "Professor account created successfully! It is pending approval by an administrator before you can log in."
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setSuccess(result.message || "Student account created! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" style={{ maxWidth: "440px" }}>
        <Link to="/" className="auth-brand">
          Acad Nexus
        </Link>

        <h1>Create an account</h1>
        <p className="auth-subtitle">
          {role === "professor"
            ? "Sign up for a faculty account. Once approved by an admin, you can create classrooms and upload course materials."
            : "Join your classes, ask questions to study materials, and study smarter."}
        </p>

        {/* Role Toggle Selector */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "20px",
            background: "#020617",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid #1e293b",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "9px 12px",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: role === "student" ? "#0ea5e9" : "transparent",
              color: role === "student" ? "#ffffff" : "#94a3b8",
            }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("professor");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "9px 12px",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: role === "professor" ? "#0ea5e9" : "transparent",
              color: role === "professor" ? "#ffffff" : "#94a3b8",
            }}
          >
            👨‍🏫 Professor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="name">
            {role === "professor" ? "Full Name (e.g. Dr. Jane Smith)" : "Full name"}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={
              role === "professor"
                ? "Dr. Alex Johnson"
                : "Enter your full name"
            }
            value={form.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">
            {role === "professor"
              ? "Faculty / Institutional Email"
              : "Email address"}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={
              role === "professor"
                ? "prof.johnson@university.edu"
                : "student@university.edu"
            }
            value={form.email}
            onChange={handleChange}
            required
          />

          {role === "professor" && (
            <>
              <label htmlFor="department">Academic Department</label>
              <input
                id="department"
                name="department"
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                value={form.department}
                onChange={handleChange}
              />

              <label htmlFor="designation">Academic Designation</label>
              <input
                id="designation"
                name="designation"
                type="text"
                placeholder="e.g. Assistant Professor, Lecturer, HOD"
                value={form.designation}
                onChange={handleChange}
              />
            </>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            required
          />

          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password again"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && (
            <div
              style={{
                margin: "12px 0",
                padding: "12px 14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: "1.4",
              }}
              role="status"
            >
              ✓ {success}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Creating account…"
              : `Create ${role === "professor" ? "Professor" : "Student"} Account`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <p className="auth-note">
          {role === "professor"
            ? "⚠️ Notice: Professor accounts must be approved by an administrator before login is permitted."
            : "Student accounts can enroll in courses using join keys provided by professors."}
        </p>
      </section>
    </main>
  );
}
