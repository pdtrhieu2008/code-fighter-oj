import { describe, expect, it } from "vitest";
import { buildProblemLibraryQuery } from "./problem-library";

describe("buildProblemLibraryQuery", () => {
  it("encodes current filters and pagination into URLSearchParams", () => {
    expect(buildProblemLibraryQuery({ page: 2, search: "  binary tree ", difficulty: "HARD", tag: "trees" })).toBe(
      "page=2&limit=20&search=binary+tree&difficulty=HARD&tag=trees",
    );
  });

  it("omits blank filters and clamps invalid pages to one", () => {
    expect(buildProblemLibraryQuery({ page: 0, search: "  ", difficulty: "", tag: "" })).toBe("page=1&limit=20");
  });
});
