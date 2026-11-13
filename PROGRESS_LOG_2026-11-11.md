# CODE FIGHTER OJ — TIẾN ĐỘ TRIỂN KHAI 2026-11-11

**Cập nhật:** 2026-11-13 (session ZCode)  
**Giai đoạn hiện tại:** Phase 2 (Online Judge) ~95% — E2E verified + Phase 6 (Contests) E2E verified + Phase 7 (Admin management) ~75% — E2E verified

---

## 0. NHẬT KÝ SESSION MỚI NHẤT (2026-11-13, ZCode)

### ✅ E2E TEST ĐẦY ĐỦ LẦN ĐẦU TIÊN — PASS TOÀN BỘ

**Môi trường đã khôi phục sau khi máy nghỉ:**
- PostgreSQL 18 service RUNNING, DB `code_fighter_oj` OK
- WSL2 boot lại + snap Docker auto-start, 4 container Judge0 (server/worker/db/redis) Up — IP WSL vẫn `172.17.174.109`, khớp `.env.local`, không cần sửa config
- Giữ WSL sống bằng keep-alive 4h nền (WSL auto-shutdown khi idle là nguyên nhân Judge0 "chết" giữa các lần test trước)
- Dev server `http://localhost:3000` chạy OK, `/api/problems` HTTP 200
- Quality gates: `tsc --noEmit` PASS, `pnpm test` **21/21 PASS** (4 files)

**E2E user flow (script PowerShell, qua Judge0 thật trong WSL):**
| Bước | Kết quả |
|---|---|
| Đăng ký tài khoản mới | 201 — `CF-000006` tự cấp tuần tự |
| Đăng nhập NextAuth Credentials + JWT session | OK, session trả đúng id/username/role |
| Submit C++17 đúng (Tổng Hai Số) | **ACCEPTED**, score 60, 28ms, 3204KB |
| Submit C++17 sai | **WRONG_ANSWER**, score 0 |
| Run custom input Python3 (`print(n*2)` với input 21) | 200, output `42` |
| Submit ẩn danh | 401 ✓ |
| DB verify: EXP idempotency | `totalExp=5, totalSolved=1`, không thưởng trùng |

**E2E Admin Panel flow:**
| Bước | Kết quả |
|---|---|
| Login `admin@codefighter.local` (SUPER_ADMIN) | OK |
| 6 trang admin (dashboard/contests/users/problems/belts/problems-create) | toàn bộ HTTP 200 |
| Tạo contest `POST /api/contests` (2 bài public, label A/B, audit log) | 201 |
| Trang contest detail `/contests/[slug]` | 200 |
| Đổi status `PATCH /api/admin/contests/[id]` (REGISTRATION → ACTIVE) | 200 |
| User thường PATCH status | **403** ✓ |
| User thường tạo contest | **403** ✓ |

### ✅ Commit mới
- `fix: read role from DB in requireAdmin instead of trusting session` — `requireAdmin` giờ query role trực tiếp từ DB (không tin session token cũ); đã pass tsc + 21 tests trước khi commit; push lên `origin/master`.

### 📌 Đánh giá lại trạng thái (đổi so với log cũ)
- ❌ cũ "Contest system chưa có" → **đã có và E2E pass** (tạo contest, đăng ký trang detail, scoreboard page đã fix TS ở session trước)
- ❌ cũ "Admin panel chưa có" → **đã có và E2E pass** (problems CRUD + testcases + users + contests + belts)

### 🔄 Việc còn lại (đã update)
1. **Submission queue & polling** — hiện vẫn sync (chờ Judge0 từng test case); với N hidden test lớn sẽ chậm
2. **Judge0 hardening WSL** — container sống nhờ keep-alive; lâu dài nên cài `vmIdleTimeout=-1` trong `.wslconfig` hoặc switch sang Docker Desktop
3. Polish: middleware convention warning, Playwright E2E, Docker deployment

### ✅ HOÀN THÀNH (2026-11-13, tiếp nối session): Academy enrollment UI + Audit Logs
- Phát hiện sidebar admin có 3 link chết: `/admin/groups`, `/admin/examinations`, `/admin/audit-logs` (trang chưa tồn tại).

