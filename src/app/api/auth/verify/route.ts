import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  
  // Dashboard URL base
  const dashboardUrl = new URL("/dashboard", req.url);

  if (!token) {
    dashboardUrl.searchParams.set("error", "MissingToken");
    return NextResponse.redirect(dashboardUrl);
  }

  if (!supabase) {
    dashboardUrl.searchParams.set("error", "DatabaseNotConfigured");
    return NextResponse.redirect(dashboardUrl);
  }

  // Verify the token
  const { data: tokenData, error: tokenError } = await supabase
    .from("auth_tokens")
    .select("user_id, expires_at, used")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    dashboardUrl.searchParams.set("error", "InvalidToken");
    return NextResponse.redirect(dashboardUrl);
  }

  if (tokenData.used) {
    dashboardUrl.searchParams.set("error", "TokenAlreadyUsed");
    return NextResponse.redirect(dashboardUrl);
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    dashboardUrl.searchParams.set("error", "TokenExpired");
    return NextResponse.redirect(dashboardUrl);
  }

  // Mark token as used
  await supabase
    .from("auth_tokens")
    .update({ used: true })
    .eq("token", token);

  // Fetch the user's role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", tokenData.user_id)
    .single();

  const role = userData?.role || "member";

  // Set auth cookie
  const sessionData = { user_id: tokenData.user_id, role };
  cookies().set("auth_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return NextResponse.redirect(dashboardUrl);
}
