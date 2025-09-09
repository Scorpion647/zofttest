// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { token_hash, newPassword } = await req.json();

    console.log("[DEBUG] POST body:", { token_hash, newPassword });

    if (!token_hash || !newPassword) {
      return NextResponse.json(
        { error: "Token o contraseña faltante" },
        { status: 400 }
      );
    }

    // Crear cliente Supabase con la anon key (cliente normal)
    const supabase = createClient();

    // 1️⃣ Verificar el token hash
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash,
    });

    console.log("[DEBUG] verifyOtp result:", { data, verifyError });

    if (verifyError) {
      return NextResponse.json(
        { error: `Error al verificar token: ${verifyError.message}` },
        { status: 400 }
      );
    }

    if (!data?.session) {
      return NextResponse.json(
        { error: "Token válido pero no se obtuvo sesión" },
        { status: 400 }
      );
    }

    // 2️⃣ Crear cliente con la sesión obtenida
    const supabaseWithSession = createClient();
    await supabaseWithSession.auth.setSession(data.session);



    // 3️⃣ Cambiar la contraseña
    const { error: updateError } = await supabaseWithSession.auth.updateUser({
      password: newPassword,
    });

    console.log("[DEBUG] updateUser result:", { updateError });

    if (updateError) {
      return NextResponse.json(
        { error: `Error al actualizar contraseña: ${updateError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("[ERROR] reset-password route:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Error desconocido" },
      { status: 500 }
    );
  }
}