**API mới (4 route, tất cả `requireAdmin` đọc role từ DB + AuditLog):**
- `POST /api/admin/academy/classes` — tạo lớp (zod: tên 3-100 ký tự, courseId/instructorId phải tồn tại, instructor phải là INSTRUCTOR/ADMIN, end > start, maxStudents 1-1000; audit `ACADEMY_CLASS_CREATE`)
- `DELETE /api/admin/academy/classes/[id]` — xóa lớp (cascade enrollment; audit `ACADEMY_CLASS_DELETE`)
- `POST /api/admin/academy/classes/[id]/enrollments` — ghi danh theo email HOẶC @username; 409 nếu đã ACTIVE; **tái kích hoạt** nếu COMPLETED/DROPPED; check maxStudents; audit `ACADEMY_ENROLL`/`ACADEMY_ENROLL_REACTIVATE`
- `PATCH/DELETE /api/admin/academy/classes/[id]/enrollments/[enrollmentId]` — đổi status (ACTIVE/COMPLETED/DROPPED, COMPLETED set completedAt) / xóa bản ghi; audit đầy đủ

**UI mới:**
- `/admin/academy` — server component + `AcademyManager.tsx` (client): form tạo lớp (khóa học, HLV, lịch, maxStudents), danh sách lớp có search, expand từng lớp → bảng học viên (fullName/@username/fighterId/email/status/select đổi status/xóa), input ghi danh, badge ACTIVE/maxStudents
- `/admin/audit-logs` — bảng 100 log mới nhất với màu theo loại action, người thực hiện, target, metadata JSON
- Sidebar: `/admin/groups` → `/admin/academy` (fix link chết); tạm bỏ link `/admin/examinations` (feature kỳ thi thăng đai làm sau); thêm "Nhật Ký Kiểm Toán"

**Quality gates:**
- `tsc --noEmit` PASS, ESLint các file mới PASS, `pnpm test` 21/21 PASS

**E2E Academy (11/11 checks PASS):**
| Bước | Kết quả |
|---|---|
| Tạo lớp (có HLV, maxStudents) | 201 |
| Tạo lớp end < start | **400** ✓ |
| Ghi danh theo email | 201 ACTIVE ✓ |
| Ghi danh trùng (đang ACTIVE) | **409** ✓ |
| Ghi danh student không tồn tại | **404** ✓ |
| Ghi danh theo @username | 201 ✓ |
| PATCH → COMPLETED (set completedAt) | 200 ✓ |
| DROP → ghi danh lại (tái kích hoạt) | 200 ACTIVE ✓ |
| Trang `/admin/academy`, `/admin/audit-logs` | 200 ✓ |
| Non-admin tạo lớp | **403** ✓ |
| DELETE enrollment + DELETE class | 200 ✓ |

**Việc còn lại (cập nhật):**
1. **Submission queue & polling** — hiện vẫn sync; với nhiều hidden test sẽ chậm
2. **Judge0 hardening WSL** — `vmIdleTimeout=-1` trong `.wslconfig` hoặc Docker Desktop
3. **Examinations** (kỳ thi thăng đai) — đã bỏ link tạm, làm sau
4. Polish: middleware convention warning, Playwright E2E, Docker deployment

---

## NHẬT KÝ SESSION TRƯỚC (2026-11-11 12:10–12:42, ZCode)

### ✅ Khắc phục chạy code và nộp bài qua Judge0
- **Nguyên nhân:** Judge0 worker chạy trên WSL2 cgroup v2 nhưng isolate 1.8.1 cố dùng cgroup v1 (`/sys/fs/cgroup/memory`), nên mọi compile trả `Internal Error` và không tạo được `/box/main.cpp`/`script.py`.
- **Khắc phục:** Cập nhật `/root/judge0/judge0.conf` để bật `enable_per_process_and_thread_time_limit/memory_limit`; restart server/worker để chạy sandbox bằng per-process limits, không phụ thuộc cgroup v1.
- **Kiểm chứng trực tiếp Judge0:** C++17 (`54`) và Python 3 (`71`) trả **Accepted**, output `42`; network vẫn tắt.
- **Khắc phục phía app:** Run và Submission API dùng chung `JUDGE0_SANDBOX_OPTIONS`; giữ `max_file_size`, time/memory limits và `expected_output` hidden-test server-side.
- **Auth:** chưa đăng nhập gọi `/api/judge/run` và `/api/submissions` đều trả **401**, không thực thi/nộp ẩn danh.

