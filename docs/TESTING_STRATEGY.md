# CODE FIGHTER OJ — TESTING STRATEGY & QUALITY ASSURANCE

## 1. Testing Philosophy
A competitive programming and online judge platform demands uncompromising accuracy. An erroneous verdict (e.g. grading correct code as WA, or leaking hidden tests) undermines user trust and institutional reputation.

Testing focuses on:
1. **Mathematical & Business Logic Correctness:** EXP idempotent award calculations, belt promotion eligibility rules, ICPC scoring & tie-breaking.
2. **Online Judge Integrity:** Sandboxed execution, timeout enforcement, memory capping, output comparison.
3. **Security Invariants:** Hidden testcase non-exposure, cross-tenant academy data isolation, role-based authorization.

---

## 2. Test Pyramid & Execution Framework

| Layer | Tools | Scope |
|---|---|---|
| **Unit Tests** | Vitest | Judge0 verdict mapping, output comparison, difficulty reward mapping, belt progression, ICPC scoring. |
| **Integration Tests** | Supertest + Test Containers | API endpoints (`/api/auth/*`, `/api/problems/*`, `/api/submissions/*`), Prisma transaction rollback tests. |
| **Security Tests** | Custom Security Harness | IDOR tests against hidden testcases, unlisted problems, and student exam attempts. |
| **End-to-End (E2E)** | Playwright | Full student solving flow: Login → Problem view → Write code → Run sandbox test → Submit → Receive AC verdict → EXP increment verified. |

---

## 3. Core Test Scenarios

### 3.1 Unit Test: Belt Progression Logic
```typescript
describe("Belt Progression Engine", () => {
  it("should not promote WHITE_I without meeting problem quota", () => {
    const userStats = { exp: 500, solvedEasy: 2, solvedMedium: 0 };
    const requirement = { minExp: 100, minEasy: 5 };
    expect(checkBeltEligibility(userStats, requirement)).toBe(false);
  });

  it("should calculate correct next belt across tier boundaries", () => {
    expect(getNextBelt("WHITE", "LEVEL_III")).toEqual({
      color: "YELLOW",
      level: "LEVEL_I"
    });
  });
});
```

### 2.1 Judge Unit Tests
- `pnpm test` checks Judge0 status mapping, output normalization, and difficulty reward values.
- Test unknown Judge0 status IDs as `SYSTEM_ERROR`; never accept an unknown execution state.
- Integration tests for API authorization, hidden-test confidentiality, and EXP transaction idempotency remain required before production.

### 2.2 Security Test: Hidden Testcase Privacy Invariant
- Query `GET /api/problems/:slug` as an unauthenticated GUEST.
- Assert that the response JSON does NOT contain any testcase where `isHidden === true`.
- Assert that sample testcases (`isSample === true`) only include sanitized input and output.

### 3.3 ICPC Contest Scoring Matrix
- Problem A: 1 WA at minute 10, AC at minute 25 -> Solved: 1, Penalty: 25 + 20 = 45 min.
- Problem B: 2 WA, unaccepted -> Solved: 0, Penalty: 0 min (no penalty for unsolved problems).
- Tie breaking: Most problems solved > Lowest penalty > Earliest last accepted timestamp.
