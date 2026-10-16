# Acad Nexus

**An AI-powered classroom learning platform.**

Acad Nexus aims to connect professors and students through digital classrooms, course materials, and an AI-powered assistant that answers questions using uploaded academic documents.

## Overview

Acad Nexus allows professors to create classrooms and upload course PDFs. Students can join classrooms using secure join keys, ask questions grounded in the uploaded materials, and save useful answers as personal study notes.

The platform is designed to provide relevant, document-based answers while respecting classroom membership and document access permissions.

## Key Features

- **Student and Professor Accounts** — Registration and role-based access.
- **Institutional Verification** — Verify users' institutional identities.
- **Classroom Management** — Professors create classrooms and generate join keys.
- **PDF-Based AI Assistant** — Ask questions about uploaded course materials.
- **Source Citations** — Include document and page references in AI answers where available.
- **Personal Study Notes** — Save useful information for revision.
- **Access Control** — Restrict classroom materials and conversations to authorized users.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend API | Node.js, Express |
| Database | MongoDB, Mongoose |
| AI Service | Python, FastAPI |
| Vector Database | Pinecone |
| Version Control | Git, GitHub |

## Project Structure

```text
Acad_Nexus/
├── frontend/       # React frontend
├── backend/        # Node.js and Express API
├── ai-service/     # Python AI and document processing service
├── tests/          # Automated tests
├── docs/           # Project documentation
├── .env.example    # Example environment configuration
├── .gitignore
└── README.md
```

## Getting Started

The project is currently under development. Setup instructions will be added as the frontend, backend, and AI service are implemented.

### Prerequisites

- Node.js and npm
- Python
- MongoDB access
- Pinecone account and API credentials

## Security

- Keep API keys, passwords, and other secrets in environment variables.
- Never commit real `.env` files or credentials.
- Do not commit private uploaded documents or generated sensitive data.
- Enforce authentication, classroom membership, and role permissions on protected endpoints.

## Project Status

**Under active development.**

Acad Nexus is being built incrementally, starting with repository setup and the core application architecture.