### ✅ Tạo trang Admin Contest thực tế
- Thêm `/admin/contests`: tạo contest, chọn bài public, xem danh sách, tìm kiếm, đổi trạng thái.
- Thêm `PATCH /api/admin/contests/[id]`: chỉ ADMIN/SUPER_ADMIN, ghi `AuditLog` khi đổi trạng thái.
- API tạo contest được siết validation: slug, thời gian kết thúc, problem IDs public/active và duplicate IDs.
- Dashboard quick action trỏ về trang quản lý thật; `/admin/problems` và `/admin/users` đã có sẵn.
- Build route xác nhận: `/admin/contests`, `/admin/users`, `/admin/problems`, `/api/admin/contests/[id]`.

### ✅ Quality gates
- `pnpm exec tsc --noEmit`: PASS
- `pnpm test`: **4 files, 21 tests passed**
- ESLint các file thay đổi: PASS
- `pnpm build`: PASS; Next.js cảnh báo middleware convention deprecated nhưng không làm build fail.
- Git remote đã đổi về URL sạch `https://github.com/pdtrhieu2008/code-fighter-oj.git`; token cũ không còn trong remote config.

---

## 0. NHẬT KÝ SESSION MỚI NHẤT (2026-11-11 11:30–12:10, ZCode)

### ✅ Sửa lỗi TypeScript toàn bộ codebase Contests (6 files)
- **Vấn đề:** Code contests dùng sai tên relations Prisma (`contestProblems`, `contestParticipants`) trong khi schema định nghĩa `problems`, `participants` → `tsc --noEmit` fail với 25 lỗi.
- **Files đã sửa:**
  - `src/app/api/contests/route.ts` — `_count.select`
  - `src/app/api/contests/[slug]/scoreboard/route.ts` — include + map standings
  - `src/app/contests/page.tsx` — include, isRegistered, count hiển thị
  - `src/app/contests/[slug]/page.tsx` — include + isRegistered
  - `src/app/contests/[slug]/scoreboard/page.tsx` — include + tính standings
  - `src/app/contests/[slug]/ContestDetailView.tsx` — count + render problem set
- **Kết quả:** `pnpm exec tsc --noEmit` → **PASS (0 lỗi)**

### ✅ Sửa seed script + Seed dữ liệu thành công
- **Vấn đề:** Seed từng fail `P2002 Unique constraint fighterId` do tài khoản thật của Hieu (`rollerphan`, `CF-000001`) đã chiếm dải fighterId tuần tự.
- **Fix:** Chuyển 3 tài khoản hệ thống sang dải riêng `CF-900001+` (admin_spartan, sensei_leet, fighter_kid) — không đụng dải `CF-0000xx` cấp tự động khi đăng ký.
- **Đã seed thành công:** 27 Belt Requirements, 11 Tags, 3 system accounts, 4 bài toán kèm test cases (Hello Fighter, Tổng Hai Số, Binary Search, LIS), 4 Achievements, 5 System Settings.
- **KHÔNG đụng tới** tài khoản cá nhân của Hieu trong DB.

### ✅ Dev server & pages
- Dev server chạy `http://localhost:3000` — `/`, `/problems`, `/contests`, `/login`, `/api/problems` đều **HTTP 200**.
- Unit tests: **20/20 pass** (vitest).

### 🔄 Judge0 — đang triển khai qua Docker trong WSL2
- Phát hiện **Docker 29.8.0** có sẵn trong WSL Ubuntu 26.04 (daemon chạy, cần root).
- Đã tải `docker-compose.yml` + `judge0.conf` chính thức của Judge0 vào `~/judge0` trong WSL.
- `docker compose up -d` đang chạy nền (pull image judge0/judge0, postgres:16.2, redis:7.2.4 — khoảng 1.5GB).
- Khi xong: Judge0 API sẽ nghe ở `localhost:2358` (đã map port) → khớp `JUDGE0_API_URL` trong `.env.local`, **không cần sửa config**.

---

## 1. TÓM TẮT TRẠNG THÁI

### ✅ Đã hoàn thành và xác minh

#### Database & Backend Infrastructure
- **PostgreSQL 18** đã cài đặt và chạy (service `postgresql-x64-18`, port `5432`)
- **Database `code_fighter_oj`** đã tạo và đồng bộ toàn bộ schema (48 models)
- **Prisma Client** đã generate thành công
- **Kết nối database** hoạt động: `prisma validate` ✓, `prisma db push` ✓
- **Environment config** đã cấu hình đúng trong `.env.local` (credentials đã URL-encode)
- **.gitignore** đã loại trừ `.env*` để bảo vệ credentials

