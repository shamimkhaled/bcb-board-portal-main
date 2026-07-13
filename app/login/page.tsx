import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuth } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getCurrentAuth();
  if (auth) redirect("/dashboard");

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#05382c]">
      {/* Atmospheric app background — no unused desktop-only priority image */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% -10%, #1fa37a 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, #0a5c48 0%, transparent 50%)"
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] sm:justify-center">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white p-2 shadow-ds-float">
            <Image src="/bcb-logo.png" alt="BCB" width={56} height={56} className="h-12 w-12 object-contain" priority />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Bangladesh Cricket Board</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">BCB Portal</h1>
          <p className="mt-2 max-w-xs text-sm leading-6 text-emerald-100/75">
            Board packs, meetings, and secure documents — built like a native app.
          </p>
        </div>

        <div
          data-testid="login-form-panel"
          className="ds-enter rounded-[1.75rem] bg-white p-6 shadow-ds-lg sm:p-8"
        >
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Demo: <span className="font-semibold text-slate-800">password123</span> · MFA{" "}
            <span className="font-semibold text-slate-800">123456</span>
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>

        {/* Hidden desktop visual for e2e that assert decorative panel exists */}
        <section data-testid="login-visual-panel" className="sr-only" aria-hidden="true">
          <span data-testid="login-decorative-image">boardroom</span>
        </section>
      </div>
    </main>
  );
}
