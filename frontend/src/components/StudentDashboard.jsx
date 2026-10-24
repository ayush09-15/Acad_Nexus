import { useEffect, useState, useCallback } from "react";
import {
  fetchClasses,
  joinClassByCode,
  getStoredUser,
  clearAuth,
} from "../services/api";
import {
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  SuccessMessage,
} from "./ui/FeedbackComponents";
import "../components/ui/FeedbackComponents.css";

// Temporary demo notes (unchanged from original).
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

function loadFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

export default function StudentDashboard() {
  const storedUser = getStoredUser();
  const userName = storedUser?.name || "Student";

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const [activePage, setActivePage] = useState("Dashboard");
  const [classKey, setClassKey] = useState("");
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState("");
  const [notes] = useState(initialNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "success" | "error"
  const [joinLoading, setJoinLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState(() =>
    loadFromStorage("acad-nexus-chat-messages", {})
  );
  const [chatInput, setChatInput] = useState("");

  // Save chat history whenever messages change.
  useEffect(() => {
    localStorage.setItem(
      "acad-nexus-chat-messages",
      JSON.stringify(chatMessages)
    );
  }, [chatMessages]);

  // Fetch classes from the backend on user action or retry.
  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    setClassesError("");

    try {
      const result = await fetchClasses();
      const fetchedClasses = result.data || [];
      setClasses(fetchedClasses);
    } catch (error) {
      if (error.message?.includes("Authentication") || error.message?.includes("token")) {
        setClassesError("Your session has expired. Please log in again.");
      } else {
        setClassesError(error.message || "Unable to load classes.");
      }
    } finally {
      setClassesLoading(false);
    }
  }, []);

  // Initial load on mount via async promise resolution to prevent cascading renders.
  useEffect(() => {
    let ignore = false;

    fetchClasses()
      .then((result) => {
        if (!ignore) {
          setClasses(result.data || []);
          setClassesLoading(false);
        }
      })
      .catch((error) => {
        if (!ignore) {
          if (error.message?.includes("Authentication") || error.message?.includes("token")) {
            setClassesError("Your session has expired. Please log in again.");
          } else {
            setClassesError(error.message || "Unable to load classes.");
          }
          setClassesLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Handle join-class form submission.
  async function handleJoinClass(event) {
    event.preventDefault();

    const enteredKey = classKey.trim().toUpperCase();

    if (!enteredKey) {
      setMessage("Please enter a class key.");
      setMessageType("error");
      return;
    }

    if (enteredKey.length < 4) {
      setMessage("Class keys are at least 4 characters long.");
      setMessageType("error");
      return;
    }

    try {
      setMessage("");
      setJoinLoading(true);

      const result = await joinClassByCode(enteredKey);
      const course = result.data;

      const alreadyJoined = classes.some(
        (existingClass) => existingClass._id === course._id
      );

      if (alreadyJoined) {
        setMessage("This class is already in your list.");
        setMessageType("info");
        setJoinLoading(false);
        return;
      }

      // Add the class to the local list and refresh from backend.
      setClasses((previousClasses) => [...previousClasses, course]);
      setClassKey("");
      setMessage(`Successfully joined: ${course.name}`);
      setMessageType("success");

      // Refresh the class list from the backend to get the latest state.
      loadClasses();
    } catch (error) {
      if (error.message?.includes("not found") || error.message?.includes("Invalid")) {
        setMessage("Invalid class key. Please check and try again.");
      } else {
        setMessage(error.message || "Unable to join the class.");
      }
      setMessageType("error");
    } finally {
      setJoinLoading(false);
    }
  }

  // Navigate to a page and clear any previous message.
  function navigateTo(page) {
    setActivePage(page);
    setMessage("");
  }

  function sendChatMessage(event) {
    event.preventDefault();

    const question = chatInput.trim();

    if (!question) return;

    setChatMessages((previousMessages) => ({
      ...previousMessages,
      [activePage]: [
        ...(previousMessages[activePage] || []),
        {
          id: Date.now(),
          role: "user",
          text: question,
        },
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            "This is a demo response. AI answers based on your professor's PDFs will be available when the backend is connected.",
        },
      ],
    }));

    setChatInput("");
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

  // Render the join-class form (shared between dashboard and join page).
  function renderJoinForm(inputId) {
    return (
      <form onSubmit={handleJoinClass}>
        <label htmlFor={inputId}>Class key</label>

        <input
          id={inputId}
          type="text"
          value={classKey}
          onChange={(event) => setClassKey(event.target.value)}
          placeholder="Enter class key"
          disabled={joinLoading}
          aria-describedby={message ? `${inputId}-message` : undefined}
        />

        <button
          className="primary-button full-width"
          type="submit"
          disabled={joinLoading || !classKey.trim()}
        >
          {joinLoading ? "Joining…" : "Join class"} <span>→</span>
        </button>
      </form>
    );
  }

  // Render the message feedback below forms.
  function renderMessage(idPrefix) {
    if (!message) return null;

    if (messageType === "success") {
      return <SuccessMessage message={message} />;
    }

    const className = messageType === "error"
      ? "form-message form-message--error"
      : "form-message";

    return (
      <p
        className={className}
        role="status"
        id={idPrefix ? `${idPrefix}-message` : undefined}
      >
        {message}
      </p>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Acad Nexus</span>
        </div>

        <nav className="sidebar-nav" aria-label="Student navigation">
          <button
            className={`nav-link ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => navigateTo("Dashboard")}
          >
            Dashboard
          </button>

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
          <div className="user-actions">
            <strong>{userName}</strong>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
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
                ? `Welcome back, ${userName.split(" ")[0]}`
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

              {classesLoading && (
                <LoadingSpinner message="Loading your classes…" />
              )}

              {classesError && (
                <ErrorMessage
                  message={classesError}
                  onRetry={loadClasses}
                />
              )}

              {!classesLoading && !classesError && classes.length === 0 && (
                <EmptyState
                  icon="＋"
                  heading="No classes yet"
                  description="Join a class using a class key from your professor, or ask your professor to create a class."
                />
              )}

              {!classesLoading && !classesError && classes.length > 0 && (
                <div className="class-grid">
                  {classes.map((course) => (
                    <article
                      className="class-card"
                      key={course._id || course.id}
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

                      {course.subject && (
                        <p className="class-subject">{course.subject}</p>
                      )}

                      <button
                        className="primary-button"
                        onClick={() => navigateTo(course.name)}
                      >
                        Open class chat <span>→</span>
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="right-column">
              {/* Join class */}
              <section className="panel join-panel">
                <div className="panel-icon">＋</div>

                <h2>Join a class</h2>

                <p>
                  Ask your professor for the class key to join a class.
                </p>

                {renderJoinForm("class-key")}
                {renderMessage("class-key")}
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

            {renderJoinForm("sidebar-class-key")}
            {renderMessage("sidebar-class-key")}

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
                <EmptyState
                  icon="⌕"
                  heading="No notes found"
                  description="Try another search term to find your saved notes."
                />
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

        {/* Class chat page */}
        {classes.some((course) => course.name === activePage) && (
          <section className="chat-page">
            <div className="chat-heading">
              <div>
                <p className="eyebrow">YOUR CLASSROOM ASSISTANT</p>
                <h2>{activePage}</h2>
                <p>Ask questions about your class study materials.</p>
              </div>

              <button
                className="text-button"
                onClick={() => navigateTo("Dashboard")}
              >
                ← Dashboard
              </button>
            </div>

            <div className="chat-suggestions">
              <p>Try asking</p>

              {[
                "Explain the important concepts",
                "Summarize my class notes",
                "Give me exam preparation questions",
              ].map((question) => (
                <button
                  key={question}
                  className="suggestion-button"
                  onClick={() => setChatInput(question)}
                >
                  {question} →
                </button>
              ))}
            </div>

            <div className="chat-conversation" aria-live="polite">
              {(chatMessages[activePage] || []).length === 0 ? (
                <div className="chat-empty-state">
                  <div className="placeholder-icon">✦</div>
                  <h3>What would you like to learn?</h3>
                  <p>
                    Ask a question to get started with your class assistant.
                  </p>
                </div>
              ) : (
                (chatMessages[activePage] || []).map((chatMessage) => (
                  <div
                    key={chatMessage.id}
                    className={`chat-message ${
                      chatMessage.role === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >
                    <span className="chat-role">
                      {chatMessage.role === "user" ? "You" : "Acad Nexus AI"}
                    </span>
                    <p>{chatMessage.text}</p>
                  </div>
                ))
              )}
            </div>

            <form className="chat-input-form" onSubmit={sendChatMessage}>
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={`Ask a question about ${activePage}...`}
                aria-label="Ask your class assistant"
              />

              <button
                type="submit"
                className="primary-button"
                disabled={!chatInput.trim()}
              >
                Send →
              </button>
            </form>

            <p className="chat-disclaimer">
              Demo mode: responses are placeholders and are not based on uploaded PDFs.
            </p>
          </section>
        )}

        {/* Other future pages */}
        {activePage !== "Dashboard" &&
          activePage !== "My Notes" &&
          activePage !== "Join a class" &&
          !classes.some((course) => course.name === activePage) && (
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
