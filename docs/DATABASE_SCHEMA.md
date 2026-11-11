# CODE FIGHTER OJ — Database Schema Documentation

> **TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.**

**Version:** 1.0.0  
**Last Updated:** 2026-11-08  
**Database:** PostgreSQL 16  
**ORM:** Prisma 5.x

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Complete Prisma Schema](#3-complete-prisma-schema)
4. [Table Reference](#4-table-reference)
5. [Indexing Strategy](#5-indexing-strategy)
6. [Naming Conventions](#6-naming-conventions)
7. [Migration Notes](#7-migration-notes)

---

## 1. Schema Overview

The database is organized into logical groups:

| Group | Tables | Description |
|-------|--------|-------------|
| **Auth** | User, Account, Session, VerificationToken | NextAuth.js authentication |
| **Profile** | UserProfile, FighterProfile, Role, Permission, UserRole | User identity and RBAC |
| **Belt** | Belt, BeltLevel, BeltRequirement, UserBelt, BeltExamination, ExaminationAttempt, PromotionHistory | Belt progression system |
| **Problem** | Problem, ProblemVersion, ProblemTestCase, Tag, ProblemTag, ProblemEditorial | Problem library |
| **Judge** | Submission, JudgeJob, JudgeResult | Code execution pipeline |
| **Contest** | Contest, ContestProblem, ContestParticipant, ContestStanding | Competition system |
| **Group** | Group, GroupMember, GroupInvitation, GroupAssignment | Community groups |
| **Education** | Course, Lesson, Class, Enrollment, Assignment, AssignmentSubmission, InstructorFeedback | LMS features |
| **Gamification** | EXPTransaction, Achievement, UserAchievement, DailyActivity, UserStreak, Mission, UserMission | Engagement mechanics |
| **System** | Notification, AuditLog, SystemSetting | Platform infrastructure |

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o| UserProfile : "has"
    User ||--o| FighterProfile : "has"
    User ||--o{ UserRole : "assigned"
    Role ||--o{ UserRole : "assigned to"
    Role ||--o{ Permission : "has"

    FighterProfile ||--o| UserBelt : "current"
    UserBelt }o--|| BeltLevel : "at"
    BeltLevel }o--|| Belt : "of"
    Belt ||--o{ BeltLevel : "has"
    BeltLevel ||--o{ BeltRequirement : "requires"
    FighterProfile ||--o{ PromotionHistory : "has"

    BeltLevel ||--o{ BeltExamination : "has"
    BeltExamination ||--o{ ExaminationAttempt : "has"
    ExaminationAttempt }o--|| User : "by"

    Problem ||--o{ ProblemVersion : "has"
    Problem ||--o{ ProblemTestCase : "has"
    Problem ||--o{ ProblemTag : "has"
    Tag ||--o{ ProblemTag : "in"
    Problem ||--o| ProblemEditorial : "has"

    User ||--o{ Submission : "makes"
    Problem ||--o{ Submission : "has"
    Submission ||--o{ JudgeJob : "generates"
    JudgeJob ||--o| JudgeResult : "produces"

    Contest ||--o{ ContestProblem : "has"
    Contest ||--o{ ContestParticipant : "has"
    ContestParticipant ||--o| ContestStanding : "has"
    User ||--o{ ContestParticipant : "is"

    Group ||--o{ GroupMember : "has"
    Group ||--o{ GroupInvitation : "has"
    Group ||--o{ GroupAssignment : "has"

    Course ||--o{ Lesson : "has"
    Class ||--o{ Enrollment : "has"
    Class ||--o{ Assignment : "has"
    Assignment ||--o{ AssignmentSubmission : "has"
    AssignmentSubmission ||--o{ InstructorFeedback : "has"

    User ||--o{ EXPTransaction : "has"
    User ||--o{ UserAchievement : "has"
    Achievement ||--o{ UserAchievement : "earned by"
    User ||--o| UserStreak : "has"
    User ||--o{ DailyActivity : "has"
```

---

## 3. Complete Prisma Schema

```prisma
// prisma/schema.prisma
// CODE FIGHTER OJ — Full Database Schema
// Generated for PostgreSQL 16 via Prisma 5.x

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  EMAIL_UNVERIFIED
}

enum BeltColor {
  WHITE
  YELLOW
  ORANGE
  GREEN
  BLUE
  PURPLE
  BROWN
  RED
  BLACK
}

enum BeltLevelTier {
  I
  II
  III
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}

enum ProblemVisibility {
  PUBLIC
  PRIVATE
  CONTEST_ONLY
}

enum SubmissionVerdict {
  PENDING
  QUEUED
  JUDGING
  ACCEPTED
  WRONG_ANSWER
  TIME_LIMIT_EXCEEDED
  MEMORY_LIMIT_EXCEEDED
  RUNTIME_ERROR
  COMPILATION_ERROR
  INTERNAL_ERROR
  PARTIAL
}

enum ContestType {
  ICPC
  IOI
  CUSTOM
}

enum ContestStatus {
  DRAFT
  REGISTRATION_OPEN
  RUNNING
  ENDED
  RESULTS_FINAL
  CANCELLED
}

enum ContestVisibility {
  PUBLIC
  PRIVATE
  GROUP_ONLY
}

enum GroupVisibility {
  PUBLIC
  PRIVATE
  INVITE_ONLY
}

enum GroupRole {
  OWNER
  ADMIN
  MEMBER
}

enum AssignmentStatus {
  DRAFT
  PUBLISHED
  CLOSED
  GRADED
}

enum NotificationType {
  SUBMISSION_RESULT
  BELT_PROMOTION
  ACHIEVEMENT_UNLOCKED
  CONTEST_STARTING
  CLASS_ASSIGNMENT
  INSTRUCTOR_FEEDBACK
  SYSTEM_ANNOUNCEMENT
  FRIEND_REQUEST
}

enum ExaminationStatus {
  NOT_STARTED
  IN_PROGRESS
  PASSED
  FAILED
  EXPIRED
}

enum EXPSource {
  PROBLEM_SOLVED
  CONTEST_PARTICIPATION
  CONTEST_RANK_BONUS
  DAILY_MISSION
  ACHIEVEMENT
  BELT_EXAMINATION_BONUS
  ADMIN_GRANT
  STREAK_BONUS
}

enum AuditAction {
  USER_BANNED
  USER_ROLE_CHANGED
  PROBLEM_CREATED
  PROBLEM_EDITED
  PROBLEM_DELETED
  TEST_CASE_ACCESSED
  CONTEST_RESULT_MODIFIED
  BELT_MANUALLY_CHANGED
  ADMIN_LOGIN
  SUBMISSION_REJUDGED
}

// ============================================================
// AUTH GROUP (NextAuth.js compatible)
// ============================================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  status        UserStatus @default(EMAIL_UNVERIFIED)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts           Account[]
  sessions           Session[]
  profile            UserProfile?
  fighterProfile     FighterProfile?
  roles              UserRole[]
  submissions        Submission[]
  contestParticipants ContestParticipant[]
  groupMembers       GroupMember[]
  enrollments        Enrollment[]
  examinationAttempts ExaminationAttempt[]
  expTransactions    EXPTransaction[]
  userAchievements   UserAchievement[]
  streak             UserStreak?
  dailyActivities    DailyActivity[]
  notifications      Notification[]
  sentInvitations    GroupInvitation[]   @relation("InvitedBy")
  auditLogs          AuditLog[]          @relation("AuditActor")

  @@map("users")
  @@index([email])
  @@index([status])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================================
// PROFILE GROUP
// ============================================================

model UserProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  username     String   @unique
  bio          String?  @db.Text
  country      String?
  organization String?
  website      String?
  githubUrl    String?
  twitterUrl   String?
  avatarUrl    String?
  isPublic     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
  @@index([username])
}

model FighterProfile {
  id               String   @id @default(cuid())
  userId           String   @unique
  totalEXP         Int      @default(0)
  currentBeltEXP   Int      @default(0)
  problemsSolved   Int      @default(0)
  totalSubmissions Int      @default(0)
  contestRating    Int      @default(1200)
  rank             Int?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentBelt      UserBelt?
  promotionHistory PromotionHistory[]

  @@map("fighter_profiles")
  @@index([totalEXP])
  @@index([contestRating])
  @@index([problemsSolved])
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique // GUEST, REGISTERED_USER, STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN
  description String?
  permissions Permission[]
  userRoles   UserRole[]

  @@map("roles")
}

model Permission {
  id       String @id @default(cuid())
  resource String // e.g., "problem", "submission"
  action   String // e.g., "read", "create", "admin"
  roleId   String

  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([resource, action, roleId])
  @@map("permissions")
}

model UserRole {
  id        String    @id @default(cuid())
  userId    String
  roleId    String
  grantedAt DateTime  @default(now())
  expiresAt DateTime?
  grantedBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}

// ============================================================
// BELT GROUP
// ============================================================

model Belt {
  id          String    @id @default(cuid())
  color       BeltColor @unique
  displayName String
  description String?
  badgeUrl    String?
  sortOrder   Int       @unique

  levels BeltLevel[]

  @@map("belts")
}

model BeltLevel {
  id           String       @id @default(cuid())
  beltId       String
  tier         BeltLevelTier
  displayName  String       // e.g., "White Belt I"
  expRequired  Int          // EXP needed to unlock exam for this level
  sortOrder    Int          @unique

  belt         Belt              @relation(fields: [beltId], references: [id])
  requirements BeltRequirement[]
  userBelts    UserBelt[]
  examinations BeltExamination[]

  @@unique([beltId, tier])
  @@map("belt_levels")
  @@index([sortOrder])
}

model BeltRequirement {
  id              String @id @default(cuid())
  beltLevelId     String
  minProblemsSolved Int  @default(0)
  minContestCount  Int   @default(0)
  requiredTags    String[] // array of tag slugs
  description     String?

  beltLevel BeltLevel @relation(fields: [beltLevelId], references: [id])

  @@map("belt_requirements")
}

model UserBelt {
  id              String    @id @default(cuid())
  fighterProfileId String   @unique
  beltLevelId     String
  achievedAt      DateTime  @default(now())
  examinationId   String?

  fighterProfile FighterProfile @relation(fields: [fighterProfileId], references: [id], onDelete: Cascade)
  beltLevel      BeltLevel      @relation(fields: [beltLevelId], references: [id])

  @@map("user_belts")
}

model BeltExamination {
  id              String   @id @default(cuid())
  beltLevelId     String
  title           String
  description     String?  @db.Text
  timeLimitMins   Int      @default(120)
  passScore       Float    @default(0.7) // 70% pass rate
  maxAttempts     Int      @default(3)
  cooldownHours   Int      @default(24)
  problemIds      String[] // ordered list of problem IDs for this exam
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  beltLevel BeltLevel           @relation(fields: [beltLevelId], references: [id])
  attempts  ExaminationAttempt[]

  @@map("belt_examinations")
}

model ExaminationAttempt {
  id            String            @id @default(cuid())
  userId        String
  examinationId String
  status        ExaminationStatus @default(NOT_STARTED)
  startedAt     DateTime?
  submittedAt   DateTime?
  expiresAt     DateTime?
  score         Float?
  passed        Boolean?
  submissionIds String[]

  user        User            @relation(fields: [userId], references: [id])
  examination BeltExamination @relation(fields: [examinationId], references: [id])

  @@map("examination_attempts")
  @@index([userId, examinationId])
}

model PromotionHistory {
  id               String    @id @default(cuid())
  fighterProfileId String
  fromBeltLevelId  String?
  toBeltLevelId    String
  promotedAt       DateTime  @default(now())
  examinationScore Float?
  note             String?

  fighterProfile FighterProfile @relation(fields: [fighterProfileId], references: [id])

  @@map("promotion_history")
  @@index([fighterProfileId])
}

// ============================================================
// PROBLEM GROUP
// ============================================================

model Problem {
  id               String            @id @default(cuid())
  slug             String            @unique
  title            String
  difficulty       Difficulty
  visibility       ProblemVisibility @default(PUBLIC)
  statement        String            @db.Text  // Markdown
  inputFormat      String?           @db.Text
  outputFormat     String?           @db.Text
  constraints      String?           @db.Text
  notes            String?           @db.Text
  timeLimitMs      Int               @default(2000)
  memoryLimitKb    Int               @default(262144) // 256MB
  allowedLanguages String[]          // empty = all allowed
  authorId         String?
  currentVersionId String?
  acCount          Int               @default(0)
  submitCount      Int               @default(0)
  isPartialScoring Boolean           @default(false)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  versions    ProblemVersion[]
  testCases   ProblemTestCase[]
  tags        ProblemTag[]
  editorial   ProblemEditorial?
  submissions Submission[]
  contestProblems ContestProblem[]
  assignments AssignmentProblem[]

  @@map("problems")
  @@index([slug])
  @@index([difficulty])
  @@index([visibility])
  @@index([acCount])
}

model ProblemVersion {
  id          String   @id @default(cuid())
  problemId   String
  version     Int
  statement   String   @db.Text
  editedBy    String
  changeNote  String?
  createdAt   DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([problemId, version])
  @@map("problem_versions")
}

model ProblemTestCase {
  id         String  @id @default(cuid())
  problemId  String
  input      String  @db.Text
  output     String  @db.Text
  isSample   Boolean @default(false)
  isHidden   Boolean @default(true)
  points     Int     @default(0)  // for partial scoring subtasks
  sortOrder  Int     @default(0)
  note       String?

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("problem_test_cases")
  @@index([problemId, isSample])
}

model Tag {
  id          String       @id @default(cuid())
  slug        String       @unique
  name        String
  description String?
  color       String?      @default("#6366f1")

  problems ProblemTag[]

  @@map("tags")
}

model ProblemTag {
  problemId String
  tagId     String

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([problemId, tagId])
  @@map("problem_tags")
}

model ProblemEditorial {
  id          String   @id @default(cuid())
  problemId   String   @unique
  content     String   @db.Text  // Markdown
  authorId    String?
  unlocksAfter String? // "SOLVED" | "CONTEST_END" | "ALWAYS"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("problem_editorials")
}

// ============================================================
// JUDGE GROUP
// ============================================================

model Submission {
  id              String            @id @default(cuid())
  userId          String
  problemId       String
  contestId       String?
  assignmentId    String?
  examinationAttemptId String?
  language        String
  sourceCode      String            @db.Text
  verdict         SubmissionVerdict @default(PENDING)
  score           Float?
  timeMs          Int?
  memoryKb        Int?
  compilerMessage String?           @db.Text
  isPublic        Boolean           @default(false)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user    User    @relation(fields: [userId], references: [id])
  problem Problem @relation(fields: [problemId], references: [id])
  jobs    JudgeJob[]

  @@map("submissions")
  @@index([userId])
  @@index([problemId])
  @@index([contestId])
  @@index([verdict])
  @@index([createdAt])
}

model JudgeJob {
  id           String   @id @default(cuid())
  submissionId String
  testCaseId   String?
  judge0Token  String?
  status       String   @default("PENDING")
  stdout       String?  @db.Text
  stderr       String?  @db.Text
  timeMs       Int?
  memoryKb     Int?
  exitCode     Int?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  submission Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  result     JudgeResult?

  @@map("judge_jobs")
  @@index([submissionId])
  @@index([judge0Token])
}

model JudgeResult {
  id         String   @id @default(cuid())
  jobId      String   @unique
  verdict    SubmissionVerdict
  timeMs     Int?
  memoryKb   Int?
  points     Int      @default(0)
  createdAt  DateTime @default(now())

  job JudgeJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@map("judge_results")
}

// ============================================================
// CONTEST GROUP
// ============================================================

model Contest {
  id               String            @id @default(cuid())
  slug             String            @unique
  title            String
  description      String?           @db.Text
  type             ContestType       @default(ICPC)
  status           ContestStatus     @default(DRAFT)
  visibility       ContestVisibility @default(PUBLIC)
  groupId          String?
  startTime        DateTime
  endTime          DateTime
  registrationOpen DateTime?
  registrationClose DateTime?
  isRated          Boolean           @default(true)
  freezeStandingsAt DateTime?
  createdBy        String
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  problems     ContestProblem[]
  participants ContestParticipant[]

  @@map("contests")
  @@index([status])
  @@index([startTime])
  @@index([visibility])
}

model ContestProblem {
  contestId   String
  problemId   String
  label       String  // A, B, C, D...
  points      Int     @default(100)
  sortOrder   Int

  contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id])

  @@id([contestId, problemId])
  @@map("contest_problems")
}

model ContestParticipant {
  id           String   @id @default(cuid())
  contestId    String
  userId       String
  registeredAt DateTime @default(now())
  isVirtual    Boolean  @default(false)

  contest  Contest        @relation(fields: [contestId], references: [id])
  user     User           @relation(fields: [userId], references: [id])
  standing ContestStanding?

  @@unique([contestId, userId])
  @@map("contest_participants")
}

model ContestStanding {
  id              String @id @default(cuid())
  participantId   String @unique
  rank            Int?
  score           Float  @default(0)
  penalty         Int    @default(0) // ICPC: total penalty minutes
  solvedCount     Int    @default(0)
  ratingDelta     Int?

  participant ContestParticipant @relation(fields: [participantId], references: [id])

  @@map("contest_standings")
}

// ============================================================
// GROUP GROUP
// ============================================================

model Group {
  id          String          @id @default(cuid())
  slug        String          @unique
  name        String
  description String?         @db.Text
  avatarUrl   String?
  visibility  GroupVisibility @default(PUBLIC)
  ownerId     String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  members     GroupMember[]
  invitations GroupInvitation[]
  assignments GroupAssignment[]

  @@map("groups")
  @@index([slug])
  @@index([ownerId])
}

model GroupMember {
  id       String    @id @default(cuid())
  groupId  String
  userId   String
  role     GroupRole @default(MEMBER)
  joinedAt DateTime  @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
  @@map("group_members")
}

model GroupInvitation {
  id        String    @id @default(cuid())
  groupId   String
  code      String    @unique @default(cuid())
  invitedBy String
  expiresAt DateTime?
  maxUses   Int?
  useCount  Int       @default(0)
  createdAt DateTime  @default(now())

  group     Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  inviter   User  @relation("InvitedBy", fields: [invitedBy], references: [id])

  @@map("group_invitations")
}

model GroupAssignment {
  id        String   @id @default(cuid())
  groupId   String
  contestId String?
  courseId  String?
  createdAt DateTime @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@map("group_assignments")
}

// ============================================================
// EDUCATION GROUP
// ============================================================

model Course {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?  @db.Text
  thumbnailUrl String?
  authorId    String
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lessons Lesson[]
  classes Class[]

  @@map("courses")
}

model Lesson {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  content     String?  @db.Text  // Markdown or embed URL
  videoUrl    String?
  sortOrder   Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@map("lessons")
  @@index([courseId, sortOrder])
}

model Class {
  id          String    @id @default(cuid())
  slug        String    @unique
  name        String
  courseId    String?
  instructorId String
  description String?   @db.Text
  startDate   DateTime?
  endDate     DateTime?
  isActive    Boolean   @default(true)
  inviteCode  String    @unique @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  course      Course?      @relation(fields: [courseId], references: [id])
  enrollments Enrollment[]
  assignments Assignment[]

  @@map("classes")
}

model Enrollment {
  id         String   @id @default(cuid())
  classId    String
  userId     String
  enrolledAt DateTime @default(now())
  isActive   Boolean  @default(true)

  class Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([classId, userId])
  @@map("enrollments")
}

model Assignment {
  id          String           @id @default(cuid())
  classId     String
  title       String
  description String?          @db.Text
  dueDate     DateTime?
  maxPoints   Int              @default(100)
  status      AssignmentStatus @default(DRAFT)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  class       Class               @relation(fields: [classId], references: [id], onDelete: Cascade)
  problems    AssignmentProblem[]
  submissions AssignmentSubmission[]

  @@map("assignments")
  @@index([classId])
}

model AssignmentProblem {
  assignmentId String
  problemId    String
  points       Int    @default(100)
  sortOrder    Int

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  problem    Problem    @relation(fields: [problemId], references: [id])

  @@id([assignmentId, problemId])
  @@map("assignment_problems")
}

model AssignmentSubmission {
  id              String   @id @default(cuid())
  assignmentId    String
  userId          String
  submissionId    String?  // FK to Submission
  score           Float?
  isGraded        Boolean  @default(false)
  submittedAt     DateTime @default(now())

  assignment Assignment        @relation(fields: [assignmentId], references: [id])
  feedback   InstructorFeedback[]

  @@map("assignment_submissions")
  @@index([assignmentId, userId])
}

model InstructorFeedback {
  id                   String   @id @default(cuid())
  assignmentSubmissionId String
  instructorId         String
  content              String   @db.Text
  score                Float?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  assignmentSubmission AssignmentSubmission @relation(fields: [assignmentSubmissionId], references: [id])

  @@map("instructor_feedback")
}

// ============================================================
// GAMIFICATION GROUP
// ============================================================

model EXPTransaction {
  id        String    @id @default(cuid())
  userId    String
  amount    Int
  source    EXPSource
  sourceId  String?   // FK to the source (submissionId, etc.)
  note      String?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("exp_transactions")
  @@index([userId])
  @@index([createdAt])
}

model Achievement {
  id          String  @id @default(cuid())
  slug        String  @unique
  name        String
  description String
  iconUrl     String?
  expReward   Int     @default(0)
  rarity      String  @default("COMMON") // COMMON, RARE, EPIC, LEGENDARY
  condition   Json    // { type: "PROBLEMS_SOLVED", threshold: 100 }

  userAchievements UserAchievement[]

  @@map("achievements")
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String
  earnedAt      DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id])
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
  @@map("user_achievements")
}

model DailyActivity {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  acCount   Int      @default(0)
  submitCount Int    @default(0)
  expEarned Int      @default(0)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, date])
  @@map("daily_activities")
  @@index([userId, date])
}

model UserStreak {
  id              String   @id @default(cuid())
  userId          String   @unique
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastActiveDate  DateTime?

  user User @relation(fields: [userId], references: [id])

  @@map("user_streaks")
}

model Mission {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  expReward   Int
  condition   Json     // { type: "SOLVE_BY_TAG", tag: "dp", count: 1 }
  resetPeriod String   @default("DAILY") // DAILY | WEEKLY | ONE_TIME
  isActive    Boolean  @default(true)

  userMissions UserMission[]

  @@map("missions")
}

model UserMission {
  id          String    @id @default(cuid())
  userId      String
  missionId   String
  progress    Int       @default(0)
  completed   Boolean   @default(false)
  completedAt DateTime?
  periodDate  DateTime  @db.Date

  mission Mission @relation(fields: [missionId], references: [id])

  @@unique([userId, missionId, periodDate])
  @@map("user_missions")
}

// ============================================================
// SYSTEM GROUP
// ============================================================

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  link      String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
  @@index([userId, isRead])
  @@index([createdAt])
}

model AuditLog {
  id        String      @id @default(cuid())
  actorId   String?
  action    AuditAction
  targetType String?    // "USER", "PROBLEM", "SUBMISSION"
  targetId  String?
  metadata  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime    @default(now())

  actor User? @relation("AuditActor", fields: [actorId], references: [id])

  @@map("audit_logs")
  @@index([actorId])
  @@index([action])
  @@index([createdAt])
}

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  type      String   @default("STRING") // STRING | INT | BOOL | JSON
  note      String?
  updatedBy String?
  updatedAt DateTime @updatedAt

  @@map("system_settings")
}
```

---

## 4. Table Reference

### Auth Tables

| Table | Primary Key | Key Columns | Purpose |
|-------|------------|-------------|---------|
| `users` | `id` (cuid) | `email`, `status` | Core user record |
| `accounts` | `id` | `provider`, `providerAccountId` | OAuth provider links |
| `sessions` | `id` | `sessionToken`, `userId` | Active user sessions |
| `verification_tokens` | — | `identifier`, `token` | Email verification |

### Profile Tables

| Table | Primary Key | Key Columns | Purpose |
|-------|------------|-------------|---------|
| `user_profiles` | `id` | `username`, `userId` | Display profile |
| `fighter_profiles` | `id` | `userId`, `totalEXP`, `rank` | Competitive stats |
| `roles` | `id` | `name` | RBAC roles |
| `permissions` | `id` | `resource`, `action`, `roleId` | Granular permissions |
| `user_roles` | `id` | `userId`, `roleId` | Role assignments |

### Belt Tables

| Table | Primary Key | Key Columns | Purpose |
|-------|------------|-------------|---------|
| `belts` | `id` | `color`, `sortOrder` | 9 belt colors |
| `belt_levels` | `id` | `beltId`, `tier`, `sortOrder` | 27 belt levels (3 per color) |
| `belt_requirements` | `id` | `beltLevelId` | Qualification criteria |
| `user_belts` | `id` | `fighterProfileId` (unique) | Current belt per user |
| `belt_examinations` | `id` | `beltLevelId`, `isActive` | Exam definitions |
| `examination_attempts` | `id` | `userId`, `examinationId` | Exam attempt records |
| `promotion_history` | `id` | `fighterProfileId` | Belt promotion log |

---

## 5. Indexing Strategy

### Critical Performance Indexes

```sql
-- Leaderboard queries (most common heavy read)
CREATE INDEX idx_fighter_profiles_rank ON fighter_profiles (total_exp DESC, problems_solved DESC);
CREATE INDEX idx_fighter_profiles_contest_rating ON fighter_profiles (contest_rating DESC);

-- Submission history (high volume)
CREATE INDEX idx_submissions_user_created ON submissions (user_id, created_at DESC);
CREATE INDEX idx_submissions_problem_verdict ON submissions (problem_id, verdict);

-- Problem listing (paginated, filtered)
CREATE INDEX idx_problems_visibility_difficulty ON problems (visibility, difficulty);
CREATE INDEX idx_problems_ac_rate ON problems (ac_count, submit_count);

-- Contest standings (real-time reads)
CREATE INDEX idx_contest_standings_rank ON contest_standings (rank ASC);

-- Notifications (inbox polling)
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- EXP transactions (profile page)
CREATE INDEX idx_exp_transactions_user_created ON exp_transactions (user_id, created_at DESC);
```

---

## 6. Naming Conventions

| Convention | Rule | Example |
|-----------|------|---------|
| Table names | `snake_case`, plural | `user_profiles` |
| Column names | `snake_case` | `created_at`, `fighter_profile_id` |
| Primary keys | `id` (cuid string) | `"clr1abc..."` |
| Foreign keys | `{entity}Id` (Prisma) → `{entity}_id` (DB) | `userId` → `user_id` |
| Enum values | `SCREAMING_SNAKE_CASE` | `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED` |
| Boolean columns | `is_` prefix | `is_active`, `is_public`, `is_read` |
| Timestamp columns | `created_at`, `updated_at` | — |

---

## 7. Migration Notes

### Initial Seed Data

The following seed data is required before the application can function:

1. **Belt colors** (9 records) with display names and sort orders.
2. **Belt levels** (27 records: 9 colors × 3 tiers) with EXP thresholds.
3. **Belt requirements** per level.
4. **Roles** (6 records): GUEST, REGISTERED_USER, STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN.
5. **Permissions** mapped to roles.
6. **System settings**: default judge timeout, EXP multipliers, rate limits.
7. **Tags**: common algorithm tags (DP, Graph, Greedy, etc.).
8. **Achievements**: starter achievement set.
9. **Missions**: initial daily mission pool.

### Migration Commands

```bash
# Apply all pending migrations
pnpm prisma migrate deploy

# Generate Prisma client after schema change
pnpm prisma generate

# Seed the database
pnpm prisma db seed

# Reset DB (dev only!)
pnpm prisma migrate reset
```

### Versioning Policy

- All schema changes go through Prisma migrations.
- Migrations are named descriptively: `YYYYMMDD_HHMMSS_description`.
- Destructive migrations require a maintenance window.
- Production migrations are applied with zero-downtime patterns (additive changes only in hot deploys; column drops deferred).
