export function buildProblemLibraryQuery(filters: {
  page: number;
  search: string;
  difficulty: string;
  tag: string;
}): string {
  const page = Number.isFinite(filters.page) ? Math.max(1, Math.trunc(filters.page)) : 1;
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.tag) params.set("tag", filters.tag);
  return params.toString();
}
