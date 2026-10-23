
import { useState } from "react";
import "./App.css";

const initialClasses = [
  { name: "Database Management Systems", professor: "Prof. Sharma" },
  { name: "Operating Systems", professor: "Prof. Verma" },
  { name: "Computer Networks", professor: "Prof. Singh" },
];

const initialNotes = [
  { title: "Normalization: 2NF vs 3NF", subject: "Database Management Systems" },
  { title: "Transactions and ACID", subject: "Database Management Systems" },
];

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [classKey, setClassKey] = useState("");
  const [classes, setClasses] = useState(initialClasses);
  const [notes] = useState(initialNotes);
  const [message, setMessage] = useState("");

  function joinClass(event) {
    event.preventDefault();

    if (!classKey.trim()) {
      setMessage("Please enter a class key.");
      return;
    }

    setMessage(
      "Demo only: class joining will work when the backend is connected."
    );
  }

  const navGroups = [
  {
    heading: "MY CLASSES",
    items: classes.map((course) => course.name),
  },
  {
    heading: "PERSONAL",
    items: ["My Notes", "Join a class"],
  },
];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Acad Nexus</span>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.heading}>
              <p className="nav-heading">{group.heading}</p>

              {group.items.map((item) => (
                <button
                  key={item}
                  className={`nav-link ${
                    activePage === item ? "active" : ""
                  }`}
                  onClick={() => {
                    setActivePage(item);
                    setMessage("");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="profile-card">
          <strong>Ayush Pratap Singh</strong>
          <span className="verified-badge">Verified student</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR ACADEMIC WORKSPACE</p>
            <h1>
              {activePage === "Dashboard"
                ? "Welcome back, Ayush"
                : activePage}
            </h1>
          </div>
          <span className="topbar-label">Learn from your class PDFs</span>
        </header>

        {activePage === "Dashboard" && (
          <div className="dashboard-content">
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR LEARNING SPACE</p>
                  <h2>My classes</h2>
                </div>
                <span className="count-badge">
                  {classes.length} classes
                </span>
              </div>

              <div className="class-grid">
                {classes.map((course) => (
               <article className="class-card" key={course.name}>
               <div className="course-icon">
               {course.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
                </div>
                    <h3>{course.name}</h3>
                    <p className="professor">{course.professor}</p>
                    <button
                      className="primary-button"
                      onClick={() => setActivePage(course.name)}
                    >
                      Open class chat <span>→</span>
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="right-column">
              <section className="panel join-panel">
                <div className="panel-icon">＋</div>
                <h2>Join a class</h2>
                <p>Ask your professor for the class key to join a class.</p>

                <form onSubmit={joinClass}>
                  <label htmlFor="class-key">Class key</label>
                  <input
                    id="class-key"
                    value={classKey}
                    onChange={(event) => setClassKey(event.target.value)}
                    placeholder="Enter class key"
                  />
                  <button className="primary-button full-width" type="submit">
                    Join class <span>→</span>
                  </button>
                </form>

                {message && <p className="form-message">{message}</p>}
              </section>

              <section className="panel notes-panel">
                <h2>Recent notes</h2>
                {notes.map((note) => (
                  <button
                    className="note-link"
                    key={note.title}
                    onClick={() => setActivePage("My Notes")}
                  >
                    <span className="note-dot" />
                    <span>
                      <strong>{note.title}</strong>
                      <small>{note.subject}</small>
                    </span>
                    <span className="note-arrow">→</span>
                  </button>
                ))}
                <button
                  className="text-button"
                  onClick={() => setActivePage("My Notes")}
                >
                  View all notes →
                </button>
              </section>
            </aside>
          </div>
        )}

        {activePage !== "Dashboard" && (
          <section className="panel placeholder-panel">
            <div className="placeholder-icon">✦</div>
            <p className="eyebrow">ACAD NEXUS</p>
            <h2>{activePage}</h2>
            <p>
              This section is ready for the next development step.
              We'll build its features and connect them to the backend.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage("Dashboard")}
            >
              ← Back to dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
