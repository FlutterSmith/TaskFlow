

# `CLAUDE_FULLSTACK.md`

This file provides structured guidance for Claude when working with code in this full-stack application repository.

---

## 🧩 Commands

### General

* **Install dependencies (backend):** `npm install` or `yarn`
* **Install dependencies (frontend):** `npm install` or `yarn` inside `/client` or `/frontend`
* **Start dev servers:**

  * Backend: `npm run dev` or `yarn dev`
  * Frontend: `npm run dev` or `yarn dev` (from `/client`)
* **Build (frontend):** `npm run build`
* **Build (backend):** `npm run build` (if TS or bundler used)
* **Run tests (all):** `npm test`
* **Run single test:** `npm test -- <testName>`
* **Lint:** `npm run lint`
* **Format:** `npx prettier --write .`

--

## 📚 Style Guidelines

### General

* Use **Prettier + ESLint** to enforce consistent code style
* Follow **2-space indentation**, limit lines to 100 characters
* Use **camelCase** for variables/functions, **PascalCase** for classes/components
* Write **modular code**: one component, route, or utility per file where practical
* Apply **DRY** principles: avoid duplication, centralize shared logic

### TypeScript

* Enforce **strict types**, avoid `any`, prefer `unknown` + type guards
* Use `readonly` and `const` where possible
* Prefer **interfaces** over types for object shapes

### Backend

* Organize backend code by **feature or domain**, not layer
* Use **async/await** with proper error handling
* Always validate incoming data with **Zod, Joi, or Yup**
* Handle all errors gracefully with proper status codes and messages
* Return **consistent API responses** (status, data, error)

### Frontend

* Use **React** (or Vue/Svelte if applicable) best practices
* Use **functional components** with hooks (avoid classes unless justified)
* Separate UI and logic: avoid inline logic in JSX
* For complex state: use `useReducer`, Zustand, Redux, or Context
* Handle API errors in UI with user-friendly messages

### UI/UX

* Keep interfaces clean, modern, minimal
* Use **responsive layouts** and semantic HTML
* Follow accessibility best practices (ARIA, keyboard nav, color contrast)
* Prefer **accessible design** over decorative design
* Use meaningful animations/transitions — avoid excessive motion

---

## 🧱 Architecture Guidelines

* Follow a **modular, layered architecture**: e.g., controller > service > repo

* Use **domain-driven naming** (`InvoiceService`, `UserController`, `authRouter`)

* Maintain separation of concerns:

  * API logic → Controllers
  * Business logic → Services
  * DB logic → Repositories/Models

* API routes should be **RESTful** or follow **GraphQL** conventions

* Avoid tight coupling between front and backend: use DTOs and interfaces

---

## 🧪 Testing Practices

* Write unit tests for business logic (services, utils)
* Write integration tests for endpoints
* Write E2E tests using Playwright/Cypress (if applicable)
* Follow the **AAA pattern** (Arrange-Act-Assert)
* Include tests in all new PRs or major features

---

## 🔐 Security & Auth

* Sanitize all inputs to avoid injection attacks
* Use environment variables (`.env`) for secrets and config
* Use **JWT or OAuth2** securely; avoid storing secrets client-side
* Always hash passwords using **bcrypt**, never store in plaintext
* Validate session/auth headers on protected endpoints
* Implement rate limiting and input validation on auth routes

---

## ⚙️ Tool Usage Guidelines (Claude)

### ✅ Use Task Tool when:

* Searching for how a service or controller interacts with a specific model
* Refactoring routes or APIs with many references across layers
* Creating reusable middleware or helper logic
* Exploring unfamiliar modules or analyzing cross-cutting concerns (auth, logging, etc.)

### ❌ Avoid Task Tool when:

* Reading or editing a single known file
* Refactoring an isolated UI component
* Adding a new utility or helper in a scoped file

---

## 🧠 Claude Coding Principles

* Always **include necessary imports** before returning any modified file
* Always **run code formatting** after edits
* Understand existing functionality fully before modifying it
* Use **consistent patterns** across backend and frontend
* Always document:

  * New endpoints
  * Utility functions
  * Reusable components/hooks
* Avoid copy-paste duplication — **extract shared logic**
* When updating shared components or interfaces, **update all usage locations**
* Before finishing a change, **validate against both frontend and backend logic**
* Respect project-wide naming, folder, and state conventions

---

## ⚠️ Defensive Programming

* Use **try/catch** in all async operations
* Add **fallbacks** for optional data or edge cases
* Always validate **API responses and errors**
* Confirm that all promises are **properly awaited or handled**
* Check **authorization logic** for all protected endpoints
* Add **guards for undefined/null** values before usage

---

## 💡 Advanced Practices

* Prefer composition over inheritance
* Use dependency injection or service containers where feasible
* Define shared **enums/constants/types** for consistency
* Avoid global state unless necessary; prefer scoped state management
* Separate config logic (`config.ts`) from app logic
* Use middlewares for common logic (e.g., logging, auth checks)
* Ensure all resources (DB connections, subscriptions) are cleaned up properly

---

## 🔎 Understanding User Intent (Claude-Specific)

### Implementation (make changes)

> **Phrases that indicate code changes:**

* "Implement..."
* "Add a new route that..."
* "Fix this bug..."
* "Create a reusable hook..."
* "Migrate this to..."

→ Perform the requested change and list updated files.

### Explanation (no code changes)

> **Phrases that mean analysis only:**

* "Explain..."
* "How does this work..."
* "Tell me about..."
* "Analyze..."
* "Why is this failing..."

→ Provide structured insight, no code edits unless asked.

---

## 🧭 Project Overview (Example Use Case)

This full-stack project is a modern expense tracking and reporting platform. It includes a web-based dashboard and RESTful backend.

### Stack

* **Frontend:** React + TypeScript + TailwindCSS
* **Backend:** Node.js + Express + PostgreSQL (via Prisma ORM)
* **API:** RESTful (OpenAPI Spec)
* **Authentication:** JWT + Role-based access
* **Testing:** Jest + Supertest + Playwright
* **Deployment:** Docker + CI/CD via GitHub Actions

---

### Future-proofing

* App must support additional modules like **Income**, **Drive Tracking**, and **Team Reports**
* Design frontend and backend with **modular extensibility**
* Use **feature flags** or config for toggling future features
* Avoid assumptions that only expenses exist

---

### Competitor Benchmarks

Key comparisons for UX and tech parity:

* Wave
* Expensify (web)
* Zoho Expense
* QuickBooks
* Stripe Dashboard (UX inspiration)

---

## Final Notes

* All changes must maintain functionality and pass tests
* Structure changes for **long-term maintainability**
* Leave better code than you found
