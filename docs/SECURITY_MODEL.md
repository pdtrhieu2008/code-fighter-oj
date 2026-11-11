# CODE FIGHTER OJ — SECURITY MODEL & THREAT ARCHITECTURE

## 1. Executive Security Summary
CODE FIGHTER OJ is a competitive programming platform, learning management system, and automated code execution engine. It accepts untrusted arbitrary user code (C++17, C++20, Python 3, Java) and executes it on remote host infrastructure. As such, isolation, defense-in-depth, and principle of least privilege are fundamental architectural tenants.

---

## 2. Threat Vector Analysis & Mitigation

### 2.1 Untrusted Code Execution (Judge Engine)
- **Threat Vector:** Malicious code executing system calls (`fork bomb`, network exfiltration, arbitrary filesystem reads, privilege escalation, host kernel exploitation).
- **Mitigation Architecture:**
  1. **Strict Sandboxing:** Multi-tier isolation using Linux namespaces, cgroups v2, seccomp filters (via `isolate` / `nsjail` / Judge0).
  2. **Zero Network Egress:** The sandbox container network namespace is disabled (`--net=none`). No connection to local network, Docker bridge, or public internet.
  3. **Resource Quotas:**
     - Maximum CPU execution time (hard limit = 2.0s, kill via SIGKILL).
     - Memory limits enforced at kernel cgroup level (e.g., 256MB/512MB hard limit).
     - Process limit (`pids.max = 32`) to mitigate fork bombs.
     - Filesystem read-only with a micro tmpfs scratch pad (`size=16M`).
  4. **Testcase Confidentiality:** Testcase inputs are piped via standard input (stdin); expected outputs are never mounted in the execution container.

### 2.2 Broken Object Level Authorization (BOLA / IDOR)
- **Threat:** Students attempting to view hidden test cases, draft problems, private class assignments, or another fighter's private source code.
- **Mitigation:**
  - Strict server-side Prisma where-clauses checking ownership or enrollment role (`STUDENT`, `INSTRUCTOR`, `ADMIN`).
  - DTO projection sanitizes all hidden testcases (`isHidden: false` only for client endpoints).
  - Unlisted and private problems enforce membership checks against `GroupMember` or `ClassEnrollment`.

### 2.3 Authentication & Session Security
- **Threat:** Brute-force attacks, session hijacking, credential stuffing.
- **Mitigation:**
  - Password hashing: `bcryptjs` with work factor (salt rounds) = 12.
  - Session tokens: Secure, HTTP-Only, SameSite=Lax, encrypted JWT or database sessions.
  - Rate limiting on `/api/auth/register` and `/api/auth/signin` using Redis token bucket (e.g. 5 attempts / minute per IP).

### 2.4 Competitive Integrity & Anti-Cheat
- **Threat:** Pre-contest problem scraping, timing manipulation, EXP farming via repetitive submissions.
- **Mitigation:**
  - Contests enforce start-time checks on the server clock (NTP synchronized), not client clock.
  - EXP Transactions are idempotent: `@@unique([userId, source, referenceId])` prevents duplicate EXP awards for the same solved problem.
  - Submissions are throttled per user (1 submission per 10 seconds per problem).

---

## 3. RBAC Permission Matrix

| Operation | Guest | Registered | Student | Instructor | Admin | Super Admin |
|---|---|---|---|---|---|---|
| View Public Problems | Yes | Yes | Yes | Yes | Yes | Yes |
| Submit Code | No | Yes | Yes | Yes | Yes | Yes |
| Access Enrolled Classes | No | No | Yes | Yes | Yes | Yes |
| Create Problems & Tests | No | No | No | Assigned | Yes | Yes |
| Issue Belt Promotions | No | No | No | No | Yes | Yes |
| View System Audit Logs | No | No | No | No | No | Yes |

---

## 4. Audit Logging Architecture
All administrative actions, manual belt promotions, test case revisions, and sensitive permission escalations are recorded in the immutable `AuditLog` table:
- Actor ID, Target ID, Action Name (`PROBLEM_CREATED`, `BELT_PROMOTED_MANUAL`, `STUDENT_SUSPENDED`), Client IP, and Delta JSON.
