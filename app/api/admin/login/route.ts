import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, checkCredentials, createSessionToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = body?.username;
  const password = body?.password;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "חסרים פרטי התחברות" }, { status: 400 });
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
