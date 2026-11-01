# Acad Nexus (CampusMind)

**An AI-powered academic workspace and document-grounded classroom learning platform.**

Acad Nexus bridges professors, students, and administrators through digital course workspaces, verified PDF lecture materials, and an AI study assistant grounded strictly in course documents with source citations.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client (React 18 + Vite)                          │
│     Student Dashboard    │    Professor Workspace    │    Admin Portal      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST (JWT Bearer Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Express Backend Gateway (:5001)                       │
│  - RBAC Middleware (Student, Professor, Admin)                              │
│  - Sliding-Window Rate Limiter (AI Queries, Auth, Uploads)                  │
│  - Document Upload Pipeline (Multer -> PDF extraction)                      │
│  - Notice Board & Deadline Scheduler                                        │
│  - ChatGPT-Style ChatSession & Message Store                                │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼                               ▼
        ┌─────────────────────────────┐  ┌─────────────────────────────┐
        │   MongoDB / Atlas Cluster   │  │   FastAPI AI Service (:8000)│
        │ - Users & Academic Profiles │  │ - PyPDF Chunking & Parsing  │
        │ - Classes & Join Codes      │  │ - Gemini 1.5 Flash Engine   │
        │ - Materials & Metadata      │  │ - Text-Embedding-004        │
        │ - Chat Sessions & Messages  │  └──────────────┬──────────────┘
        │ - Classroom Announcements   │                 │
        └─────────────────────────────┘                 ▼
                                         ┌─────────────────────────────┐
                                         │    Pinecone Vector DB       │
                                         │  (768-dim course embeddings)│
                                         └─────────────────────────────┘
```

---

## Key Features

### 1. Document-Grounded RAG Assistant
* **Grounded Q&A**: Answers are generated exclusively from uploaded course documents (lecture slides, notes, syllabi) to eliminate AI hallucinations.
* **Source Citations**: Every answer includes clickable source pills referencing the exact document title and page number (e.g., `📄 OS_Lecture4.pdf • Page 14`).
* **AI Engine**: Powered by Google Gemini 1.5 Flash and Pinecone vector store with cosine similarity matching over 768-dimensional embeddings.

### 2. ChatGPT-Style Multi-Session Chat History
* **Thread Persistence**: Conversation sessions are stored per student and per classroom in MongoDB.
* **Auto-Titling**: Conversations are automatically titled based on the student's initial query (e.g., *"Process Scheduling vs Threads"*).
* **Sidebar Management**: Students can create new chat threads, switch between previous discussions, or delete outdated sessions.

### 3. Classroom Collaboration & Deadlines
* **Course Notices & Alerts**: Professors post announcements, homework assignments, exam dates, and reminders.
* **Pinned Announcements**: Critical notices appear pinned atop both the student dashboard feed and the classroom workspace.
* **Dynamic Due Dates**: Assignment cards calculate real-time countdown badges (e.g., *Due in 2 days*, *Due tomorrow*, or *Overdue*).

### 4. Role-Based Workspaces (RBAC)
* **Student Dashboard**: Quick-join classes via secure 8-character join keys, dual-tab classroom view (AI Assistant vs. Notice Board), and personal saved study notes.
* **Professor Workspace**: Class creation, study materials manager with PDF uploads, student roster directory, and pre-lecture AI test playground.
* **Admin Portal**: Institutional verification and instructor approval workflows, direct faculty provisioning, and cross-course analytics.

### 5. Production Security & Reliability
* **Sliding-Window Rate Limiting**: Zero-dependency in-memory rate limiter protecting Gemini and Pinecone quotas:
  * AI Query Limiter: 15 queries/minute per student.
  * Auth Limiter: 10 attempts/15 minutes per IP.
  * Upload Limiter: 10 uploads/5 minutes per professor.
* **Defensive Gateway**: Strict 10MB payload cap on JSON bodies to prevent DoS attacks, and disabled Express fingerprinting headers (`x-powered-by`).
* **Navigation Protection**: Browser history replacement on login, `PublicOnlyRoute` wrappers, and logout confirmation prompts on browser Back navigation.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 7, Modern CSS Design System |
| **Backend API** | Node.js, Express, Mongoose, Multer, JWT, BcryptJS |
| **Database** | MongoDB / MongoDB Atlas (Document Store) |
| **AI Microservice** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **LLM & Embeddings**| Google Gemini 1.5 Flash, Gemini Embeddings (`text-embedding-004`) |
| **Vector Index** | Pinecone Vector Database (Cosine similarity, 768 dimensions) |
| **Testing** | Node.js Test Runner (`node:test`), Jest, Supertest |

---

## Project Structure

```text
Acad_Nexus/
├── frontend/               # React 18 client application (Vite)
│   ├── src/
│   │   ├── components/     # Student, Professor, Admin & Announcements UI
│   │   ├── services/       # Centralized API fetch layer & JWT handling
│   │   └── App.jsx         # Client routing, navigation guards & auth state
│   └── package.json
├── backend/                # Express REST API gateway
│   ├── src/
│   │   ├── controllers/    # Class, Auth, Material, Admin, & Announcement handlers
│   │   ├── middleware/     # Rate limiters & RBAC authentication guards
│   │   ├── models/         # Mongoose schemas (User, Class, Material, Chat, Announcement)
│   │   ├── routes/         # Express endpoint definitions
│   │   └── app.js          # Express app entrypoint & configuration
│   └── package.json
├── ai-service/             # FastAPI document processing & RAG microservice
│   ├── app/
│   │   ├── services/       # Pinecone indexing, Gemini LLM, & PDF semantic chunker
│   │   ├── routes/         # Ingestion & query endpoints
│   │   └── main.py         # FastAPI application entrypoint
│   └── requirements.txt
├── tests/                  # Contract tests & end-to-end integration test suites
├── docs/                   # System design, RAG architecture & API documentation
├── .env.example            # Environment configuration template
├── LICENSE                 # MIT License
└── README.md
```

---

## Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher and `npm`
* **Python**: v3.10 or higher and `pip`
* **MongoDB**: Local MongoDB instance or MongoDB Atlas URI
* **Google Gemini API Key**: For embedding generation and RAG answers
* **Pinecone API Key & Index**: 768-dimension index with cosine metric

---

### Step 1: Environment Setup

Clone the repository and copy the environment configuration:

```bash
git clone https://github.com/ayush09-15/Acad_Nexus.git
cd Acad_Nexus
```

Create `.env` in `backend/`:
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/acad_nexus
JWT_SECRET=your_secure_random_jwt_secret_key
AI_SERVICE_URL=http://127.0.0.1:8000
```

Create `.env` in `ai-service/`:
```env
PORT=8000
HOST=0.0.0.0
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=models/text-embedding-004
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=acad-nexus-materials
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5001,http://127.0.0.1:5173,http://127.0.0.1:5001
```

---

### Step 2: Start the Services

#### 1. Express Backend Gateway (Port 5001)
```bash
cd backend
npm install
npm run dev
```

#### 2. Python AI RAG Microservice (Port 8000)
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. React Frontend Client (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Verification & Testing

Acad Nexus includes comprehensive test suites covering model contracts, API security, and production builds:

```bash
# 1. Run Backend Supertest API Suites (13/13 tests)
npm test --prefix backend

# 2. Run Professor & Profile Contract Tests (11/11 tests)
node tests/professor-contracts.test.js

# 3. Verify Production Frontend Build
npm run build --prefix frontend
```

---

## Documentation Links

* [System Design & RAG Architecture Guide](docs/SYSTEM_DESIGN_AND_RAG_GUIDE.md) — Comprehensive technical reference on RAG pipelines, chunking math, and multi-tenancy.
* [Frontend Workflows & Design System](docs/FRONTEND_WORKFLOWS.md) — UI component specifications and state management workflows.
* [Backend API Reference](docs/API.md) — Complete REST endpoint documentation and schemas.

---

## Contributing & License

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
