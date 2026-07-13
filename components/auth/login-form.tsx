"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoUsers = [
  "admin@bcb.test",
  "secretary@bcb.test",
  "chairman@bcb.test",
  "director1@bcb.test",
  "director2@bcb.test",
  "committee@bcb.test",
  "department@bcb.test",
  "archive@bcb.test",
  "auditor@bcb.test"
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("secretary@bcb.test");
  const [password, setPassword] = useState("password123");
  const [otp, setOtp] = useState("123456");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mfaRequired ? "/api/auth/mfa" : "/api/auth/login";
    const body = mfaRequired ? { otp } : { email, password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Sign in failed.");
      return;
    }

    if (payload.mfaRequired) {
      setMfaRequired(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-4">
        {!mfaRequired ? (
          <>
            <label className="block text-sm font-semibold text-bcb-ink">
              Email
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-semibold text-bcb-ink">
              Password
              <div className="relative mt-1.5">
                <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>
          </>
        ) : (
          <label className="block text-sm font-semibold text-bcb-ink">
            One-time passcode
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>
          </label>
        )}
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mfaRequired ? <KeyRound className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
          {mfaRequired ? "Verify MFA" : "Continue"}
        </Button>
      </div>
      <div className="mt-5 border-t pt-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Seeded users</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {demoUsers.map((user) => (
            <button
              key={user}
              type="button"
              className="rounded-md border bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-bcb-green hover:text-bcb-green"
              onClick={() => {
                setEmail(user);
                setMfaRequired(false);
                setError("");
              }}
            >
              {user.split("@")[0]}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
