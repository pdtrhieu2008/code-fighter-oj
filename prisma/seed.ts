import { PrismaClient, Role, BeltColor, BeltLevel, Difficulty, Visibility } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CODE FIGHTER OJ database...");

  // 1. Belt Requirements for all 27 belt states
  const beltColors: BeltColor[] = [
    "WHITE",
    "YELLOW",
    "ORANGE",
    "GREEN",
    "BLUE",
    "PURPLE",
    "BROWN",
    "RED",
    "BLACK",
  ];
  const beltLevels: BeltLevel[] = ["LEVEL_I", "LEVEL_II", "LEVEL_III"];

  console.log("Generating 27 Belt Requirements...");
  let orderIndex = 0;
  for (const color of beltColors) {
    for (const level of beltLevels) {
      orderIndex++;
      const minExp = (orderIndex - 1) * 200;
      const minSolved = (orderIndex - 1) * 3;
      const minEasy = Math.min(minSolved, 15);
      const minMedium = orderIndex > 6 ? (orderIndex - 6) * 2 : 0;
      const minHard = orderIndex > 15 ? (orderIndex - 15) : 0;
      const requiresExam = level === "LEVEL_III"; // Require exam to graduate to next belt tier

      await prisma.beltRequirement.upsert({
        where: {
          beltColor_beltLevel: {
            beltColor: color,
            beltLevel: level,
          },
        },
        update: {},
        create: {
          beltColor: color,
          beltLevel: level,
          minExp,
          minSolvedProblems: minSolved,
          minEasyProblems: minEasy,
          minMediumProblems: minMedium,
          minHardProblems: minHard,
          requiresExamination: requiresExam,
          minContestParticipation: orderIndex > 9 ? 1 : 0,
          requiredTags: JSON.stringify([]),
        },
      });
    }
  }

  // 2. Tags
  const defaultTags = [
    { name: "Cơ Bản (Fundamentals)", slug: "fundamentals", color: "#64748B" },
    { name: "Mảng (Arrays)", slug: "arrays", color: "#3B82F6" },
    { name: "Chuỗi (Strings)", slug: "strings", color: "#06B6D4" },
    { name: "Sắp Xếp (Sorting)", slug: "sorting", color: "#10B981" },
    { name: "Tìm Kiếm Nhị Phân (Binary Search)", slug: "binary-search", color: "#84CC16" },
    { name: "Hai Con Trỏ (Two Pointers)", slug: "two-pointers", color: "#EAB308" },
    { name: "Quy Hoạch Động (Dynamic Programming)", slug: "dp", color: "#F97316" },
    { name: "Tham Lam (Greedy)", slug: "greedy", color: "#EC4899" },
    { name: "Đồ Thị (Graph Theory)", slug: "graphs", color: "#8B5CF6" },
    { name: "Cây Đoạn (Segment Tree)", slug: "segment-tree", color: "#E11D48" },
    { name: "Toán Học (Math)", slug: "math", color: "#14B8A6" },
  ];

  console.log("Seeding Tags...");
  const createdTags: Record<string, string> = {};
  for (const t of defaultTags) {
    const tag = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        name: t.name,
        slug: t.slug,
        color: t.color,
        description: `Các bài tập về ${t.name}`,
      },
    });
    createdTags[t.slug] = tag.id;
  }

  // 3. System Accounts
  console.log("Seeding System Accounts...");
  const adminHashedPassword = await bcrypt.hash("Admin@123", 10);
  const instructorHashedPassword = await bcrypt.hash("Instructor@123", 10);
  const studentHashedPassword = await bcrypt.hash("Student@123", 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@codefighter.local" },
    update: {},
    create: {
      email: "admin@codefighter.local",
      hashedPassword: adminHashedPassword,
      role: Role.SUPER_ADMIN,
      userProfile: {
        create: {
          fullName: "Spartan Headmaster",
          bio: "Tổng Chỉ Huy Hệ Thống Code Fighter OJ. Huấn luyện viên trưởng.",
        },
      },
      fighterProfile: {
        create: {
          fighterId: "CF-000001",
          username: "admin_spartan",
          totalExp: 99999,
          rating: 2800,
          totalSolved: 500,
          acceptedSubmissions: 480,
          totalSubmissions: 550,
          currentStreak: 120,
          longestStreak: 120,
          profileVisibility: Visibility.PUBLIC,
        },
      },
      userBelts: {
        create: {
          beltColor: "BLACK",
          beltLevel: "LEVEL_III",
          notes: "Đại Sư Phụ - Black Belt Level III",
        },
      },
    },
  });

  // Instructor User
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@codefighter.local" },
    update: {},
    create: {
      email: "instructor@codefighter.local",
      hashedPassword: instructorHashedPassword,
      role: Role.INSTRUCTOR,
      userProfile: {
        create: {
          fullName: "Master Leet",
          bio: "Giảng viên chuyên đề C++ và Quy hoạch động nâng cao.",
        },
      },
      fighterProfile: {
        create: {
          fighterId: "CF-000002",
          username: "sensei_leet",
          totalExp: 25000,
          rating: 2150,
          totalSolved: 320,
          acceptedSubmissions: 310,
          totalSubmissions: 400,
          currentStreak: 45,
          longestStreak: 80,
          profileVisibility: Visibility.PUBLIC,
        },
      },
      userBelts: {
        create: {
          beltColor: "RED",
          beltLevel: "LEVEL_II",
          notes: "Huấn luyện viên Red Belt II",
        },
      },
    },
  });

  // Sample Student User
  const student = await prisma.user.upsert({
    where: { email: "student@codefighter.local" },
    update: {},
    create: {
      email: "student@codefighter.local",
      hashedPassword: studentHashedPassword,
      role: Role.STUDENT,
      userProfile: {
        create: {
          fullName: "Nguyễn Võ Hiệp Sĩ",
          bio: "Võ sĩ lập trình khóa THPTQG 2026. Quyết tâm lấy đai đen!",
        },
      },
      fighterProfile: {
        create: {
          fighterId: "CF-000003",
          username: "fighter_kid",
          totalExp: 450,
          rating: 1350,
          totalSolved: 12,
          acceptedSubmissions: 12,
          totalSubmissions: 20,
          currentStreak: 5,
          longestStreak: 14,
          profileVisibility: Visibility.PUBLIC,
        },
      },
      userBelts: {
        create: {
          beltColor: "WHITE",
          beltLevel: "LEVEL_I",
          notes: "Tân binh gia nhập học viện.",
        },
      },
    },
  });

  // 4. Sample Problems & Test Cases
  console.log("Seeding Problems and Test Cases...");
  const sampleProblems = [
    {
      slug: "cf-hello-fighter",
      title: "Chào Sân Đấu: Hello Fighter",
      difficulty: Difficulty.BEGINNER,
      visibility: Visibility.PUBLIC,
      timeLimit: 1000,
      memoryLimit: 131072,
      statement: `### Mô tả bài toán
Chào mừng bạn đến với võ đài **CODE FIGHTER OJ**!
Để kiểm tra trình độ cơ bản và hệ thống chấm, hãy viết chương trình in ra lời chào dành cho các đấu thủ.

### Yêu cầu
In ra dòng chữ: \`TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.\``,
      inputFormat: "Không có dữ liệu đầu vào.",
      outputFormat: "In ra đúng thông điệp trên một dòng duy nhất.",
      constraints: "Không có ràng buộc.",
      examples: [
        {
          input: "",
          output: "TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.",
          explanation: "In ra chính xác từng ký tự.",
        },
      ],
      tagSlugs: ["fundamentals"],
      testCases: [
        {
          inputData: "",
          outputData: "TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.\n",
          isSample: true,
          isHidden: false,
          points: 10,
        },
        {
          inputData: "\n",
          outputData: "TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION.\n",
          isSample: false,
          isHidden: true,
          points: 90,
        },
      ],
    },
    {
      slug: "cf-tong-hai-so",
      title: "Tổng Hai Số Nguyên",
      difficulty: Difficulty.BEGINNER,
      visibility: Visibility.PUBLIC,
      timeLimit: 1000,
      memoryLimit: 131072,
      statement: `### Mô tả
Cho hai số nguyên $a$ và $b$. Hãy tính tổng $a + b$.

### Đầu vào
Một dòng chứa hai số nguyên $a, b$ cách nhau bởi dấu cách.

### Đầu ra
In ra một số nguyên duy nhất là giá trị của $a + b$.`,
      inputFormat: "Hai số nguyên a, b (-10^9 <= a, b <= 10^9)",
      outputFormat: "Tổng a + b",
      constraints: "$-10^9 \\le a, b \\le 10^9$",
      examples: [
        {
          input: "5 7",
          output: "12",
          explanation: "5 + 7 = 12",
        },
        {
          input: "-3 10",
          output: "7",
          explanation: "-3 + 10 = 7",
        },
      ],
      tagSlugs: ["fundamentals", "math"],
      testCases: [
        { inputData: "5 7\n", outputData: "12\n", isSample: true, isHidden: false, points: 20 },
        { inputData: "0 0\n", outputData: "0\n", isSample: false, isHidden: false, points: 20 },
        { inputData: "1000000000 1000000000\n", outputData: "2000000000\n", isSample: false, isHidden: true, points: 30 },
        { inputData: "-1000000000 500000000\n", outputData: "-500000000\n", isSample: false, isHidden: true, points: 30 },
      ],
    },
    {
      slug: "cf-tim-kiem-nhi-phan",
      title: "Tìm Kiếm Nhị Phân Cơ Bản",
      difficulty: Difficulty.EASY,
      visibility: Visibility.PUBLIC,
      timeLimit: 1000,
      memoryLimit: 262144,
      statement: `### Mô tả
Cho dãy số nguyên gồm $N$ phần tử đã được sắp xếp tăng dần $A_1, A_2, ..., A_N$ và số nguyên $X$.
Hãy xác định xem số $X$ có xuất hiện trong dãy hay không. Nếu có in ra vị trí xuất hiện đầu tiên (chỉ số 1), nếu không in ra -1.`,
      inputFormat: "Dòng đầu chứa N và X. Dòng thứ hai chứa N số nguyên.",
      outputFormat: "Vị trí chỉ số 1 hoặc -1",
      constraints: "$1 \\le N \\le 10^5, -10^9 \\le A_i, X \\le 10^9$",
      examples: [
        {
          input: "5 4\n1 2 4 4 6",
          output: "3",
          explanation: "Số 4 xuất hiện đầu tiên tại vị trí 3.",
        },
      ],
      tagSlugs: ["binary-search", "arrays"],
      testCases: [
        { inputData: "5 4\n1 2 4 4 6\n", outputData: "3\n", isSample: true, isHidden: false, points: 30 },
        { inputData: "3 99\n1 2 3\n", outputData: "-1\n", isSample: false, isHidden: false, points: 30 },
        { inputData: "1 5\n5\n", outputData: "1\n", isSample: false, isHidden: true, points: 40 },
      ],
    },
    {
      slug: "cf-day-con-tang-dai-nhat",
      title: "Dãy Con Tăng Dài Nhất (LIS)",
      difficulty: Difficulty.MEDIUM,
      visibility: Visibility.PUBLIC,
      timeLimit: 2000,
      memoryLimit: 262144,
      statement: `### Mô tả
Cho dãy số nguyên $A = (A_1, A_2, ..., A_N)$.
Một dãy con của $A$ là dãy thu được bằng cách xóa đi 0 hoặc nhiều phần tử và giữ nguyên thứ tự tương đối.
Hãy tìm độ dài của dãy con tăng nghiêm ngặt dài nhất.`,
      inputFormat: "Dòng đầu chứa N. Dòng thứ hai chứa N số nguyên.",
      outputFormat: "Một số nguyên duy nhất là độ dài LIS.",
      constraints: "$1 \\le N \\le 2000, -10^9 \\le A_i \\le 10^9$",
      examples: [
        {
          input: "6\n1 2 5 3 4 7",
          output: "5",
          explanation: "Dãy con tăng dài nhất là 1, 2, 3, 4, 7 (độ dài 5).",
        },
      ],
      tagSlugs: ["dp", "arrays"],
      testCases: [
        { inputData: "6\n1 2 5 3 4 7\n", outputData: "5\n", isSample: true, isHidden: false, points: 40 },
        { inputData: "5\n5 4 3 2 1\n", outputData: "1\n", isSample: false, isHidden: true, points: 60 },
      ],
    },
  ];

  for (const p of sampleProblems) {
    const problem = await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        statement: p.statement,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints: p.constraints,
        examples: p.examples,
        difficulty: p.difficulty,
        visibility: p.visibility,
        timeLimit: p.timeLimit,
        memoryLimit: p.memoryLimit,
        supportedLanguages: ["CPP17", "CPP20", "PYTHON3", "JAVA"],
        authorId: admin.id,
      },
    });

    // Attach tags
    for (const tagSlug of p.tagSlugs) {
      if (createdTags[tagSlug]) {
        await prisma.problemTag.upsert({
          where: {
            problemId_tagId: {
              problemId: problem.id,
              tagId: createdTags[tagSlug],
            },
          },
          update: {},
          create: {
            problemId: problem.id,
            tagId: createdTags[tagSlug],
          },
        });
      }
    }

    // Attach test cases
    let testOrder = 1;
    for (const tc of p.testCases) {
      await prisma.problemTestCase.create({
        data: {
          problemId: problem.id,
          inputData: tc.inputData,
          outputData: tc.outputData,
          isSample: tc.isSample,
          isHidden: tc.isHidden,
          points: tc.points,
          orderIndex: testOrder++,
        },
      });
    }
  }

  // 5. Default Achievements
  console.log("Seeding Achievements...");
  const defaultAchievements = [
    {
      slug: "first-blood",
      name: "First Blood (Chiến Công Đầu)",
      description: "Giải thành công bài toán lập trình đầu tiên trên Code Fighter OJ.",
      category: "TRAINING",
      points: 10,
    },
    {
      slug: "century-fighter",
      name: "Century Fighter (Võ Sĩ Bách Chiến)",
      description: "Giải thành công 100 bài toán khác nhau trên đấu trường.",
      category: "MILESTONE",
      points: 100,
    },
    {
      slug: "spartan-streak-7",
      name: "Kỷ Luật Thép: 7 Ngày",
      description: "Duy trì chuỗi luyện tập liên tục trong 7 ngày.",
      category: "DISCIPLINE",
      points: 50,
    },
    {
      slug: "contest-gladiator",
      name: "Võ Sĩ Giác Đấu",
      description: "Tham gia giải đấu thi đấu trực tiếp đầu tiên.",
      category: "CONTEST",
      points: 25,
    },
  ];

  for (const a of defaultAchievements) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        name: a.name,
        description: a.description,
        category: a.category,
        points: a.points,
      },
    });
  }

  // 6. System Settings
  console.log("Seeding System Settings...");
  const defaultSettings = [
    { key: "SITE_NAME", value: { name: "CODE FIGHTER OJ" }, description: "Tên thương hiệu nền tảng" },
    { key: "TAGLINE", value: { text: "TRAIN LIKE A FIGHTER. CODE LIKE A CHAMPION." }, description: "Slogan chính thức" },
    { key: "DEFAULT_EXP_EASY", value: { exp: 10 }, description: "EXP bài tập Dễ" },
    { key: "DEFAULT_EXP_MEDIUM", value: { exp: 25 }, description: "EXP bài tập Trung Bình" },
    { key: "DEFAULT_EXP_HARD", value: { exp: 50 }, description: "EXP bài tập Khó" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
        description: s.description,
      },
    });
  }

  console.log("Seeding completed successfully! 🥋");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