#### Authentication & User Management
- **Đăng ký tài khoản** (`/register`) hoạt động — HTTP 200
- **Đăng nhập** (`/login`) hoạt động — HTTP 200
- **Auth.js (NextAuth v5)** với Credentials provider
- **Middleware** bảo vệ routes yêu cầu đăng nhập
- **Password hashing** với bcrypt
- **Session management** đã cấu hình

#### Problem Library & Solver
- **Thư viện bài toán** (`/problems`) — search, filters (difficulty/tag), pagination
- **API `/api/problems`** trả HTTP 200, query PostgreSQL thật (không mock)
- **Problem detail page** (`/problems/[slug]`)
- **Monaco Editor** đã cài đặt (`@monaco-editor/react@^4.7.0`)
- **Code editor** với syntax highlighting (C++17, C++20, Python 3, Java)
- **Draft autosave** trong localStorage

#### Judge0 Integration
- **Judge0 helper library** (`src/lib/judge.ts`) — language mapping:
  - C++17: `54`
  - C++20: `76`
  - Python 3: `71`
  - Java: `62`
- **Submission API** (`/api/submissions/route.ts`):
  - Chỉ nhận problem public
  - Hidden tests chỉ chạy server-side
  - Authentication required
  - EXP reward idempotency (không thưởng trùng lặp)
  - Verdict mapping Judge0 → CODE FIGHTER
- **Run API** (`/api/judge/run/route.ts`) cho custom test
- **Lỗi dịch vụ trung thực** — không giả lập Accepted khi Judge0 không khả dụng

#### Belt & Academy Policy (Enrollment-Based Access Control)
- **Belt helper** (`src/lib/academy-access.ts`):
  - Function `canDisplayBelt(enrollment | null): boolean`
  - Chỉ enrollment `ACTIVE` hoặc `COMPLETED` thuộc class có `courseId !== null` mới hiển thị belt
- **EXP system** vẫn hoạt động cho public users (không bị giới hạn)
- **Belt eligibility gate** đã áp dụng trên:
  - Dashboard (`/dashboard`)
  - Public fighter profile (`/fighters/[username]`)
  - Homepage (`/`)
  - Leaderboard (`/leaderboard`)
  - Submissions list (`/submissions`)
  - Submission detail (`/submissions/[id]`)
- **Đăng ký tài khoản mới** không tạo belt mặc định nữa
- **Existing belt data** không bị xóa, chỉ ẩn nếu không đủ điều kiện

#### Testing & Quality
- **Unit tests** pass 20/20:
  - `src/lib/academy-access.test.ts` — 15 tests
  - `src/lib/judge.test.ts` — 2 tests
  - `src/lib/problem-library.test.ts` — 3 tests
- **Vitest** đã cài đặt và cấu hình
- **Prisma validate** ✓
- **TypeScript compilation** trước đó pass (cần xác minh lại sau các thay đổi mới)
- **Targeted ESLint** pass trên academy-access và submission route
- **Production build** trước đó pass với `cacheComponents: false`

#### Web Server
- **Dev server** chạy tại `http://localhost:3000` (process `proc_bc04797a4ab3`)
- **Trang đăng ký** HTTP 200
- **Trang đăng nhập** HTTP 200
- **API problems** HTTP 200

---

## 2. GIỚI HẠN & CHƯA HOÀN THÀNH

### Chức năng chưa kiểm chứng end-to-end
- ❌ **Đăng ký → Đăng nhập → Submit bài** chưa test đầy đầu trên trình duyệt
- ❌ **Judge0 service** chưa cấu hình URL/credentials thật trong `.env.local`
- ❌ **Submission queue & polling** chưa triển khai (hiện dùng sync API)
- ❌ **Contest system** chưa có
- ❌ **Admin panel** chưa có (tạo/sửa bài, quản lý test cases)
- ❌ **Academy/Class enrollment UI** chưa có (hiện chỉ có model và policy)

### Technical Debt
- ⚠️ **Git repository** chưa khởi tạo — cần init và commit
- ⚠️ **GitHub remote** chưa có — cần tạo repo và push
- ⚠️ **Middleware convention** deprecated warning (Next.js) chưa xử lý
- ⚠️ **gh CLI** chưa cài đặt (cần cho GitHub workflow)
- ⚠️ **Judge0 mock data** vẫn còn trong code để test local — cần config thật
- ⚠️ **Password PostgreSQL** từng bị gửi vào chat — khuyến nghị đổi mật khẩu

