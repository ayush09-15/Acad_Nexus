
import { useState } from "react";

export default function AdminDashboard() {
  const user = JSON.parse(
    localStorage.getItem("acadNexusUser") || "null"
  );

  const [message, setMessage] = useState("");

  function handleLogout() {
    localStorage.removeItem("acadNexusToken");
    localStorage.removeItem("acadNexusUser");
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: "32px", fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <h1>Acad Nexus Admin</h1>
          <p>Welcome, {user?.name || "Admin"}</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <hr style={{ margin: "24px 0" }} />

      <h2>Admin Dashboard</h2>
      <p>Manage professors and oversee the platform.</p>

      <section style={{ marginTop: "24px" }}>
        <h3>Professor Management</h3>
        <p>
          Create professor accounts and approve professor registrations.
        </p>

        <button
          onClick={() =>
            setMessage(
              "Professor management will be connected to the backend next."
            )
          }
        >
          Manage Professors
        </button>

        {message && <p role="status">{message}</p>}
      </section>
    </main>
  );
}
