"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/app/_lib/supabase/server";
import { validateAndConfirmPassword } from "@/app/_lib/utils/accessFieldsValidations";
import { CustomDataError, handleError } from "@/app/_lib/definitions";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email) {
    return {
      email: "El correo electrónico es requerido",
    };
  } else if (!username) {
    return {
      username: "El nombre de usuario es requerido",
    };
  }

  if (!password) {
    return {
      password: "La contraseña es requerida",
    };
  }

  const confirmPasswordError = validateAndConfirmPassword(
    password,
    confirmPassword,
  );
  if (confirmPasswordError) {
    return confirmPasswordError;
  }

  const supabase = await createClient();
  const { data: EData, error: supplierError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("domain", email.split("@")[1])
    .limit(1)
    .maybeSingle();

  if (supplierError || !EData) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      return handleError(error);
    }
  } else {
    const error = await createUser(email, username, password);
    if (error) {
      return error;
    }

    redirect("/");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

async function createUser(
  email: string,
  username: string,
  password: string,
): Promise<void | CustomDataError> {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const adminClient = supabase.auth.admin;

  const { error } = await adminClient.createUser({
    email,
    password,
    user_metadata: {
      username,
    },
    email_confirm: true,
  });

  if (error) {
    return handleError(error);
  }
}
