import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

/** Chỉ các trường hồ sơ hiển thị. Không cho đổi email, mật khẩu, EXP, rating qua route này. */
const profileSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(120).optional(),
  website: z.string().trim().max(200).optional(),
  githubHandle: z.string().trim().max(80).optional(),
  twitterHandle: z.string().trim().max(80).optional(),
});

const emptyToNull = (value: string | undefined) =>
  value === undefined ? undefined : value.length === 0 ? null : value;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const parsed = profileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu hồ sơ không hợp lệ." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, userProfile: { select: { fullName: true, bio: true, location: true, website: true, githubHandle: true, twitterHandle: true } } },
    });
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy học viên." }, { status: 404 });
    }

    const data = {
      fullName: emptyToNull(parsed.data.fullName),
      bio: emptyToNull(parsed.data.bio),
      location: emptyToNull(parsed.data.location),
      website: emptyToNull(parsed.data.website),
      githubHandle: emptyToNull(parsed.data.githubHandle),
      twitterHandle: emptyToNull(parsed.data.twitterHandle),
    };
    // Bỏ các trường không gửi lên để không ghi đè dữ liệu hiện có bằng null.
    const patch = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.upsert({
        where: { userId: id },
        update: patch,
        create: { userId: id, ...patch },
        select: { fullName: true, bio: true, location: true, website: true, githubHandle: true, twitterHandle: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "STUDENT_PROFILE_UPDATE",
          targetType: "User",
          targetId: id,
          metadata: { previous: target.userProfile, next: profile },
        },
      });
      return profile;
    });

    return NextResponse.json({ message: "Đã cập nhật hồ sơ học viên.", profile: updated });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
    }
    console.error("Admin profile update error:", error);
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ học viên." }, { status: 500 });
  }
}
