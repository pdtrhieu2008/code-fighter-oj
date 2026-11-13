import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  const role = current?.role;
  if (!role || (role !== Role.ADMIN && role !== Role.SUPER_ADMIN)) {
    throw new Error("FORBIDDEN");
  }
  return { ...user, role };
}

export async function requireInstructorOrAdmin() {
  const user = await requireAuth();
  const role = (user as any).role as Role;
  if (
    !role ||
    (role !== Role.INSTRUCTOR &&
      role !== Role.ADMIN &&
      role !== Role.SUPER_ADMIN)
  ) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
