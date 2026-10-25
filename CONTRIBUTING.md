# Contributing to Acad Nexus (CampusMind)

First off, thank you for taking the time to contribute! Acad Nexus is built as a collaborative academic platform featuring a decoupled 3-tier architecture with document-grounded RAG intelligence.

---

## 1. Architecture Overview

Acad Nexus consists of three distinct microservices:

1. **Frontend (`frontend/`)**: React 18, Vite, responsive custom design system, running on `http://localhost:5173`.
2. **Backend Gateway (`backend/`)**: Node.js & Express REST API, MongoDB (Mongoose), Multer PDF uploads, and JWT authentication, running on `http://localhost:5001`.
3. **AI Microservice (`ai-service/`)**: Python, FastAPI, Gemini 3.5 Flash, Gemini Embeddings, and Pinecone vector store, running on `http://localhost:8000`.

---

## 2. Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.x or later
- **Python**: v3.10+ (v3.11 recommended)
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection URI
- **API Keys**: Google Gemini API key and Pinecone API key

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# Server will listen on http://localhost:5001
```

### 2. AI Microservice Setup
```bash
cd ai-service
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# Service will listen on http://127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App will open on http://localhost:5173
```

---

## 3. Git Branch Workflow

To keep git history clean and prevent merge conflicts across team members:

1. **Always branch off the latest `main` or active team branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```
2. **Commit Convention**:
   Use standard conventional commits:
   - `feat(...)`: New feature (e.g., `feat(rag): add confidence score thresholding`)
   - `fix(...)`: Bug fix (e.g., `fix(professor): sync academic profile state with mongo`)
   - `docs(...)`: Documentation changes
   - `test(...)`: Adding or updating test suites
   - `refactor(...)`: Code restructuring without behavior changes
3. **Keep Branches Synchronized**:
   Before submitting a Pull Request, fetch and rebase/merge the latest changes:
   ```bash
   git fetch origin
   git merge origin/main
   ```

---

## 4. Running Verification Tests

All Pull Requests must pass 100% of the automated test suites before being merged:

```bash
# 1. Run Frontend unit and component tests
npm test --prefix frontend

# 2. Run Backend API integration tests
npm test --prefix backend

# 3. Run Professor model & cross-service contract tests
node --test tests/professor-contracts.test.js

# 4. Run Python AI microservice test suite (Chunker, RAG Engine, Vector Store)
cd ai-service && .venv/bin/pytest tests/
```

---

## 5. Submitting a Pull Request (PR)

1. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request against the target branch (`main`).
3. Fill out the provided **Pull Request Template** completely.
4. Ensure all CI/CD checks and tests are green.
5. Request a review from a teammate before merging.
