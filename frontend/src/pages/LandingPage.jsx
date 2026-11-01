
import { Link } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
  const token = localStorage.getItem("acadNexusToken");

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">A</span>
          Acad Nexus
        </Link>

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          {token ? (
            <Link to="/dashboard" className="landing-signup">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-login">
                Log in
              </Link>
              <Link to="/register" className="landing-signup">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-content">
            <span className="landing-badge">
              YOUR CAMPUS. ONE CONNECTED SPACE.
            </span>

            <h1>
              Learn together.
              <br />
              <span>Grow together.</span>
            </h1>

            <p>
              A smarter learning space where professors organize
              classes, students access study materials, and everyone
              stays connected.
            </p>

            <div className="landing-hero-actions">
              {token ? (
                <Link to="/dashboard" className="landing-primary-button">
                  Go to Dashboard <span>→</span>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="landing-primary-button">
                    Get Started <span>→</span>
                  </Link>

                  <Link to="/login" className="landing-secondary-button">
                    Sign in to your account
                  </Link>
                </>
              )}
            </div>

            <div className="landing-trust-note">
              <span>✓</span> One platform for your academic journey
            </div>
          </div>

          <div className="landing-visual" aria-label="Learning dashboard preview">
            <div className="preview-window">
              <div className="preview-topbar">
                <div className="preview-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>acad-nexus / dashboard</span>
              </div>

              <div className="preview-body">
                <div className="preview-sidebar">
                  <div className="preview-logo">A</div>
                  <span className="preview-active">▦</span>
                  <span>▤</span>
                  <span>✦</span>
                </div>

                <div className="preview-content">
                  <span className="preview-greeting">
                    YOUR LEARNING SPACE
                  </span>
                  <h3>Welcome back!</h3>
                  <p className="preview-subtitle">
                    Continue where you left off.
                  </p>

                  <div className="preview-stats">
                    <div>
                      <span>My classes</span>
                      <strong>Learn</strong>
                    </div>
                    <div>
                      <span>Study notes</span>
                      <strong>Explore</strong>
                    </div>
                  </div>

                  <div className="preview-course">
                    <div className="preview-course-icon">DB</div>
                    <div>
                      <strong>Database Systems</strong>
                      <p>Study materials and class discussions</p>
                    </div>
                    <span>→</span>
                  </div>

                  <div className="preview-course">
                    <div className="preview-course-icon purple">AI</div>
                    <div>
                      <strong>Artificial Intelligence</strong>
                      <p>Explore concepts and resources</p>
                    </div>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="floating-note">
              <span className="floating-note-icon">✦</span>
              <div>
                <strong>Learn smarter</strong>
                <p>Your academic hub</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-features">
          <div className="landing-section-heading">
            <span>BUILT FOR CAMPUS LIFE</span>
            <h2>Everything in one place.</h2>
            <p>
              Keep your classes, learning resources, and academic
              collaboration organized.
            </p>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <span className="feature-icon blue">▦</span>
              <h3>Organized classes</h3>
              <p>
                Bring your courses together in one place and make
                classroom access simpler.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="feature-icon purple">✦</span>
              <h3>Smarter studying</h3>
              <p>
                Keep study resources close at hand and build a more
                focused learning routine.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="feature-icon orange">⌘</span>
              <h3>Connected learning</h3>
              <p>
                Give students and professors a shared space for
                academic collaboration.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">A</span>
          Acad Nexus
        </Link>
        <span>Made for better learning.</span>
      </footer>
    </div>
  );
}
