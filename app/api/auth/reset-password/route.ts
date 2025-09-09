// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function POST(req: NextRequest) {
  const { token_hash, newPassword } = await req.json();

  console.log("POST body:", { token_hash, newPassword });
  if (!token_hash || !newPassword) {
    return NextResponse.json({ error: "Token o contraseña faltante" }, { status: 400 });
  }

  const supabase = await createClient(); // Asegúrate de que devuelva SupabaseClient, no Promise

  // 1️⃣ Verifica el token
const { data, error: verifyError } = await supabase.auth.verifyOtp({
  type: "recovery",
  token_hash,
});

console.log("verifyOtp result:", data, "verifyError:", verifyError);

if (verifyError || !data.user) {
  return NextResponse.json({ error: verifyError?.message || "Token inválido" }, { status: 400 });
}

// Cambiar contraseña usando admin API
const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
  password: newPassword,
});




  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }
  console.log("updateError:", updateError);

  return NextResponse.json({ message: "Contraseña actualizada correctamente" });
}

