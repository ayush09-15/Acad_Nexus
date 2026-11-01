## Description
<!-- Provide a clear, concise summary of the changes made in this Pull Request. -->

## Type of Change
<!-- Mark the relevant option(s) with an [x] -->
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to break)
- [ ] 📚 Documentation update
- [ ] ⚡ Performance improvement / Code refactor
- [ ] 🧪 Tests (adding or updating unit/integration tests)

## Microservices Affected
- [ ] `frontend/` (React UI, styling, components)
- [ ] `backend/` (Express API, MongoDB models, auth middleware)
- [ ] `ai-service/` (FastAPI, RAG pipeline, Pinecone, chunking)
- [ ] `tests/` (Test suites or fixtures)

## Verification & Testing
<!-- Detail the test steps you completed to verify your changes. -->
- [ ] Frontend unit tests passed (`npm test --prefix frontend`)
- [ ] Backend API tests passed (`npm test --prefix backend`)
- [ ] Python AI tests passed (`cd ai-service && pytest tests/`)
- [ ] Contract tests passed (`node --test tests/professor-contracts.test.js`)
- [ ] Manual end-to-end verification performed in the browser

## UI Changes (if applicable)
<!-- Attach screenshots or GIFs if this PR introduces visual or layout changes. -->

## Checklist
- [ ] My code follows the project's code style and conventions.
- [ ] I have performed a self-review of my code.
- [ ] I have commented complex or non-obvious code logic.
- [ ] I have updated `.env.example` if new environment variables were introduced.
- [ ] My branch is up to date with the target branch with 0 merge conflicts.
