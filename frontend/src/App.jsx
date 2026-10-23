
import { useState } from "react";
import "./App.css";

const initialClasses = [
  {
    id: 1,
    name: "Database Management Systems",
    professor: "Prof. Sharma",
  },
  {
    id: 2,
    name: "Operating Systems",
    professor: "Prof. Verma",
  },
  {
    id: 3,
    name: "Computer Networks",
    professor: "Prof. Singh",
  },
];

// Temporary demo notes.
const initialNotes = [
  {
    id: 1,
    title: "Normalization: 2NF vs 3NF",
    subject: "Database Management Systems",
  },
  {
    id: 2,
    title: "Transactions and ACID",
    subject: "Database Management Systems",
  },
];

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [classKey, setClassKey] = useState("");
  const [classes] = useState(initialClasses);
  const [notes] = useState(initialNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  // Handle the demo join-class form.
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

  // Navigate to a page and clear any previous message.
  function navigateTo(page) {
    setActivePage(page);
    setMessage("");
  }

  // Search notes by title or subject.
  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.subject}`
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  // Build sidebar navigation from the current class list.
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
      {/* Sidebar */}
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
                  onClick={() => navigateTo(item)}
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

      {/* Main content */}
      <main className="main-area">
        {/* Header */}
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR ACADEMIC WORKSPACE</p>

            <h1>
              {activePage === "Dashboard"
                ? "Welcome back, Ayush"
                : activePage}
            </h1>
          </div>

          <span className="topbar-label">
            Learn from your class PDFs
          </span>
        </header>

        {/* Dashboard */}
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
                  <article
                    className="class-card"
                    key={course.id}
                  >
                    <div className="course-icon">
                      {course.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <h3>{course.name}</h3>

                    <p className="professor">
                      {course.professor}
                    </p>

                    <button
                      className="primary-button"
                      onClick={() => navigateTo(course.name)}
                    >
                      Open class chat <span>→</span>
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="right-column">
              {/* Join class */}
              <section className="panel join-panel">
                <div className="panel-icon">＋</div>

                <h2>Join a class</h2>

                <p>
                  Ask your professor for the class key to join a class.
                </p>

                <form onSubmit={joinClass}>
                  <label htmlFor="class-key">Class key</label>

                  <input
                    id="class-key"
                    type="text"
                    value={classKey}
                    onChange={(event) =>
                      setClassKey(event.target.value)
                    }
                    placeholder="Enter class key"
                  />

                  <button
                    className="primary-button full-width"
                    type="submit"
                  >
                    Join class <span>→</span>
                  </button>
                </form>

                {message && (
                  <p className="form-message" role="status">
                    {message}
                  </p>
                )}
              </section>

              {/* Recent notes */}
              <section className="panel notes-panel">
                <h2>Recent notes</h2>

                {notes.map((note) => (
                  <button
                    className="note-link"
                    key={note.id}
                    onClick={() => navigateTo("My Notes")}
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
                  onClick={() => navigateTo("My Notes")}
                >
                  View all notes →
                </button>
              </section>
            </aside>
          </div>
        )}

        {/* Join class page */}
        {activePage === "Join a class" && (
          <section className="panel placeholder-panel">
            <div className="placeholder-icon">＋</div>

            <p className="eyebrow">JOIN YOUR CLASS</p>
            <h2>Join a class</h2>

            <p>
              Enter the class key provided by your professor.
            </p>

            <form onSubmit={joinClass}>
              <label htmlFor="sidebar-class-key">Class key</label>

              <input
                id="sidebar-class-key"
                type="text"
                value={classKey}
                onChange={(event) =>
                  setClassKey(event.target.value)
                }
                placeholder="Enter class key"
              />

              <button
                className="primary-button"
                type="submit"
              >
                Join class <span>→</span>
              </button>
            </form>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button
              className="text-button"
              onClick={() => navigateTo("Dashboard")}
            >
              ← Back to dashboard
            </button>
          </section>
        )}

        {/* My Notes page */}
        {activePage === "My Notes" && (
          <section className="notes-page">
            <div className="notes-page-heading">
              <div>
                <p className="eyebrow">YOUR PERSONAL LIBRARY</p>
                <h2>My Notes</h2>

                <p className="notes-description">
                  Find and revisit notes you've saved from your classes.
                </p>
              </div>

              <span className="count-badge">
                {filteredNotes.length} notes
              </span>
            </div>

            <div className="notes-search">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search by note title or subject..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                aria-label="Search notes"
              />
            </div>

            <div className="notes-list">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <article
                    className="saved-note-card"
                    key={note.id}
                  >
                    <div className="saved-note-icon">▤</div>

                    <div className="saved-note-content">
                      <h3>{note.title}</h3>
                      <p>{note.subject}</p>

                      <span className="saved-note-label">
                        Saved note
                      </span>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setMessage(
                          `Opening "${note.title}" will be available when note details are implemented.`
                        )
                      }
                    >
                      View note →
                    </button>
                  </article>
                ))
              ) : (
                <div className="notes-empty-state">
                  <div className="placeholder-icon">⌕</div>

                  <h3>No notes found</h3>

                  <p>
                    Try another search term to find your saved notes.
                  </p>
                </div>
              )}
            </div>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button
              className="primary-button"
              onClick={() => {
                setSearchQuery("");
                navigateTo("Dashboard");
              }}
            >
              ← Back to dashboard
            </button>
          </section>
        )}

        {/* Class chat placeholder and other future pages */}
        {activePage !== "Dashboard" &&
          activePage !== "My Notes" &&
          activePage !== "Join a class" && (
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
                onClick={() => navigateTo("Dashboard")}
              >
                ← Back to dashboard
              </button>
            </section>
          )}
      </main>
    </div>
  );
}
