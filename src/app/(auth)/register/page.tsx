"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Mail, User, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      } else {
        setSuccess("Đăng ký tài khoản võ sĩ thành công! Đang chuyển hướng...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Gia Nhập Code Fighter</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Tạo tài khoản miễn phí để bắt đầu luyện tập. Đai chỉ dành cho học viên đã ghi danh khóa học.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và Tên</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Tên Võ Sĩ (Username)</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono text-neutral-500">@</span>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="spartan_coder"
              value={formData.username}
              onChange={handleChange}
              className="pl-8 font-mono text-xs"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Địa chỉ Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="fighter@example.com"
              value={formData.email}
              onChange={handleChange}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" variant="fighter" className="w-full" disabled={loading}>
          {loading ? "Đang Tạo Tài Khoản..." : "Tạo Tài Khoản"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-neutral-400">
        Đã có tài khoản võ sĩ?{" "}
        <Link href="/login" className="font-semibold text-[#E63946] hover:underline">
          Đăng Nhập Ngay
        </Link>
      </div>
    </div>
  );
}
