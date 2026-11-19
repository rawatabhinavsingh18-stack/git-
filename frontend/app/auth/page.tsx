"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Github,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Biotech Researcher");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (tab === "signup" && !fullName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg(
        tab === "signin"
          ? "Authenticated successfully! Redirecting to Predictor Studio..."
          : "Account created successfully! Welcome to DeepDTA+."
      );
      setTimeout(() => {
        router.push("/predict");
      }, 1000);
    }, 800);
  };

  return (
    <div className="relative flex min-h-[82vh] items-center justify-center p-4">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-12 left-1/3 h-64 w-80 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />

      {/* Glassmorphic Container */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <Card className="border-surface-border/80 bg-surface-card/90 shadow-2xl backdrop-blur-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 p-0.5 shadow-glow">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-surface">
                <FlaskConical className="h-6 w-6 text-brand-400" />
              </div>
            </div>

            <CardTitle className="text-xl font-bold tracking-tight text-white">
              {tab === "signin" ? "Sign In to DeepDTA+" : "Create Researcher Account"}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Access the trained DeepDTACNN affinity predictor and screening workspace.
            </CardDescription>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-elevated/70 p-1 mt-4 border border-surface-border">
              <button
                type="button"
                onClick={() => {
                  setTab("signin");
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  tab === "signin"
                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  tab === "signup"
                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Social Auth */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/predict")}
                className="w-full text-xs font-medium gap-2 border-surface-border"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/predict")}
                className="w-full text-xs font-medium gap-2 border-surface-border"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </Button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-surface-border w-full" />
              <span className="bg-surface-card px-2 text-[10px] text-zinc-400 font-mono uppercase">
                Or with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Full Name</label>
                  <Input
                    icon={<User className="h-4 w-4" />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Rosalind Franklin"
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Email Address</label>
                <Input
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@biotech.org"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <Input
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-9 text-xs"
                />
              </div>

              {tab === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Research Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-9 w-full rounded-lg border border-surface-border bg-surface-elevated/70 px-3 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="Biotech Researcher">Biotech Researcher</option>
                    <option value="Academic Student">Academic Student / University</option>
                    <option value="ML Engineer">ML / Computational Chemist</option>
                    <option value="Medicinal Chemist">Medicinal Chemist</option>
                  </select>
                </div>
              )}

              <Button
                type="submit"
                variant="glow"
                size="md"
                isLoading={isLoading}
                className="w-full h-10 mt-2 text-xs font-bold"
              >
                {tab === "signin" ? "Sign In to Workspace" : "Create Account"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2 border-t border-surface-border/50 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
              <span>TLS 256-Bit Encrypted Platform • HIPAA Compliant Sandbox</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
