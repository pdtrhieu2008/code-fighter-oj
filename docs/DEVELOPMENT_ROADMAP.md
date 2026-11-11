# CODE FIGHTER OJ — DEVELOPMENT ROADMAP

## Overview
This roadmap outlines the systematic development of the CODE FIGHTER platform across 9 focused phases, guaranteeing stability, complete business logic, and security.

---

## Phase Breakdown

### Phase 0: Project Foundation (Completed)
- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 environment setup.
- PostgreSQL Prisma ORM schema design with all 10 domain entities (1,108 lines).
- Core utility libraries (`belt-utils.ts`, `utils.ts`, `prisma.ts`).
- Master technical documentation (PRD, Architecture, Schema, Security, Roadmap, API, Deployment, Testing).

### Phase 1: Core Platform & Fighter Brand Identity (Current)
- Design System: Custom Radix-based UI components (Buttons, Inputs, Cards, Badges, Tabs, Dialogs, Dropdown).
- Reusable vector `BeltBadge` component with 27 belt states (WHITE I to BLACK III).
- Top navigation `Navbar`, breadcrumbs, and `Footer`.
- Spartan-styled landing page with real database metrics, featured problems, and belt tier showcase.
- NextAuth v5 authentication flow with secure credentials provider, signup API, and RBAC middleware.
- Fighter Profile system (Tabs: Overview, Problems, Submissions, Contests, Achievements, Belt Journey).
- Public Problem Library and Split-Panel Problem Detail solving environment.

### Phase 2: Online Judge Engine & Sandbox Pipeline
- Redis task queue for asynchronous judging.
- Judge0 integration interface with fallback local container runner.
- Comprehensive verdict pipeline: AC, WA, TLE, MLE, RE, CE.
- Custom input execution for quick testing.
- Monaco Editor integration with C++17/20, Python 3, Java syntax highlighting.

### Phase 3: Fighter Progression & Gamification
- Idempotent EXP transaction ledger.
- Belt progression evaluator (EXP + problem difficulty quotas + topic tags + exams).
- Activity streak calculation (GitHub-style 365-day contribution heatmap).
- Global, belt-tier, and academy group leaderboards.

### Phase 4: Admin Problem Authoring & Test Studio
- Problem CRUD with Markdown statement editor & LaTeX formula rendering.
- Test Case Manager (Sample vs. Hidden test cases, input/output file batch upload, points allocation).
- Reference solution benchmark verification.
- Problem versioning and immutable snapshots.

### Phase 5: Academy LMS & Group Management
- Group & private class creation with secure invitation codes.
- Student enrollment workflows and instructor assignment.
- Group problem assignments with automated deadline management.
- Student analytics dashboard for instructors (weak-topic radar, attendance, submission timeline).

### Phase 6: Battle Arena (Contest System)
- Contest management: Public, Private, Group, and Belt-restricted.
- ICPC-style scoring engine (20-minute penalty per wrong attempt on accepted problems).
- Real-time live scoreboard with optional contest freeze.

### Phase 7: Belt Examination Module
- Timed examination environment with strict anti-cheat restrictions.
- Automatic eligibility assessment and prerequisite validation.
- Automated evaluation and official promotion history logging.

### Phase 8: Production Readiness & Hardening
- End-to-end automated testing covering user and administrator flows.
- Containerized multi-stage Dockerfile and Docker Compose orchestration.
- Comprehensive security audit and performance profiling.
