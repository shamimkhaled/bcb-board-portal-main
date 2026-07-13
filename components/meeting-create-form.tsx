"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import type { ConfidentialityLevel, MeetingType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MeetingUserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function MeetingCreateForm({
  users,
  meetingTypes,
  confidentialityLevels
}: {
  users: MeetingUserOption[];
  meetingTypes: MeetingType[];
  confidentialityLevels: ConfidentialityLevel[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/meetings/create", {
        method: "POST",
        body: formData
      });
      const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!response.ok || !body?.id) {
        setError(body?.error ?? "Meeting could not be created.");
        return;
      }
      router.push(`/meetings/${body.id}`);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-5">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title" name="title" required />
        <SelectField label="Meeting type" name="meetingType" options={meetingTypes} required />
        <Field label="Meeting date" name="date" type="date" required />
        <Field label="Start time" name="startTime" type="time" required />
        <Field label="End time" name="endTime" type="time" required />
        <Field label="Venue" name="venue" required />
        <Field label="Online link" name="onlineLink" type="url" />
        <SelectField label="Confidentiality" name="confidentiality" options={confidentialityLevels} required />
        <Field label="Acknowledgment deadline" name="acknowledgmentDeadline" type="datetime-local" />
        <Field label="Attendance deadline" name="attendanceDeadline" type="datetime-local" />
        <Field label="Quorum" name="quorum" type="number" min={1} />
        <SelectUser label="Chairman" name="chairmanId" users={users} roleHint="BOARD_CHAIRMAN" required />
        <SelectUser label="Secretary" name="secretaryId" users={users} roleHint="COMPANY_SECRETARY" required />
      </div>

      <label className="block space-y-1 text-sm font-semibold text-bcb-ink">
        <span>Description</span>
        <Textarea name="description" placeholder="Purpose, context, and expected meeting outcomes" />
      </label>

      <fieldset className="rounded-lg border bg-white p-4">
        <legend className="px-1 text-sm font-bold text-bcb-ink">Participants</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <label key={user.id} className="flex items-start gap-2 rounded-md border bg-slate-50 p-3 text-sm">
              <input type="checkbox" name="participantIds" value={user.id} className="mt-1" />
              <span>
                <span className="block font-semibold text-bcb-ink">{user.name}</span>
                <span className="block text-xs text-slate-500">{user.email} · {user.role}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "Creating..." : "Create Draft Meeting"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1 text-sm font-semibold text-bcb-ink">
      <span>{label}</span>
      <Input name={name} {...props} />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm font-semibold text-bcb-ink">
      <span>{label}</span>
      <select name={name} required={required} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectUser({
  label,
  name,
  users,
  roleHint,
  required
}: {
  label: string;
  name: string;
  users: MeetingUserOption[];
  roleHint: string;
  required?: boolean;
}) {
  const sorted = [...users].sort((a, b) => Number(b.role === roleHint) - Number(a.role === roleHint) || a.name.localeCompare(b.name));
  return (
    <label className="block space-y-1 text-sm font-semibold text-bcb-ink">
      <span>{label}</span>
      <select name={name} required={required} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
        {sorted.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} · {user.role}
          </option>
        ))}
      </select>
    </label>
  );
}
