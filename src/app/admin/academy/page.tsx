import React from "react";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { AcademyManager, type ClassRow, type CourseOption, type InstructorOption } from "./AcademyManager";

export const dynamic = "force-dynamic";

export default async function AdminAcademyPage() {
  const [classes, courses, instructors] = await Promise.all([
    prisma.class.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        instructor: {
          select: {
            id: true,
            userProfile: { select: { fullName: true } },
            fighterProfile: { select: { username: true } },
          },
        },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                userProfile: { select: { fullName: true } },
                fighterProfile: { select: { username: true, fighterId: true } },
              },
            },
          },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, status: true, level: true },
    }),
    prisma.user.findMany({
      where: { role: { in: [Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN] } },
      select: {
        id: true,
        email: true,
        userProfile: { select: { fullName: true } },
        fighterProfile: { select: { username: true } },
      },
    }),
  ]);

  const classRows: ClassRow[] = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    description: cls.description ?? null,
    startDate: cls.startDate?.toISOString() ?? null,
    endDate: cls.endDate?.toISOString() ?? null,
    maxStudents: cls.maxStudents,
    createdAt: cls.createdAt.toISOString(),
    course: cls.course ? { id: cls.course.id, title: cls.course.title } : null,
    instructor: cls.instructor
      ? {
          fullName: cls.instructor.userProfile?.fullName ?? null,
          username: cls.instructor.fighterProfile?.username ?? null,
        }
      : null,
    enrollments: cls.enrollments.map((en) => ({
      id: en.id,
      status: en.status,
      enrolledAt: en.enrolledAt.toISOString(),
      completedAt: en.completedAt?.toISOString() ?? null,
      email: en.user.email,
      fullName: en.user.userProfile?.fullName ?? null,
      username: en.user.fighterProfile?.username ?? null,
      fighterId: en.user.fighterProfile?.fighterId ?? null,
    })),
  }));

  const courseOptions: CourseOption[] = courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    level: course.level,
  }));

  const instructorOptions: InstructorOption[] = instructors.map((user) => ({
    id: user.id,
    email: user.email,
    fullName: user.userProfile?.fullName ?? null,
    username: user.fighterProfile?.username ?? null,
  }));

  return <AcademyManager classes={classRows} courses={courseOptions} instructors={instructorOptions} />;
}
