import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role, Visibility } from "@prisma/client";
import { formatFighterId } from "@/lib/utils";

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase(),
  username: z
    .string()
    .min(3, "Tên võ sĩ tối thiểu 3 ký tự")
    .max(20, "Tên võ sĩ tối đa 20 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tên võ sĩ chỉ chứa chữ cái, số và dấu gạch dưới"),
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      const firstError = (validated.error as any).issues?.[0]?.message || "Dữ liệu không hợp lệ";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { email, username, fullName, password } = validated.data;

    // Check existing email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng bởi một võ sĩ khác" },
        { status: 400 }
      );
    }

    // Check existing username
    const existingUsername = await prisma.fighterProfile.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Tên võ sĩ (username) này đã tồn tại" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Compute next fighter ID sequentially
    const fighterCount = await prisma.fighterProfile.count();
    const fighterId = formatFighterId(fighterCount + 1);

    // Transaction to create all related records atomically
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          hashedPassword,
          role: Role.REGISTERED_USER,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          fullName,
        },
      });

      const fighter = await tx.fighterProfile.create({
        data: {
          userId: user.id,
          fighterId,
          username: username.toLowerCase(),
          totalExp: 0,
          rating: 1200,
          profileVisibility: Visibility.PUBLIC,
        },
      });

      await tx.userStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
        },
      });

      return {
        id: user.id,
        email: user.email,
        username: fighter.username,
        fighterId: fighter.fighterId,
      };
    });

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản võ sĩ thành công!",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
