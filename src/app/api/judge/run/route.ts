import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { auth } from "@/auth";
import { JUDGE0_LANGUAGE_IDS, JUDGE0_SANDBOX_OPTIONS, MAX_CUSTOM_INPUT_LENGTH, MAX_SOURCE_LENGTH } from "@/lib/judge";

const runSchema = z.object({
  sourceCode: z.string().min(1).max(MAX_SOURCE_LENGTH),
  language: z.enum(["CPP17", "CPP20", "PYTHON3", "JAVA"]),
  input: z.string().max(MAX_CUSTOM_INPUT_LENGTH).default(""),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để chạy mã nguồn." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body phải là JSON hợp lệ." }, { status: 400 });
  }
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu chạy thử không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }

  const judge0Url = process.env.JUDGE0_API_URL;
  if (!judge0Url) {
    return NextResponse.json({ error: "Judge0 chưa được cấu hình; không có mã nguồn nào được thực thi." }, { status: 503 });
  }

  try {
    const response = await axios.post(
      `${judge0Url.replace(/\/$/, "")}/submissions?wait=true`,
      {
        source_code: parsed.data.sourceCode,
        language_id: JUDGE0_LANGUAGE_IDS[parsed.data.language],
        stdin: parsed.data.input,
        ...JUDGE0_SANDBOX_OPTIONS,
        max_file_size: 2048,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(process.env.JUDGE0_API_KEY ? { "X-Auth-Token": process.env.JUDGE0_API_KEY } : {}),
        },
        timeout: 30_000,
      },
    );
    const data = response.data;
    return NextResponse.json({
      verdict: data.status?.description ?? "Unknown",
      output: data.stdout ?? data.stderr ?? data.compile_output ?? "",
      executionTime: Math.round((Number(data.time) || 0) * 1000),
      memoryUsed: data.memory ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Không thể kết nối hoặc chạy mã trên Judge0." }, { status: 502 });
  }
}