---

## 3. CHI TIẾT THAY ĐỔI KỂ TỪ SESSION TRƯỚC (2026-11-08)

### 2026-11-11: Database Setup & Belt Policy Implementation

#### PostgreSQL Installation & Database Creation
```bash
# User cài PostgreSQL 18 thủ công (winget failed với 403 Forbidden)
# Xác minh service running
sc query postgresql-x64-18  # Running
netstat -an | findstr :5432  # Listening

# Tạo database
createdb -U postgres code_fighter_oj  # Success

# Áp dụng schema
pnpm db:push  # Success

# Generate Prisma Client
pnpm exec prisma generate  # Success (sau khi dừng dev server để tránh EPERM)
```

#### Enrollment-Based Belt Access Control
- Tạo `src/lib/academy-access.ts` với logic:
  - Belt chỉ hiện khi enrollment status = `ACTIVE` hoặc `COMPLETED`
  - Và `class.courseId !== null` (đảm bảo là khóa học thật, không phải lớp rời)
- Tạo `src/lib/academy-access.test.ts` — 15 tests coverage:
  - ACTIVE enrollment thuộc course → allow
  - COMPLETED enrollment thuộc course → allow
  - ACTIVE enrollment lớp rời (courseId null) → deny
  - DROPPED enrollment → deny
  - No enrollment → deny

#### API & Route Changes
- **`src/app/api/auth/register/route.ts`:**
  - Bỏ tạo `UserBelt` mặc định
  - Bỏ tạo EXP transaction khởi đầu 0
- **`src/app/(auth)/register/page.tsx`:**
  - Cập nhật copy: không hứa "Đai Trắng" khi đăng ký
- **`src/app/api/submissions/route.ts`:**
  - Khôi phục EXP reward và idempotency (sau khi nhận ra việc bỏ EXP là quá mức)
  - EXP vẫn độc lập với belt
  - Không tự cấp belt khi submit thành công
- **Dashboard, Profile, Homepage, Leaderboard, Submissions:**
  - Thêm enrollment query `{ where: { status: in [ACTIVE, COMPLETED], class: { courseId: { not: null } } } }`
  - Gate `userBelts[0]` display bằng `canDisplayBelt(enrollment)`

#### Testing & Verification
```bash
pnpm test                          # 20/20 pass
pnpm exec vitest run src/lib/academy-access.test.ts src/lib/judge.test.ts  # 15/15 pass
pnpm exec tsc --noEmit            # (trước đó pass)
pnpm exec eslint src/lib/academy-access.ts ... --quiet  # pass
pnpm exec prisma validate         # pass
```

#### Environment & Config
- Cập nhật `.env.local` với `DATABASE_URL` PostgreSQL:
  - Host: `localhost:5432`
  - User: `postgres`
  - Database: `code_fighter_oj`
  - Password đã URL-encode ký tự `@` thành `%40`
- `.gitignore` đã có `.env*` từ đầu

---

## 4. KẾ HOẠCH TIẾP THEO

### Ưu tiên cao (Cần làm ngay)
1. **Git init & first commit** — khởi tạo repo cục bộ trong thư mục dự án
2. **GitHub repository** — tạo repo public/private và push
3. **End-to-end test** — đăng ký tài khoản thật, đăng nhập, submit một bài
4. **Judge0 config** — thêm `JUDGE0_API_URL` và `JUDGE0_API_KEY` vào `.env.local`

### Ưu tiên trung bình (Sau khi repo hoạt động)
5. **Admin panel** — CRUD problems, upload test cases
6. **Academy enrollment UI** — admin tạo class, ghi danh học viên
7. **Contest system** — tạo contest, đăng ký, scoreboard
8. **Submission queue** — async Judge0 với polling thay vì sync

### Ưu tiên thấp (Polish)
9. Fix middleware convention warning
10. Cài `gh` CLI cho GitHub workflow
11. Playwright E2E tests
12. Docker deployment

---

## 5. FILE ĐÃ THAY ĐỔI (Kể từ 2026-11-08)

### New Files
- `src/lib/academy-access.ts` — enrollment eligibility helper
- `src/lib/academy-access.test.ts` — unit tests
- `src/lib/judge.ts` — Judge0 language mapping
- `src/lib/judge.test.ts` — verdict mapping tests
- `src/lib/problem-library.ts` — query builder
- `src/lib/problem-library.test.ts` — query tests
- `docs/JUDGE_PIPELINE.md` — Judge0 integration spec

