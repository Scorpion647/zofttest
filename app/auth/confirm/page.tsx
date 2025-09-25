"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function buildSafeRedirect(nextParam: string | null, origin: string) {
  const defaultPath = "/access";

  if (!nextParam) {
    return defaultPath;
  }

  try {
    const nextUrl = new URL(nextParam, origin);

    if (nextUrl.origin !== origin) {
      return defaultPath;
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}` || defaultPath;
  } catch (error) {
    console.error("[auth/confirm] Invalid next parameter", error);
    return defaultPath;
  }
}

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const origin = window.location.origin;
    const tokenHash = searchParams.get("token_hash");
    const nextParam = searchParams.get("next");

    const targetPath = buildSafeRedirect(nextParam, origin);
    const targetUrl = new URL(targetPath, origin);

    if (tokenHash) {
      targetUrl.searchParams.set("token_hash", tokenHash);
    }

    router.replace(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirigiendo...</p>
    </div>
  );
}
