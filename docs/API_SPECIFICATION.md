# CODE FIGHTER OJ — API Specification

> **TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.**

**Version:** 1.0.0  
**Base URL:** `https://codefighter.oj/api`  
**Auth:** Bearer token (JWT session cookie) or `Authorization: Bearer <token>` header  
**Last Updated:** 2026-11-08

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Users API](#3-users-api)
4. [Fighters API](#4-fighters-api)
5. [Problems API](#5-problems-api)
6. [Submissions API](#6-submissions-api)
7. [Judge API](#7-judge-api)
8. [Contests API](#8-contests-api)
9. [Leaderboard API](#9-leaderboard-api)
10. [Belts & Examinations API](#10-belts--examinations-api)
11. [Groups API](#11-groups-api)
12. [Courses & Classes API](#12-courses--classes-api)
13. [Assignments API](#13-assignments-api)
14. [Admin API](#14-admin-api)
15. [TypeScript Type Definitions](#15-typescript-type-definitions)

---

## 1. Conventions

### Request Format
- All request bodies are JSON unless specified (`Content-Type: application/json`).
- File uploads use `multipart/form-data`.

### Response Format

All API responses follow this envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;       // Machine-readable error code
    message: string;    // Human-readable message
    details?: unknown;  // Validation errors, etc.
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — Successful read or update |
| 201 | Created — Resource created |
| 202 | Accepted — Async operation queued |
| 204 | No Content — Successful delete |
| 400 | Bad Request — Validation error |
| 401 | Unauthorized — Not authenticated |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — Duplicate resource |
| 422 | Unprocessable Entity — Business logic error |
| 429 | Too Many Requests — Rate limited |
| 500 | Internal Server Error |

### Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| General API | 100 req/min per IP |
| Auth endpoints | 10 req/min per IP |
| Submission creation | 1 req/10s per user |
| Admin endpoints | 200 req/min per user |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699430400
```

### Pagination

Paginated endpoints accept:
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

---

## 2. Authentication

### `POST /api/auth/register`

Register a new user with email and password.

**Request:**
```typescript
interface RegisterRequest {
  username: string;   // 3–20 chars, alphanumeric + underscore
  email: string;
  password: string;   // Min 8 chars
  name?: string;
}
```

**Response `201`:**
```typescript
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  message: string; // "Verification email sent"
}
```

---

### `POST /api/auth/login`

Credentials-based login (NextAuth.js handles OAuth via `/api/auth/[...nextauth]`).

**Request:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response `200`:**
```typescript
interface LoginResponse {
  user: PublicUser;
  sessionExpires: string; // ISO 8601
}
```
Sets `httpOnly` session cookie.

---

### `POST /api/auth/logout`

**Auth required:** Yes  
**Response `204`:** Clears session cookie.

---

### `GET /api/auth/me`

Get the current authenticated user.

**Auth required:** Yes  
**Response `200`:**
```typescript
interface MeResponse {
  user: AuthenticatedUser;
}
```

---

## 3. Users API

### `GET /api/users/:username`

Get a public user profile.

**Auth required:** No  
**Response `200`:**
```typescript
interface UserProfileResponse {
  user: PublicUser;
  profile: UserProfileData;
  fighter: PublicFighterProfile;
  recentActivity: DailyActivity[];
  achievements: UserAchievementData[];
}
```

---

### `PATCH /api/users/me`

Update the current user's profile.

**Auth required:** Yes  
**Request:**
```typescript
interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  country?: string;
  organization?: string;
  website?: string;
  githubUrl?: string;
  twitterUrl?: string;
  isPublic?: boolean;
}
```

**Response `200`:** Updated `UserProfileData`.

---

### `POST /api/users/me/avatar`

Upload a profile avatar.

**Auth required:** Yes  
**Content-Type:** `multipart/form-data`  
**Body:** `avatar` field (JPEG/PNG/WebP, max 2MB)  
**Response `200`:** `{ avatarUrl: string }`

---

### `PATCH /api/users/me/password`

Change password.

**Auth required:** Yes  
**Request:**
```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

---

## 4. Fighters API

### `GET /api/fighters/:username/stats`

Get detailed competitive stats for a fighter.

**Auth required:** No  
**Response `200`:**
```typescript
interface FighterStatsResponse {
  totalEXP: number;
  currentBeltEXP: number;
  problemsSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  contestRating: number;
  rank: number;
  currentBelt: BeltLevelData;
  solvedByDifficulty: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
    EXPERT: number;
  };
  solvedByTag: Array<{ tag: string; count: number }>;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
  };
  activityGrid: DailyActivity[]; // Last 365 days
}
```

---

### `GET /api/fighters/:username/submissions`

Get a user's submission history (paginated).

**Auth required:** Yes (own) or Admin  
**Query params:** `page`, `pageSize`, `verdict`, `problemId`, `language`  
**Response `200`:** Paginated `SubmissionSummary[]`

---

### `GET /api/fighters/:username/achievements`

**Auth required:** No  
**Response `200`:**
```typescript
interface AchievementsResponse {
  earned: UserAchievementData[];
  available: AchievementData[];
}
```

---

## 5. Problems API

### `GET /api/problems`

List problems (public).

**Auth required:** No  
**Query params:**
```typescript
interface ProblemsListQuery {
  page?: number;
  pageSize?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  tags?: string;          // comma-separated tag slugs
  search?: string;        // title search
  status?: "SOLVED" | "ATTEMPTED" | "UNSOLVED"; // requires auth
  sortBy?: "acCount" | "difficulty" | "createdAt" | "acRate";
  sortDir?: "asc" | "desc";
}
```

**Response `200`:**
```typescript
interface ProblemsListResponse {
  problems: ProblemSummary[];
  meta: PaginationMeta;
}
```

---

### `GET /api/problems/:slug`

Get problem detail.

**Auth required:** No (public problems); Yes (private)  
**Response `200`:**
```typescript
interface ProblemDetailResponse {
  problem: ProblemDetail;
  userStatus?: {   // only if authenticated
    solved: boolean;
    attempted: boolean;
    lastVerdict?: SubmissionVerdict;
    lastSubmissionId?: string;
  };
  tags: TagData[];
}
```

> [!IMPORTANT]
> `testCases` in this response includes **only** sample test cases (`isSample: true`). Hidden test cases are never returned to clients.

---

### `GET /api/problems/:slug/editorial`

Get editorial for a problem.

**Auth required:** Yes  
**Conditions:** User must have solved the problem OR editorial unlock condition is satisfied.  
**Response `200`:**
```typescript
interface EditorialResponse {
  editorial: {
    content: string;    // Markdown
    author?: string;
    updatedAt: string;
  };
}
```

**Response `403`:** Editorial not yet unlocked.

---

### `POST /api/problems` *(Admin/Instructor)*

Create a new problem.

**Auth required:** Yes (`ADMIN` or `INSTRUCTOR`)  
**Request:**
```typescript
interface CreateProblemRequest {
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  visibility: "PUBLIC" | "PRIVATE";
  statement: string;        // Markdown
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  notes?: string;
  timeLimitMs: number;      // Default: 2000
  memoryLimitKb: number;    // Default: 262144
  allowedLanguages?: string[];
  tagIds?: string[];
  isPartialScoring?: boolean;
}
```

**Response `201`:** Created `ProblemDetail`.

---

### `POST /api/problems/:slug/test-cases` *(Admin)*

Upload test cases for a problem.

**Auth required:** Yes (`ADMIN`)  
**Content-Type:** `multipart/form-data`  
**Body:** ZIP file with `{n}.in` / `{n}.out` pairs OR JSON array  
**Response `201`:** `{ created: number }`

---

### `PATCH /api/problems/:slug` *(Admin)*

Update problem metadata.  
**Auth required:** Yes (`ADMIN`)

---

### `DELETE /api/problems/:slug` *(Admin)*

Soft-delete a problem.  
**Auth required:** Yes (`ADMIN`)

---

## 6. Submissions API

### `POST /api/submissions`

Create a new submission. The submission is queued for judging asynchronously.

**Auth required:** Yes  
**Rate limit:** 1 per 10s per user  
**Request:**
```typescript
interface CreateSubmissionRequest {
  problemId: string;
  language: SupportedLanguage;
  sourceCode: string;         // Max 65536 chars
  contestId?: string;
  assignmentId?: string;
  examinationAttemptId?: string;
  isPublic?: boolean;
}
```

**Response `202`:**
```typescript
interface CreateSubmissionResponse {
  submissionId: string;
  status: "QUEUED";
  streamUrl: string;   // SSE endpoint: /api/submissions/{id}/stream
}
```

---

### `GET /api/submissions/:id`

Get submission details.

**Auth required:** Yes (own submission) or Admin  
**Response `200`:**
```typescript
interface SubmissionDetailResponse {
  submission: SubmissionDetail;
  judgeJobs?: JudgeJobSummary[]; // Only for Admin
}
```

> [!CAUTION]
> Never expose hidden test case input/output via this endpoint, even for admin. Test case content is accessible only via the internal admin test-case management UI.

---

### `GET /api/submissions/:id/stream`

Server-Sent Events stream for real-time submission updates.

**Auth required:** Yes (own) or Admin  
**Content-Type:** `text/event-stream`

**Events:**
```typescript
// event: status-update
interface SubmissionStatusEvent {
  submissionId: string;
  verdict: SubmissionVerdict;
  timeMs?: number;
  memoryKb?: number;
  compilerMessage?: string;
}

// event: completed
interface SubmissionCompletedEvent {
  submissionId: string;
  verdict: SubmissionVerdict;
  timeMs?: number;
  memoryKb?: number;
  expGained?: number;
  newAchievements?: AchievementData[];
}
```

---

### `GET /api/submissions`

List submissions (authenticated user's own, or admin).

**Auth required:** Yes  
**Query params:** `page`, `pageSize`, `problemId`, `verdict`, `language`, `contestId`  
**Response `200`:** Paginated `SubmissionSummary[]`

---

## 7. Judge API

### `POST /api/judge/callback` *(Internal)*

Webhook called by the Judge Worker to update submission results. This endpoint is **not** publicly accessible — it validates a shared secret.

**Auth:** `X-Judge-Secret: <secret>` header  
**Request:**
```typescript
interface JudgeCallbackRequest {
  submissionId: string;
  verdict: SubmissionVerdict;
  timeMs: number;
  memoryKb: number;
  compilerMessage?: string;
  score?: number;
  jobResults: JudgeJobResult[];
}
```

**Response `200`:** `{ ok: true }`

---

### `POST /api/judge/run`

Run code against **sample test cases only** (no submission created). Used for the "Run" button in the editor.

**Auth required:** Yes  
**Rate limit:** 5 per min per user  
**Request:**
```typescript
interface RunCodeRequest {
  problemId: string;
  language: SupportedLanguage;
  sourceCode: string;
  customInput?: string;   // Override with custom stdin
}
```

**Response `200`:**
```typescript
interface RunCodeResponse {
  results: Array<{
    testCaseIndex: number;
    isSample: boolean;
    verdict: SubmissionVerdict;
    stdout?: string;
    stderr?: string;
    timeMs?: number;
    memoryKb?: number;
    expectedOutput?: string; // Only for sample cases
  }>;
}
```

---

## 8. Contests API

### `GET /api/contests`

List contests.

**Auth required:** No  
**Query params:** `status`, `type`, `page`, `pageSize`  
**Response `200`:** Paginated `ContestSummary[]`

---

### `GET /api/contests/:slug`

Get contest details.

**Auth required:** No (public) / Yes (private)  
**Response `200`:**
```typescript
interface ContestDetailResponse {
  contest: ContestDetail;
  problems?: ContestProblemData[];  // Only if contest is running/ended
  userParticipant?: ContestParticipantData;
}
```

---

### `POST /api/contests/:slug/register`

Register for a contest.

**Auth required:** Yes  
**Response `201`:** `{ participantId: string }`

---

### `GET /api/contests/:slug/standings`

Get contest standings (live during contest, final after).

**Auth required:** No (public contests)  
**Response `200`:**
```typescript
interface StandingsResponse {
  isFrozen: boolean;
  frozenAt?: string;
  standings: Array<{
    rank: number;
    user: PublicUser;
    score: number;
    penalty: number;
    solvedCount: number;
    problemResults: Record<string, {
      verdict: "AC" | "WA" | "PENDING" | null;
      attempts: number;
      solveTimeMin?: number;
    }>;
  }>;
}
```

---

### `POST /api/contests` *(Admin)*

Create a contest.

**Auth required:** Yes (`ADMIN`)  
**Request:**
```typescript
interface CreateContestRequest {
  title: string;
  description?: string;
  type: "ICPC" | "IOI" | "CUSTOM";
  visibility: "PUBLIC" | "PRIVATE" | "GROUP_ONLY";
  groupId?: string;
  startTime: string;  // ISO 8601
  endTime: string;
  registrationOpen?: string;
  registrationClose?: string;
  isRated?: boolean;
  freezeStandingsAt?: string;
  problems: Array<{
    problemId: string;
    label: string;
    points: number;
  }>;
}
```

---

## 9. Leaderboard API

### `GET /api/leaderboard`

Global leaderboard.

**Auth required:** No  
**Query params:**
```typescript
interface LeaderboardQuery {
  page?: number;
  pageSize?: number;
  beltColor?: BeltColor;
  country?: string;
  organization?: string;
  period?: "ALL_TIME" | "WEEKLY" | "MONTHLY";
}
```

**Response `200`:**
```typescript
interface LeaderboardResponse {
  entries: Array<{
    rank: number;
    user: PublicUser;
    fighter: PublicFighterProfile;
    beltLevel: BeltLevelData;
  }>;
  meta: PaginationMeta;
}
```

---

### `GET /api/leaderboard/me`

Get current user's rank and surrounding entries.

**Auth required:** Yes  
**Response `200`:** `{ rank: number; surrounding: LeaderboardEntry[] }`

---

## 10. Belts & Examinations API

### `GET /api/belts`

Get all belt levels with requirements.

**Auth required:** No  
**Response `200`:**
```typescript
interface BeltsResponse {
  belts: Array<{
    color: BeltColor;
    displayName: string;
    levels: Array<{
      tier: "I" | "II" | "III";
      displayName: string;
      expRequired: number;
      requirements: BeltRequirementData;
    }>;
  }>;
}
```

---

### `GET /api/belts/my-progress`

Get authenticated user's belt progress.

**Auth required:** Yes  
**Response `200`:**
```typescript
interface BeltProgressResponse {
  currentBelt: BeltLevelData;
  currentEXP: number;
  expToNextLevel: number;
  progressPercent: number;
  eligibleForExamination: boolean;
  nextExaminationCooldownUntil?: string;
  promotionHistory: PromotionHistoryEntry[];
}
```

---

### `GET /api/examinations/available`

List examinations the user is eligible to attempt.

**Auth required:** Yes  
**Response `200`:**
```typescript
interface AvailableExaminationsResponse {
  examinations: Array<{
    id: string;
    beltLevel: BeltLevelData;
    title: string;
    timeLimitMins: number;
    passScore: number;
    attemptsUsed: number;
    maxAttempts: number;
    cooldownUntil?: string;
  }>;
}
```

---

### `POST /api/examinations/:id/start`

Start a belt examination attempt.

**Auth required:** Yes  
**Response `201`:**
```typescript
interface StartExaminationResponse {
  attemptId: string;
  expiresAt: string;
  problems: ExamProblemData[];  // No hidden test cases
}
```

---

### `POST /api/examinations/attempts/:attemptId/submit`

Finalize an examination attempt.

**Auth required:** Yes (attempt owner)  
**Response `200`:**
```typescript
interface SubmitExaminationResponse {
  score: number;
  passed: boolean;
  newBelt?: BeltLevelData;
  expGained?: number;
  cooldownUntil?: string;  // If failed and more attempts remain
}
```

---

## 11. Groups API

### `GET /api/groups`

List public groups.

**Auth required:** No  
**Query params:** `page`, `pageSize`, `search`  
**Response `200`:** Paginated `GroupSummary[]`

---

### `POST /api/groups`

Create a group.

**Auth required:** Yes  
**Request:**
```typescript
interface CreateGroupRequest {
  name: string;
  slug: string;
  description?: string;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
}
```

---

### `GET /api/groups/:slug`

Get group details.

**Auth required:** No (public) / Yes (private)

---

### `POST /api/groups/:slug/join`

Join a public group or join via invite code.

**Auth required:** Yes  
**Request:** `{ inviteCode?: string }`

---

### `POST /api/groups/:slug/invite`

Generate an invite link for the group.

**Auth required:** Yes (`OWNER` or `ADMIN` of group)  
**Request:** `{ expiresInHours?: number; maxUses?: number }`  
**Response `201`:** `{ code: string; url: string }`

---

### `DELETE /api/groups/:slug/members/:userId`

Remove a member from the group.

**Auth required:** Yes (`OWNER` or `ADMIN` of group)

---

## 12. Courses & Classes API

### `GET /api/courses`

List published courses.

**Auth required:** No

---

### `POST /api/courses` *(Instructor)*

Create a course.

**Auth required:** Yes (`INSTRUCTOR` or `ADMIN`)

---

### `POST /api/classes` *(Instructor)*

Create a class.

**Auth required:** Yes (`INSTRUCTOR` or `ADMIN`)  
**Request:**
```typescript
interface CreateClassRequest {
  name: string;
  courseId?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}
```

**Response `201`:** `{ class: ClassData; inviteCode: string }`

---

### `GET /api/classes/:id`

Get class details.

**Auth required:** Yes (enrolled student or instructor)

---

### `POST /api/classes/:id/enroll`

Enroll in a class via invite code.

**Auth required:** Yes  
**Request:** `{ inviteCode: string }`

---

### `GET /api/classes/:id/students`

Get enrolled students with progress summary.

**Auth required:** Yes (`INSTRUCTOR` of class or `ADMIN`)

---

## 13. Assignments API

### `GET /api/assignments`

List assignments (for the current user's enrolled classes).

**Auth required:** Yes

---

### `POST /api/assignments` *(Instructor)*

Create an assignment.

**Auth required:** Yes (`INSTRUCTOR`)  
**Request:**
```typescript
interface CreateAssignmentRequest {
  classId: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxPoints?: number;
  problems: Array<{
    problemId: string;
    points: number;
    sortOrder: number;
  }>;
}
```

---

### `GET /api/assignments/:id`

Get assignment detail.

**Auth required:** Yes (enrolled student or instructor)

---

### `POST /api/assignments/:id/publish` *(Instructor)*

Publish an assignment draft.

**Auth required:** Yes (instructor of the class)

---

### `GET /api/assignments/:id/submissions` *(Instructor)*

Get all student submissions for an assignment.

**Auth required:** Yes (`INSTRUCTOR` of class)  
**Response `200`:** `{ submissions: AssignmentSubmissionData[] }`

---

### `POST /api/assignments/submissions/:submissionId/feedback` *(Instructor)*

Post instructor feedback on a student submission.

**Auth required:** Yes (`INSTRUCTOR`)  
**Request:**
```typescript
interface PostFeedbackRequest {
  content: string;    // Markdown supported
  score?: number;
}
```

---

## 14. Admin API

All admin endpoints require `ADMIN` or `SUPER_ADMIN` role.

### `GET /api/admin/users`

Search and list all users.

**Query params:** `search`, `status`, `role`, `page`, `pageSize`

---

### `PATCH /api/admin/users/:id/status`

Update user account status.

**Request:** `{ status: "ACTIVE" | "SUSPENDED" | "BANNED" }`

---

### `PATCH /api/admin/users/:id/roles`

Add or remove roles for a user.

**Request:** `{ add?: string[]; remove?: string[] }` (role names)  
**Requires:** `SUPER_ADMIN` for modifying ADMIN/SUPER_ADMIN roles.

---

### `GET /api/admin/submissions`

List all submissions platform-wide.

**Query params:** `userId`, `problemId`, `verdict`, `contestId`, `page`, `pageSize`

---

### `POST /api/admin/submissions/:id/rejudge`

Rejudge a specific submission.

**Response `202`:** `{ submissionId: string; status: "QUEUED" }`

---

### `GET /api/admin/audit-logs`

Query the audit log.

**Query params:** `actorId`, `action`, `targetType`, `startDate`, `endDate`, `page`, `pageSize`

---

### `GET /api/admin/system-settings`

Get all system settings.

---

### `PATCH /api/admin/system-settings/:key`

Update a system setting.

**Request:** `{ value: string }`

---

### `GET /api/admin/judge/status`

Get Judge0 health and queue status.

**Response `200`:**
```typescript
interface JudgeStatusResponse {
  judge0: {
    healthy: boolean;
    version?: string;
    queueLength: number;
    activeWorkers: number;
  };
  bullmq: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}
```

---

## 15. TypeScript Type Definitions

```typescript
// types/api.ts

// ============================================================
// ENUMS
// ============================================================

export type SubmissionVerdict =
  | "PENDING"
  | "QUEUED"
  | "JUDGING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "INTERNAL_ERROR"
  | "PARTIAL";

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";
export type BeltColor = "WHITE" | "YELLOW" | "ORANGE" | "GREEN" | "BLUE" | "PURPLE" | "BROWN" | "RED" | "BLACK";
export type BeltTier = "I" | "II" | "III";
export type ContestType = "ICPC" | "IOI" | "CUSTOM";
export type ContestStatus = "DRAFT" | "REGISTRATION_OPEN" | "RUNNING" | "ENDED" | "RESULTS_FINAL" | "CANCELLED";

export type SupportedLanguage =
  | "c"
  | "cpp17"
  | "cpp20"
  | "java21"
  | "python3"
  | "javascript"
  | "typescript"
  | "go"
  | "rust"
  | "kotlin"
  | "ruby"
  | "swift";

// ============================================================
// USER TYPES
// ============================================================

export interface PublicUser {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  country?: string | null;
}

export interface AuthenticatedUser extends PublicUser {
  email: string;
  emailVerified: boolean;
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "EMAIL_UNVERIFIED";
  roles: string[];
  createdAt: string;
}

export interface UserProfileData {
  username: string;
  bio: string | null;
  country: string | null;
  organization: string | null;
  website: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
}

// ============================================================
// FIGHTER / BELT TYPES
// ============================================================

export interface BeltLevelData {
  id: string;
  color: BeltColor;
  tier: BeltTier;
  displayName: string;
  sortOrder: number;
  badgeUrl?: string;
}

export interface PublicFighterProfile {
  totalEXP: number;
  problemsSolved: number;
  contestRating: number;
  rank: number | null;
  currentBelt: BeltLevelData;
}

export interface BeltRequirementData {
  expRequired: number;
  minProblemsSolved: number;
  minContestCount: number;
  requiredTags: string[];
}

export interface PromotionHistoryEntry {
  id: string;
  fromBelt: BeltLevelData | null;
  toBelt: BeltLevelData;
  promotedAt: string;
  examinationScore: number | null;
}

// ============================================================
// PROBLEM TYPES
// ============================================================

export interface TagData {
  id: string;
  slug: string;
  name: string;
  color: string;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  acCount: number;
  submitCount: number;
  acRate: number;
  tags: TagData[];
  userStatus?: "SOLVED" | "ATTEMPTED" | "UNSOLVED";
}

export interface SampleTestCase {
  input: string;
  output: string;
  note?: string;
}

export interface ProblemDetail extends ProblemSummary {
  statement: string;        // Markdown
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  notes: string | null;
  timeLimitMs: number;
  memoryLimitKb: number;
  allowedLanguages: string[];
  sampleTestCases: SampleTestCase[];
  isPartialScoring: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// SUBMISSION TYPES
// ============================================================

export interface SubmissionSummary {
  id: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  language: SupportedLanguage;
  verdict: SubmissionVerdict;
  timeMs: number | null;
  memoryKb: number | null;
  score: number | null;
  createdAt: string;
}

export interface SubmissionDetail extends SubmissionSummary {
  sourceCode: string;         // Only visible to submitter and admin
  compilerMessage: string | null;
}

// ============================================================
// CONTEST TYPES
// ============================================================

export interface ContestSummary {
  id: string;
  slug: string;
  title: string;
  type: ContestType;
  status: ContestStatus;
  startTime: string;
  endTime: string;
  participantCount: number;
  isRated: boolean;
}

export interface ContestDetail extends ContestSummary {
  description: string | null;
  registrationOpen: string | null;
  registrationClose: string | null;
  freezeStandingsAt: string | null;
}

export interface ContestProblemData {
  label: string;    // A, B, C...
  problem: ProblemSummary;
  points: number;
}

// ============================================================
// GAMIFICATION TYPES
// ============================================================

export interface AchievementData {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  expReward: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

export interface UserAchievementData extends AchievementData {
  earnedAt: string;
}

export interface DailyActivity {
  date: string;      // YYYY-MM-DD
  acCount: number;
  submitCount: number;
  expEarned: number;
}

// ============================================================
// SHARED TYPES
// ============================================================

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: PaginationMeta;
}

// ============================================================
// JUDGE TYPES
// ============================================================

export interface JudgeJobSummary {
  id: string;
  testCaseIndex: number;
  isSample: boolean;
  verdict: SubmissionVerdict;
  timeMs: number | null;
  memoryKb: number | null;
  points: number;
  // stdin/stdout/stderr are NEVER returned — internal only
}

export interface JudgeJobResult {
  jobId: string;
  verdict: SubmissionVerdict;
  timeMs: number;
  memoryKb: number;
  points: number;
}

// ============================================================
// ASSIGNMENT / CLASS TYPES
// ============================================================

export interface ClassData {
  id: string;
  slug: string;
  name: string;
  instructorId: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  enrollmentCount: number;
}

export interface AssignmentData {
  id: string;
  classId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxPoints: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "GRADED";
  problems: Array<{ problem: ProblemSummary; points: number }>;
}

export interface AssignmentSubmissionData {
  id: string;
  user: PublicUser;
  submissionId: string | null;
  verdict: SubmissionVerdict | null;
  score: number | null;
  isGraded: boolean;
  submittedAt: string;
  feedback?: {
    content: string;
    score: number | null;
    createdAt: string;
  };
}

export interface ExamProblemData {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  timeLimitMs: number;
  memoryLimitKb: number;
  statement: string;
  sampleTestCases: SampleTestCase[];
  // No hidden test cases, no editorial
}

// ============================================================
// GROUP TYPES
// ============================================================

export interface GroupSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  memberCount: number;
}
```
