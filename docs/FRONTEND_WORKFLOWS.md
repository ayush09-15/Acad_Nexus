# Acad Nexus — Frontend Workflows & Integration Architecture

**Author:** Gaurav (Frontend & User-Facing Integration Engineer)  
**Branch:** `Gaurav`  
**Integration Target:** `ayush`  

---

## 1. Architectural Overview

The frontend is built with **React 19**, **Vite**, and **React Router DOM v7**. Development on the `Gaurav` feature branch focused on delivering production-grade user workflows for students and professors while maintaining backward compatibility with teammates' authentication and administrative modules.

```text
frontend/src/
├── services/
│   ├── api.js                   # Centralized API service (Bearer token, error normalization)
│   └── auth.api.js              # Authentication service (login/register)
├── components/
│   ├── StudentDashboard.jsx     # Enrolled classes, search, notes, class chat
│   ├── JoinClassSection.jsx     # Accessible join form with validation & duplicate protection
│   ├── AdminDashboard.jsx       # Platform administration (ayush/smruti)
│   ├── ProfessorManagement.jsx  # Professor approvals (smruti/ayush)
│   ├── ui/
│   │   ├── FeedbackComponents.jsx # LoadingSpinner, ErrorMessage, EmptyState, ConfirmDialog
│   │   └── FeedbackComponents.css # Design system feedback styles
│   └── professor/
│       ├── ProfessorWorkspace.jsx # Professor metrics, class grid, navigation
│       ├── ProfessorClassCard.jsx # Card with join key copy & actions
│       ├── CreateClassModal.jsx   # Validated class creation dialog
│       ├── ClassDetailsModal.jsx  # Shareable student invitation snippet
│       └── ProfessorWorkspace.css # Professor dashboard styling
├── pages/
│   ├── LandingPage.jsx          # Public marketing & hero section
│   ├── LoginPage.jsx            # User login
│   └── RegisterPage.jsx         # Student registration
├── App.jsx                      # Protected role-based routing
└── App.css                      # Global layout & utility rules
```

---

## 2. Implemented Workflows & Features

### A. Student Dashboard (`StudentDashboard.jsx`)
- **Backend API Integration:** Fetches live classes from `GET /api/classes` using the centralized `fetchClasses()` service.
- **Empty & Loading States:** Renders `LoadingSpinner` during requests and `EmptyState` when no classes are enrolled, with a one-click CTA to focus the join input.
- **Search & Filtering:** Real-time client-side search across course title, subject, and instructor name.
- **Error Handling & Retry:** Automatically distinguishes session expiration (401) from network failures, offering inline "Try again" retry actions.
- **Navigation Continuity:** Maintains notes searching and simulated AI class assistant chat history in `localStorage`.

### B. Student Join-Class Workflow (`JoinClassSection.jsx`)
- **Input Validation:** Enforces alphanumeric validation, minimum length (4 characters), whitespace trimming, and uppercase normalization before dispatching network requests.
- **Duplicate Protection:** Prevents duplicate submissions by verifying both local join code and MongoDB `_id` against currently enrolled classes.
- **Duplicate Request Guard:** Disables buttons and displays "Joining class…" with `aria-busy` during active requests.
- **Live Roster Refresh:** Automatically refreshes the student dashboard class grid and sidebar navigation upon confirmed enrollment.
- **Dual Placement:** Reusable in both the Dashboard side-panel and the dedicated "Join a class" sidebar view.

### C. Professor Workspace (`ProfessorWorkspace.jsx`)
- **Role-Based Routing:** Seamlessly rendered when an authenticated user with `role === "professor"` navigates to `/dashboard`.
- **Authorization Scoping:** Scopes class queries to ensure professors only view and manage courses matching their authenticated user ID or name (`c.professorId === user.id`).
- **Class Creation (`CreateClassModal.jsx`):** Validated creation modal (minimum 3 characters for course name) that submits to `POST /api/classes` and displays the backend-generated 8-character cryptographic join key.
- **Copy Join Key:** One-click clipboard copy utility with fallback for non-secure contexts and visual "✓ Copied!" confirmation.
- **Class Invitation Details (`ClassDetailsModal.jsx`):** Generates pre-formatted invitation text ready to share with students via email or LMS.
- **Class Deletion with Confirmation (`ConfirmDialog.jsx`):** Employs an accessible modal dialog requiring explicit confirmation before executing `DELETE /api/classes/:id`.
- **Keyboard Navigation & Accessibility:** All modals feature `Escape` key listeners, focus trapping, and ARIA modal metadata.

---

## 3. Backend API Contracts & Integration Status

| Endpoint | Method | Role Required | Request Body | Response Format | Status / Notes |
|---|---|---|---|---|---|
| `/api/classes` | `GET` | Authenticated | None | `{ success: true, count: N, data: [...] }` | **Verified** — Used by student and professor dashboards. |
| `/api/classes` | `POST` | `professor` | `{ name, subject, description }` | `{ success: true, message: "...", data: classObj }` | **Verified** — Backend generates `joinCode` and attaches `professorId`. |
| `/api/classes/join` | `POST` | `student` | `{ joinCode }` | `{ success: true, message: "...", data: classObj }` | **Integrated** — *Backend Dependency:* Current backend finds class by code but does not push student ID to `Class.students`. |
| `/api/classes/:id` | `DELETE` | `professor` | None | `{ success: true, message: "Class deleted successfully" }` | **Verified** — Ownership check enforced on backend. |
| `/api/classes/:id` | `PUT`/`PATCH`| `professor` | `{ name, subject, description }` | Expected: `{ success: true, data: updatedClass }` | **Pending Backend** — UI shows informative notification regarding pending endpoint. |

---

## 4. Verification & Testing

Automated tests are located in `tests/` and use Node.js's native test runner (`node:test` and `node:assert/strict`).

### Running Tests
From the `frontend/` directory:
```bash
npm test
```
Or from the project root:
```bash
node --test tests/*.test.js
```

### Test Suites Included
1. **`tests/frontend-validation.test.js`**:
   - Class key validation (rejection of blanks, special chars, short keys; acceptance of valid alphanumeric keys).
   - Class name validation (minimum length check).
   - Duplicate enrollment detection (case-insensitive codes and IDs).
   - Professor workspace authorization filtering.
2. **`tests/api-contracts.test.js`**:
   - Request payload serialization and Bearer token injection.
   - API error responses (400, 401, 403, 404).
   - Role-based dashboard routing resolution (`student`, `professor`, `admin`).

### Production Build Verification
```bash
npm run build
```
Ensures all modules compile cleanly with zero Vite build warnings or errors.
