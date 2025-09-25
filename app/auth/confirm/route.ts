import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const nextParam = searchParams.get("next");

  if (!tokenHash) {
    redirect("/error?message=missing_token");
  }

  const type = (
    typeParam && typeParam.length > 0 ?
      typeParam
    : "recovery") as EmailOtpType;

  let targetUrl: URL;

  try {
    targetUrl = new URL(nextParam ?? "/access", request.url);
  } catch {
    targetUrl = new URL("/access", request.url);
  }
  targetUrl.searchParams.set("token_hash", tokenHash);
  targetUrl.searchParams.set("type", type);

  redirect(targetUrl.toString());
}
