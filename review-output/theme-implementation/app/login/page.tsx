import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuth } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getCurrentAuth();
  if (auth) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-bcb-navy lg:block">
        <Image
          src="/governance-boardroom.png"
          alt="Executive board governance workspace"
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover opacity-72"
        />
        <div className="theme-dashboard-overlay absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <div className="mb-6 inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            Bangladesh Cricket Board governance demo
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight">
            BCB Directors&apos; Affairs Automation Platform
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/72">
            Secure board packs, memo approvals, minutes, resolutions, archive controls,
            access governance, and audit-chain visibility in one executive workspace.
          </p>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-white p-1.5 shadow-sm">
              <Image
                src="/bcb-logo.png"
                alt="Bangladesh Cricket Board logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-bcb-navy">Secure sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use any seeded account with password <span className="font-semibold">password123</span>.
              The demo MFA code is <span className="font-semibold">123456</span>.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