### Modified Files
- `src/app/api/auth/register/route.ts` — bỏ belt mặc định
- `src/app/(auth)/register/page.tsx` — cập nhật copy
- `src/app/api/submissions/route.ts` — Judge0 + EXP + belt policy
- `src/app/api/judge/run/route.ts` — Judge0 custom run
- `src/app/dashboard/page.tsx` — enrollment gate
- `src/app/fighters/[username]/page.tsx` — enrollment gate
- `src/app/page.tsx` — enrollment gate
- `src/app/leaderboard/page.tsx` — enrollment gate
- `src/app/submissions/page.tsx` — enrollment gate
- `src/app/submissions/[id]/page.tsx` — enrollment gate
- `src/app/problems/page.tsx` — SSR problem library
- `src/app/problems/ProblemLibrary.tsx` — client filters
- `src/app/problems/[slug]/ProblemSolver.tsx` — Monaco editor
- `src/app/api/problems/route.ts` — PostgreSQL query
- `next.config.ts` — `cacheComponents: false`
- `package.json` — thêm `@monaco-editor/react`, `vitest`
- `.env.local` — cập nhật `DATABASE_URL` (credentials đúng)

### Config Files
- `prisma/schema.prisma` — đã đồng bộ vào database
- `.gitignore` — đã có `.env*` từ đầu
- `vitest.config.ts` — cấu hình test

---

## 6. DEPENDENCIES

### Installed (package.json)
```json
{
  "@monaco-editor/react": "^4.7.0",
  "vitest": "^2.1.8"
}
```

### External Services
- **PostgreSQL 18** — localhost:5432, database `code_fighter_oj`
- **Judge0** — chưa cấu hình URL/key (pending)

---

## 7. VERIFICATION CHECKLIST

- [x] PostgreSQL service running
- [x] Database `code_fighter_oj` exists
- [x] Prisma schema applied
- [x] Prisma Client generated
- [x] Dev server running (http://localhost:3000)
- [x] `/register` returns HTTP 200
- [x] `/login` returns HTTP 200
- [x] `/api/problems` returns HTTP 200
- [x] Unit tests pass (20/20)
- [x] Prisma validate pass
- [x] Targeted ESLint pass
- [x] `.env*` in .gitignore
- [x] Git repo initialized (commit `13c448d`, 2026-11-11)
- [x] GitHub remote added (`pdtrhieu2008/code-fighter-oj`)
- [x] Pushed to GitHub (master)
- [x] TypeScript `tsc --noEmit` pass (sau khi fix 6 file contests)
- [x] Seed data hoàn chỉnh (4 bài toán + test cases + 27 belts + 3 system accounts)
- [x] End-to-end signup+login+submit test (2026-11-13: AC + WA + run + 401 anon + EXP idempotency)
- [x] Judge0 configured & E2E verified (WSL2 Docker, judge0.conf per-process limits, `JUDGE0_SANDBOX_OPTIONS`)
- [x] Admin panel E2E verified (2026-11-13: 6 trang 200 + tạo contest + PATCH status + 403 non-admin)
- [x] Contest system E2E verified (2026-11-13: POST /api/contests + detail page)

---

## 8. KNOWN ISSUES

1. **PostgreSQL password exposed in chat history** — khuyến nghị đổi mật khẩu database ngay
2. **Judge0 chưa có credentials thật** — submissions sẽ lỗi khi không có mock
3. **Middleware convention warning** — Next.js deprecation, chưa ảnh hưởng chức năng
4. **Git repo chưa tồn tại** — cần init trước khi push
5. **gh CLI not installed** — cần cài để dùng GitHub workflow thuận tiện

---

## 9. NOTES

- Repo root: `C:\Users\Hieu\.gemini\antigravity\scratch\code-fighter-oj`
- Git root ban đầu nhầm sang `C:\Users\Hieu` — cần init đúng trong thư mục dự án
- `.env.local` có credentials thật — KHÔNG được commit
- Dev server process ID: `proc_bc04797a4ab3`
- Test framework: Vitest (không dùng Jest)
- Editor: Monaco (VS Code editor trong browser)

---

**Người thực hiện:** Hermes AI Agent  
**Người giám sát:** Hieu  
**Workspace:** `C:\Users\Hieu\.gemini\antigravity\scratch\code-fighter-oj`
