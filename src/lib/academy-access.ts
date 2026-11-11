export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED";

type CourseEnrollment = {
  status: EnrollmentStatus;
  class: { courseId: string | null };
};

export function canDisplayBelt(enrollments: readonly CourseEnrollment[]): boolean {
  return enrollments.some(({ status, class: enrolledClass }) =>
    enrolledClass.courseId !== null && (status === "ACTIVE" || status === "COMPLETED"),
  );
}
