# CODE FIGHTER OJ — AGENT HANDOVER & MASTER DIRECTIVE

> **IMPORTANT NOTICE FOR INCOMING AGENTS:**  
> Read this document first! It contains the complete state, architecture, roadmap, completed phases, and explicit next steps for **CODE FIGHTER OJ**. You can resume work seamlessly without losing any context.

---

## 1. Project Overview & Brand Identity

- **Brand:** CODE FIGHTER
- **Platform Name:** CODE FIGHTER OJ (Online Judge & Academy Management System)
- **Primary Slogan:** *TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.*
- **Supporting Slogan:** *DISCIPLINE. LOGIC. VICTORY.*
- **Core Concept:** Learning programming is like training martial arts.
  - Every student is a **Fighter** with a unique **Fighter ID** (`CF-000001`).
  - 9 Belt categories: **WHITE, YELLOW, ORANGE, GREEN, BLUE, PURPLE, BROWN, RED, BLACK**.
  - Each belt has 3 levels (`LEVEL_I`, `LEVEL_II`, `LEVEL_III`) = **27 distinct belt states**.
  - Custom vector `BeltBadge` component (no emojis, professional Spartan rank insignia).

---

## 2. Technology Stack & Environment

- **Root Directory:** `C:\Users\Hieu\.gemini\antigravity\scratch\code-fighter-oj`
- **Frontend:** Next.js 16.4.5 (App Router), React 19.3.0, TypeScript 5.9.3, Tailwind CSS v4.3.5
- **UI & Icons:** Radix UI primitives, Lucide React (`lucide-react@^1.70.0`), Class Variance Authority (`cva`)
- **Database:** PostgreSQL with **Prisma ORM 6.19.3** (`@prisma/client@6.19.3`, `prisma@6.19.3`)
- **Authentication:** Auth.js / NextAuth v5 beta (`next-auth@5.0.0-beta.32`), `bcryptjs@^3.0.3`
- **Execution Engine:** Judge0 integration (`/api/judge/run`, `/api/submissions`), Cgroups sandbox
- **Validation:** Zod (`zod@^4.6.7`), React Hook Form
- **Language / Runtime:** Node.js v24.22.1, pnpm 12.18.0

---

## 3. Development Phases & Current Status

| Phase | Milestone | Scope | Status | Notes |
|---|---|---|---|---|
| **Phase 0** | **Project Foundation** | Scaffold, Prisma 6 ORM, 1,108-line schema (48 models), `.env`, `prisma/seed.ts`, all 8 architecture docs. | 🟢 **DONE** | Validated with `prisma validate` & generated types. |
| **Phase 1** | **Core Platform & Brand** | Vector `BeltBadge` (27 states), `BeltProgressBar`, UI primitives (Button, Card, Input, Badge, Table, Alert, Tabs, Skeleton, etc.), `Navbar` & `Footer`, Landing Page, NextAuth v5 login/register, Problem Library & Detail view (`ProblemSolver`), Fighter Profile (`/fighters/[username]`), Dashboard (`/dashboard`), Leaderboard (`/leaderboard`). | 🟢 **DONE** | Verified clean build (`tsc --noEmit` exits with 0 errors). |
| **Phase 2** | **Online Judge & Editor** | Monaco Editor integration (`@monaco-editor/react`), real-time submission polling/SSE, Redis task queue for async judging workers, Judge0 docker compose. | 🟡 **NEXT UP** | Submissions API `/api/submissions` and `/api/judge/run` already implemented with local sandbox fallback. |
| **Phase 3** | **Gamification Engine** | EXP audit ledger, automatic belt promotion rule checker (`BeltRequirement`), daily streak updater, missions & achievements. | ⚪ QUEUED | |
| **Phase 4** | **Admin Authoring Studio** | Problem CRUD studio, Test Case Manager (hidden vs sample tests, point allocation), problem versioning. | ⚪ QUEUED | Admin routes `/admin/*` protected in `middleware.ts`. |
| **Phase 5** | **Academy LMS & Groups** | Groups, private classes, student enrollment with invite codes, assignments, instructor student analytics. | ⚪ QUEUED | Models defined in Prisma. |
| **Phase 6** | **Battle Arena (Contests)** | Contest creation, registration, ICPC scoring engine (20-min penalty), real-time scoreboard. | ⚪ QUEUED | Models defined in Prisma. |
| **Phase 7** | **Belt Examinations** | Formal timed exam attempts, eligibility evaluation, promotion certificates. | ⚪ QUEUED | Models defined in Prisma. |
| **Phase 8** | **Production Readiness** | Playwright E2E tests, security audits, Dockerfile, docker-compose. | ⚪ QUEUED | Docs and configs prepared. |

---

## 4. Completed Files & Directory Map

