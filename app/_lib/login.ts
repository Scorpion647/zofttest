"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CustomDataError,
  AccessDataFields,
  handleError,
} from "@/app/_lib/definitions";
import { createClient } from "@/app/_lib/supabase/server";
import { validatePassword } from "@/app/_lib/utils/accessFieldsValidations";

export async function login(
  formData: FormData,
): Promise<void | CustomDataError> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email) {
    return {
      email: "El correo electrónico es requerido",
    };
  } else if (!password) {
    return {
      password: "La contraseña es requerida",
    };
  }

  const passwordError = validatePassword(password, AccessDataFields.password);
  if (passwordError) {
    return passwordError;
  }

  const supabase = createClient();

  const { error } = await (
    await supabase
  ).auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code) {
      return handleError(error);
    }

    console.error(error);
    return {
      otherError: "Credenciales incorrectas",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
