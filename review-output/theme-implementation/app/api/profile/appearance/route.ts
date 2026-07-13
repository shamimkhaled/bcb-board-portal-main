import { NextRequest, NextResponse } from "next/server";
import { AppearanceTheme } from "@prisma/client";
import { getCurrentAuth } from "@/lib/auth";
import { updateUserThemePreference } from "@/lib/theme";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { selectedTheme } = (await request.json()) as { selectedTheme?: AppearanceTheme };
  if (!selectedTheme || !Object.values(AppearanceTheme).includes(selectedTheme)) {
    return NextResponse.json({ error: "Invalid theme selection." }, { status: 400 });
  }

  try {
    await updateUserThemePreference(auth.user.id, selectedTheme);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Theme preference could not be saved." }, { status: 400 });
  }
}