```
code-fighter-oj/
├── docs/                                  # 8 COMPLETE ARCHITECTURAL SPECIFICATIONS
│   ├── PRODUCT_REQUIREMENTS.md            # Complete PRD
│   ├── SYSTEM_ARCHITECTURE.md             # High-level architecture & data flows
│   ├── DATABASE_SCHEMA.md                 # Full PostgreSQL schema reference
│   ├── API_SPECIFICATION.md               # REST API endpoints & contracts
│   ├── SECURITY_MODEL.md                  # Sandboxing & RBAC security model
│   ├── DEVELOPMENT_ROADMAP.md             # Phased rollout roadmap
│   ├── DEPLOYMENT_GUIDE.md                # Docker & production guides
│   └── TESTING_STRATEGY.md                # Test pyramid & QA methodology
├── prisma/
│   ├── schema.prisma                      # Complete 1,108-line schema (48 models)
│   └── seed.ts                            # Full seed script with 27 belt requirements, sample problems & users
├── src/
│   ├── auth.ts                            # NextAuth v5 configuration (Credentials)
│   ├── middleware.ts                      # Route protection for Admin & Members
│   ├── lib/
│   │   ├── prisma.ts                      # Prisma client singleton
│   │   ├── utils.ts                       # Formatters: formatFighterId, formatEXP, cn, etc.
│   │   └── belt-utils.ts                  # All 9 belts & 27 levels, colors, badges
│   ├── components/
│   │   ├── belt/
│   │   │   ├── BeltBadge.tsx              # Vector SVG rank badge (sm, md, lg; 27 levels)
│   │   │   └── BeltProgressBar.tsx        # EXP progress & next belt indicator
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                 # Top navigation with mobile menu
│   │   │   └── Footer.tsx                 # Spartan footer
│   │   └── ui/                            # Button, Card, Input, Badge, Table, Tabs, Alert, etc.
│   └── app/
│       ├── page.tsx                       # Full Spartan Landing Page
│       ├── layout.tsx                     # Root dark layout & font setup
│       ├── (auth)/
│       │   ├── login/page.tsx             # Login page with credentials
│       │   └── register/page.tsx          # Register with auto-generated Fighter ID
│       ├── problems/
│       │   ├── page.tsx                   # Problem Library with search & difficulty filters
│       │   └── [slug]/
│       │       ├── page.tsx               # Problem Detail view
│       │       └── ProblemSolver.tsx      # Split workspace (statement + editor + runner)
│       ├── fighters/[username]/page.tsx   # Fighter Profile (6 tabs: Overview, Submissions, etc.)
│       ├── dashboard/page.tsx             # Authenticated Fighter Dashboard
│       ├── leaderboard/page.tsx           # Global Leaderboard (Bảng Phong Thần)
│       └── api/
│           ├── auth/[...nextauth]/route.ts# NextAuth handler
│           ├── auth/register/route.ts     # User & Fighter registration
│           ├── stats/route.ts             # Real platform statistics
│           ├── problems/route.ts          # Paginated problem catalog
│           ├── problems/[slug]/route.ts   # Problem details (excludes hidden tests)
│           ├── submissions/route.ts       # Submission & grading pipeline
│           └── judge/run/route.ts         # Custom sandbox test execution
├── .env                                   # Configured with database & secrets
├── AGENT_HANDOVER.md                      # This file
└── PROJECT_PLAN_AND_LOG.md                # Execution log & progress ledger
```

---

## 5. Instructions for the Next Agent

If you are a new agent starting in a new session:

1. **Verify Workspace:**
   ```powershell
   cd "C:\Users\Hieu\.gemini\antigravity\scratch\code-fighter-oj"
   pnpm tsc --noEmit
   ```
   *(Ensure it exits with 0 errors!)*

2. **Run Dev Server if testing UI:**
   ```powershell
   pnpm dev
   ```
   The site runs at `http://localhost:3000`.

3. **Proceed with Phase 2 & Phase 4:**
   - **Phase 2 (Monaco Editor):** Add `@monaco-editor/react` to `ProblemSolver.tsx` for enhanced syntax highlighting and auto-completion in C++17, C++20, Python 3, Java.
   - **Phase 4 (Admin Problem Studio):** Create `/admin/problems` and `/admin/problems/create` to allow admins/instructors to author problems, upload testcases (marking sample vs. hidden), and test reference solutions.
   - **Phase 5 (Academy Groups):** Create `/academy` and `/groups/[id]` for class management, student rosters, and assignments.
   - **Phase 6 (Contests):** Create `/contests` and `/contests/[slug]/scoreboard` with live ICPC penalty standings.

4. **Always remember:**
   - Keep TypeScript strict (`tsc --noEmit` must pass).
   - Never expose hidden test cases in public APIs.
   - Record progress in `PROJECT_PLAN_AND_LOG.md`.
