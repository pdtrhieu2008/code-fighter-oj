# CODE FIGHTER OJ — Product Requirements Document (PRD)

> **TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.**

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-11-08  
**Owner:** CODE FIGHTER OJ Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas & Roles](#3-user-personas--roles)
4. [Feature Requirements](#4-feature-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [User Stories](#6-user-stories)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Out of Scope](#8-out-of-scope)
9. [Success Metrics](#9-success-metrics)
10. [Glossary](#10-glossary)

---

## 1. Executive Summary

**CODE FIGHTER OJ** is a next-generation competitive programming platform that merges the rigor of an Online Judge (OJ) with the progression mechanics of a martial arts ranking system and the structure of a Learning Management System (LMS). Users advance through 27 belt levels — from White Belt I to Black Belt III — by solving problems, passing examinations, earning EXP, and competing in contests. Academies (groups of students under instructors) can run structured courses, assign problems, and track cohort progress.

The platform targets competitive programmers, CS students, coding bootcamp participants, and self-learners who benefit from gamified, structured progression alongside real-world judging infrastructure.

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

> Build the most engaging and rigorous competitive programming platform where every solved problem feels like a step toward mastery — and where mastery is proven, visible, and respected.

### 2.2 Strategic Goals

| Goal | Description |
|------|-------------|
| **Engagement** | Keep users returning daily through streaks, missions, and belt progression |
| **Rigor** | Provide a trusted, accurate Online Judge for competitive programming |
| **Community** | Enable academies, contests, and collaborative group learning |
| **Inclusivity** | Support beginners (White Belt) through grandmasters (Black Belt III) |
| **Trust** | Transparent judging, anti-cheat safeguards, secure sandboxing |

### 2.3 Product Pillars

```
┌─────────────────────────────────────────────────┐
│          CODE FIGHTER OJ — Three Pillars        │
├─────────────────┬──────────────┬────────────────┤
│  ONLINE JUDGE   │   FIGHTER    │    ACADEMY     │
│    SYSTEM       │   RANKING    │  MANAGEMENT    │
│                 │   SYSTEM     │    SYSTEM      │
├─────────────────┴──────────────┴────────────────┤
│  Shared: Auth, Notifications, Gamification,     │
│  Leaderboards, Audit Logs, Admin Dashboard      │
└─────────────────────────────────────────────────┘
```

---

## 3. User Personas & Roles

### 3.1 Role Hierarchy

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| `GUEST` | Unauthenticated visitor | View public problems, leaderboards, contest listings |
| `REGISTERED_USER` | Authenticated member | Submit solutions, earn EXP, join contests, track progress |
| `STUDENT` | Enrolled in a class | Access class assignments, instructor feedback, class contests |
| `INSTRUCTOR` | Runs classes/courses | Create courses, assign problems, grade, give feedback |
| `ADMIN` | Platform administrator | Manage users, problems, contests, system settings |
| `SUPER_ADMIN` | System owner | Full access including system settings, audit logs, role management |

### 3.2 User Personas

#### Persona A — "The Competitive Coder" (Primary)
- **Age:** 18–28, CS student or early career
- **Goal:** Rank highly in contests, achieve Black Belt, build portfolio
- **Pain Points:** Existing OJs feel stale; no visible progression outside rankings
- **Needs:** Fast judge, real-time standings, meaningful badges

#### Persona B — "The Instructor"
- **Age:** 25–45, CS professor or bootcamp trainer
- **Goal:** Assign curated problem sets; track student progress
- **Pain Points:** Manual grading of code is tedious; no unified platform
- **Needs:** Bulk assignment creation, submission analytics, cohort dashboards

#### Persona C — "The Beginner Learner"
- **Age:** 15–25, new to algorithms
- **Goal:** Learn step-by-step, feel rewarded for small wins
- **Pain Points:** Existing OJs are intimidating; no clear learning path
- **Needs:** White Belt → Yellow Belt progression, guided missions, editorial access

#### Persona D — "The Administrator"
- **Goal:** Keep the platform healthy, accurate, and free of abuse
- **Needs:** Audit logs, user management, contest oversight, judge monitoring

---

## 4. Feature Requirements

### 4.1 Online Judge System

#### FR-OJ-001: Code Submission
- Users can submit code solutions for problems in multiple programming languages.
- Supported languages (minimum): C, C++17, Java 21, Python 3.12, JavaScript (Node.js 20), Go, Rust, Kotlin.
- Monaco Editor provides the in-browser IDE experience.
- Submissions are queued and processed asynchronously via Judge0.

#### FR-OJ-002: Test Case Evaluation
- Each problem has public sample test cases (visible to user) and hidden test cases (never exposed).
- Judge runs code against all test cases and returns: `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `RUNTIME_ERROR`, `COMPILATION_ERROR`, `INTERNAL_ERROR`.
- Partial scoring (IOI-style) is supported per problem configuration.

#### FR-OJ-003: Problem Management
- Problems have: title, slug, difficulty (`EASY`/`MEDIUM`/`HARD`/`EXPERT`), statement (markdown), constraints, sample I/O, editorial (optionally locked until solved).
- Problems support version history (problem versioning).
- Problems are tagged by algorithm category (e.g., Dynamic Programming, Graph Theory).
- Problems can be `PUBLIC` or `PRIVATE` (visible only in specific contests/classes).

#### FR-OJ-004: Submission History
- Users can view their own submission history with verdict, language, runtime, memory usage, and timestamp.
- For accepted submissions, source code is viewable by the submitter.
- Admins can view all submissions.

#### FR-OJ-005: Anti-Cheat
- Plagiarism detection for similar code submissions.
- Cooldown limits on resubmission (configurable per contest).
- Sandboxed execution prevents network access, file system abuse, and resource exhaustion.

---

### 4.2 Fighter Ranking System

#### FR-FR-001: Belt System
- 27 belt states organized as 9 belt colors × 3 levels (I, II, III):
  ```
  WHITE I → WHITE II → WHITE III →
  YELLOW I → ... → YELLOW III →
  ORANGE I → ... → ORANGE III →
  GREEN I → ... → GREEN III →
  BLUE I → ... → BLUE III →
  PURPLE I → ... → PURPLE III →
  BROWN I → ... → BROWN III →
  RED I → ... → RED III →
  BLACK I → BLACK II → BLACK III
  ```
- Each user has a current belt, EXP within that belt, and a promotion history.

#### FR-FR-002: EXP System
- EXP is earned by: solving problems, submitting for the first time each day (streak bonus), completing missions, participating in contests, achieving high contest rank.
- EXP transactions are recorded with source, amount, and timestamp.
- EXP thresholds per belt level are configurable by ADMIN.

#### FR-FR-003: Belt Examination
- To advance from one belt to the next, users must pass a **Belt Examination**.
- Examinations are time-limited problem sets. Minimum pass score and minimum problems solved are configurable.
- Users have a limited number of attempts per examination (configurable).
- Failed attempts have a cooldown before retry.
- Promotion history records examiner, score, and decision.

#### FR-FR-004: Fighter Profile
- Displays: current belt (with animated belt badge), EXP, rank, total problems solved, contest rating, achievements, and streak.
- Visible to all users (public profile).

#### FR-FR-005: Leaderboard
- Global leaderboard ranked by: belt level, EXP within belt, total problems solved.
- Filterable by: belt color, country, school/organization.
- Weekly and all-time views.

#### FR-FR-006: Achievements
- Users can earn achievements for milestones: "First Blood" (first AC), "Centurion" (100 problems solved), "Streak Master" (30-day streak), etc.
- Achievements display on profile and trigger notification.

#### FR-FR-007: Daily Missions & Streaks
- Daily missions reset at midnight UTC: e.g., "Solve 1 MEDIUM problem", "Submit in a new language".
- Streak tracks consecutive days of activity. Broken streak resets to 0.

---

### 4.3 Academy Management System

#### FR-AC-001: Groups
- Users can create or join **Groups** (e.g., a university club, a training team).
- Group owners manage invitations, membership roles within the group, and group-level assignments.
- Groups have a description, avatar, and visibility setting (public/private).

#### FR-AC-002: Courses & Classes
- **Courses** are structured learning paths with ordered **Lessons**.
- An **Instructor** creates classes, enrolls students, and links a course to that class.
- A class has a start and end date, a roster, and an assignment feed.

#### FR-AC-003: Assignments
- Instructors create **Assignments** linking one or more problems with a due date and point value.
- Assignments are visible only to enrolled students.
- Upon submission, the judge evaluates the code; results feed back to the instructor dashboard.

#### FR-AC-004: Instructor Feedback
- Instructors can leave per-submission feedback (text, inline annotations).
- Students receive notifications when feedback is posted.

#### FR-AC-005: Class Analytics
- Instructor dashboard shows: class-wide AC rate per problem, individual student progress, submission timeline, common errors (grouped by verdict).

#### FR-AC-006: Group Contests
- Instructors or group admins can run **private contests** accessible only to class/group members.

---

### 4.4 Contest System

#### FR-CO-001: Contest Types
- **ICPC-style:** penalty-based scoring (time + wrong answer penalties).
- **IOI-style:** subtask/partial scoring.
- **Rated:** affects user's internal contest rating (ELO-style delta).
- **Unrated:** practice or private contests.

#### FR-CO-002: Contest Lifecycle
- States: `DRAFT` → `REGISTRATION_OPEN` → `RUNNING` → `ENDED` → `RESULTS_FINAL`.
- Registration window configurable.
- Countdown timer displayed to participants.

#### FR-CO-003: Real-Time Standings
- Live scoreboard updates during contest (optionally frozen in final hour for ICPC).
- Visible to: participants, spectators (if public contest).

#### FR-CO-004: Post-Contest
- Editorial unlock after contest ends.
- Upsolving (submitting after the contest ends) supported.
- Rating recalculation after results finalization.

---

### 4.5 Platform Administration

#### FR-AD-001: User Management
- ADMIN can view, search, ban, unban, and modify user roles.
- SUPER_ADMIN can promote/demote ADMINs.

#### FR-AD-002: Problem Authoring
- ADMIN/INSTRUCTOR can create and manage problems via a rich editor.
- Test case upload (zip) or manual entry.
- Problem validation (run against judge to verify test cases).

#### FR-AD-003: Audit Logs
- All sensitive actions are logged: role changes, problem edits, test case access, contest result modification.
- Logs are searchable by actor, action type, and timestamp.

#### FR-AD-004: System Settings
- Configurable via admin panel: EXP thresholds, belt requirements, judge timeout defaults, rate limits, maintenance mode.

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target |
|--------|--------|
| Page load (LCP) | < 2.5 seconds (p95) |
| Judge queue time | < 5 seconds (p50), < 30 seconds (p95) |
| API response time | < 300ms (p95, excluding judge) |
| Leaderboard refresh | < 1 second (cached, Redis) |
| Concurrent submissions | 500+ simultaneous |

### 5.2 Scalability
- Horizontal scaling of judge workers via Docker Compose / Kubernetes.
- Redis-backed job queue for submission processing.
- Read replicas for PostgreSQL during high-traffic contests.

### 5.3 Availability
- Target uptime: **99.9%** (< 8.7 hrs/year downtime).
- Judge system failures are isolated (platform remains accessible).
- Graceful degradation: submissions queue when judge is down.

### 5.4 Security
- All code execution is sandboxed (Judge0 + container isolation).
- Hidden test cases are never exposed via any API endpoint.
- Authentication via NextAuth.js with secure session management.
- OWASP Top 10 mitigations enforced (see SECURITY_MODEL.md).

### 5.5 Accessibility
- WCAG 2.1 AA compliance for all public-facing pages.
- Keyboard-navigable Monaco Editor configuration.
- High-contrast theme support.

### 5.6 Internationalization
- UI text externalized for future i18n support.
- Problem statements support UTF-8 / Unicode.

---

## 6. User Stories

### Authentication & Profile
- `US-001`: As a **Guest**, I can browse public problems and the leaderboard without signing up.
- `US-002`: As a **Guest**, I can register with email/password or OAuth (GitHub, Google).
- `US-003`: As a **Registered User**, I can view and edit my fighter profile (bio, country, avatar).

### Online Judge
- `US-010`: As a **Registered User**, I can submit code for a problem and receive a verdict within 30 seconds.
- `US-011`: As a **Registered User**, I can run my code against sample test cases ("Run" mode) without consuming submission attempts.
- `US-012`: As a **Registered User**, I can view my past submissions and filter by problem, verdict, or language.
- `US-013`: As a **Registered User**, I can read the editorial for a problem after solving it or after a configurable unlock condition.

### Fighter Progression
- `US-020`: As a **Registered User**, I can see my current belt, EXP, and progress toward the next level on my dashboard.
- `US-021`: As a **Registered User**, I can register for a belt examination when I meet the EXP requirement.
- `US-022`: As a **Registered User**, I receive a belt promotion notification and updated profile badge when I pass an examination.
- `US-023`: As a **Registered User**, I can view my achievement collection and share individual achievements.

### Academy
- `US-030`: As an **Instructor**, I can create a class, enroll students via invitation link, and configure the class settings.
- `US-031`: As an **Instructor**, I can create an assignment with one or more problems, set a due date and point value, and publish it to my class.
- `US-032`: As a **Student**, I can view my class assignments, submit code, and see my grade and instructor feedback.
- `US-033`: As an **Instructor**, I can view a dashboard showing each student's submission status and score for every assignment.

### Contests
- `US-040`: As a **Registered User**, I can register for an upcoming contest and receive an email reminder.
- `US-041`: As a **Registered User**, I can participate in a live contest, view the real-time scoreboard, and see my rank.
- `US-042`: As an **Admin**, I can create a contest, set its type (ICPC/IOI), add problems, and configure registration settings.

### Administration
- `US-050`: As an **Admin**, I can search for a user and view their submission history, roles, and account status.
- `US-051`: As an **Admin**, I can upload a new problem with test cases and validate them against the judge.
- `US-052`: As a **Super Admin**, I can view the full audit log and filter by user or action type.

---

## 7. Acceptance Criteria

### AC-OJ-001: Code Submission Flow
1. User navigates to a problem page.
2. Selects a language and writes code in Monaco Editor.
3. Clicks "Submit".
4. UI shows "Judging…" state with progress indicator.
5. Within 30 seconds (p95), the page updates with a verdict badge.
6. Verdict is one of the defined statuses; `ACCEPTED` grants EXP.

### AC-FR-001: Belt Examination
1. User with sufficient EXP sees an "Attempt Examination" button on their profile.
2. On starting, a countdown timer begins.
3. User submits solutions to exam problems.
4. On time expiry or manual submission, results are computed.
5. If score ≥ pass threshold → promotion recorded; user receives notification.
6. If score < threshold → attempt logged; cooldown enforced before next attempt.

### AC-AC-001: Assignment Submission
1. Student navigates to class assignments feed.
2. Clicks an assignment, writes code, submits.
3. Submission is judged normally; result stored against the assignment.
4. Instructor dashboard reflects the new submission with verdict and score.

---

## 8. Out of Scope (v1.0)

- Mobile native apps (iOS/Android) — web-only responsive design is in scope.
- Real-time collaborative code editing (pair programming).
- AI-powered hint generation (planned for v2.0).
- Marketplace for user-created courses (planned for v2.0).
- Multi-language UI (i18n infrastructure in scope; translations not).
- Video lesson hosting (embed-only via YouTube/Vimeo).

---

## 9. Success Metrics

| Metric | 3-Month Target | 12-Month Target |
|--------|---------------|-----------------|
| Registered Users | 1,000 | 20,000 |
| Daily Active Users (DAU) | 150 | 3,000 |
| Problems in DB | 200 | 1,500 |
| Submissions / Day | 1,000 | 25,000 |
| Avg. Session Duration | 15 min | 25 min |
| Instructor-led Classes | 5 | 100 |
| Judge Success Rate | > 99% | > 99.5% |
| Net Promoter Score (NPS) | 40 | 55 |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **OJ** | Online Judge — an automated code evaluation system |
| **Belt** | A rank level in CODE FIGHTER OJ's martial arts–inspired progression system |
| **EXP** | Experience Points — earned by solving problems, winning contests, completing missions |
| **Belt Examination** | A timed, graded problem set that must be passed to advance to the next belt |
| **Academy** | A group of students and instructors using the structured learning features |
| **Class** | A specific cohort of students enrolled under an instructor |
| **Verdict** | The result of a code submission evaluation (AC, WA, TLE, etc.) |
| **AC** | Accepted — the submission passes all test cases |
| **WA** | Wrong Answer |
| **TLE** | Time Limit Exceeded |
| **MLE** | Memory Limit Exceeded |
| **RE** | Runtime Error |
| **CE** | Compilation Error |
| **Editorial** | An official explanation/solution for a problem |
| **Upsolving** | Submitting to a contest problem after the contest has ended |
| **Partial Scoring** | A scoring mode where subtask-level points are awarded (IOI-style) |
