import { describe, expect, it } from "vitest";
import { canDisplayBelt } from "./academy-access";

describe("canDisplayBelt", () => {
  it("allows belt display only for an active course enrollment", () => {
    expect(canDisplayBelt([{ status: "ACTIVE", class: { courseId: "course-1" } }])).toBe(true);
    expect(canDisplayBelt([{ status: "COMPLETED", class: { courseId: "course-1" } }])).toBe(true);
    expect(canDisplayBelt([{ status: "ACTIVE", class: { courseId: null } }])).toBe(false);
    expect(canDisplayBelt([{ status: "DROPPED", class: { courseId: "course-1" } }])).toBe(false);
    expect(canDisplayBelt([])).toBe(false);
  });
});
