import { reauthenticate } from "./supabase/client";
import { AuthError, AuthResponse, PostgrestError } from "@supabase/supabase-js";

export enum AccessDataFields {
  email = "email",
  username = "username",
  password = "password",
  confirmPassword = "confirmPassword",
}

export type InvoiceEmailProps = {
  invoice_id: string;
  type: string;
  reason?: string;
  body?: string;
  subject?: string;
};

export class CustomDataError {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  changePassword?: string;
  authError?: string;
  otherError?: string;
  redirectTo?: string;
}

export enum SupabaseErrorCode {
  email_exists = "email_exists",
  over_email_send_rate_limit = "over_email_send_rate_limit",
  over_request_rate_limit = "over_request_rate_limit",
  provider_disabled = "provider_disabled",
  provider_email_needs_verification = "provider_email_needs_verification",
  reauthentication_needed = "reauthentication_needed",
  reauthentication_not_valid = "reauthentication_not_valid",
  same_password = "same_password",
  session_not_found = "session_not_found",
  signup_disabled = "signup_disabled",
  single_identity_not_deletable = "single_identity_not_deletable",
  sms_send_failed = "sms_send_failed",
  too_many_enrolled_mfa_factors = "too_many_enrolled_mfa_factors",
  unexpected_failure = "unexpected_failure",
  user_already_exists = "user_already_exists",
  user_banned = "user_banned",
  user_not_found = "user_not_found",
  user_sso_managed = "user_sso_managed",
  validation_failed = "validation_failed",
  weak_password = "weak_password",
  P0004 = "P0004",
}

export function handleError(
  error: AuthError | PostgrestError | null,
  callback?: (response: AuthResponse) => void,
): CustomDataError {
  console.error(error);

  if (error && error.code) {
    if (error.code === SupabaseErrorCode.P0004 && error.message) {
      return checkErrors(error.message, callback);
    } else {
      return checkErrors(error.code, callback);
    }
  } else {
    return buildServiceError(
      "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
    );
  }
}

function checkErrors(
  error: string,
  callback?: (response: AuthResponse) => void,
): CustomDataError {
  switch (error) {
    case SupabaseErrorCode.email_exists: {
      return buildEmailError(
        "Ya existe un usuario con ese correo electrónico.",
      );
    }
    case SupabaseErrorCode.over_email_send_rate_limit: {
      return buildServiceError(
        "Demasiados correos han sido enviados a ese correo electrónico. Por favor, inténtelo de nuevo más tarde.",
      );
    }
    case SupabaseErrorCode.over_request_rate_limit: {
      return buildServiceError(
        "Demasiados solicitudes han sido realizadas en muy poco tiempo. Por favor, inténtelo de nuevo más tarde.",
      );
    }
    case SupabaseErrorCode.provider_disabled: {
      return buildServiceError(
        "El proveedor de autenticación ha sido deshabilitado. Por favor, inténtelo de nuevo más tarde.",
      );
    }
    case SupabaseErrorCode.provider_email_needs_verification: {
      return buildServiceError(
        "Por favor, verifique el correo registrado en el proveedor para continuar.",
      );
    }
    case SupabaseErrorCode.reauthentication_needed: {
      reauthenticate().then((result) => {
        if (callback) {
          callback(result);
        }
      });

      return buildServiceError(
        "Se ha enviado un código de autorización a su correo electrónico o número de teléfono. Por favor, siga las instrucciones para continuar.",
      );
    }
    case SupabaseErrorCode.reauthentication_not_valid: {
      return buildServiceError("El código de autorización no es válido.");
    }
    case SupabaseErrorCode.same_password: {
      return buildPasswordError("La contraseña utilizada ya está en uso.");
    }
    case SupabaseErrorCode.session_not_found: {
      return buildServiceError(
        "Se ha perdido la sesión. Por favor, inicie sesión nuevamente.",
        "/access",
      );
    }
    case SupabaseErrorCode.signup_disabled: {
      return buildServiceError(
        "El registro de usuarios está deshabilitado. Por favor, inténtelo de nuevo más tarde.",
      );
    }
    case SupabaseErrorCode.single_identity_not_deletable: {
      return buildServiceError(
        "No se puede eliminar la única identidad registrada.",
      );
    }
    case SupabaseErrorCode.sms_send_failed: {
      return buildServiceError(
        "No se pudo enviar el código de autorización a su número de teléfono. Por favor, inténtelo de nuevo más tarde.",
      );
    }
    case SupabaseErrorCode.too_many_enrolled_mfa_factors: {
      return buildServiceError("Hay demasiados factores MFA registrados.");
    }
    case SupabaseErrorCode.unexpected_failure: {
      return buildServiceError(
        "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
      );
    }
    case SupabaseErrorCode.user_already_exists: {
      return buildServiceError(
        "Ya existe un usuario registrado con ese correo electrónico o número de teléfono.",
      );
    }
    case SupabaseErrorCode.user_banned: {
      return buildServiceError(
        "El usuarion no está autorizado para acceder a este servicio.",
      );
    }
    case SupabaseErrorCode.user_not_found: {
      return buildServiceError("No se ha encontrado el usuario.");
    }
    case SupabaseErrorCode.user_sso_managed: {
      return buildServiceError(
        "Información administrada por el proveedor de autenticación. Acceda a la página del proveedor para modificar la información.",
      );
    }
    case SupabaseErrorCode.validation_failed: {
      return buildServiceError(
        "La validación ha fallado. Compruebe los campos requeridos.",
      );
    }
    case SupabaseErrorCode.weak_password: {
      return buildPasswordError("La contraseña es demasiado débil.");
    }
  }

  return {
    otherError: "Error inesperado. Por favor, inténtelo de nuevo más tarde.",
  };
}

function buildEmailError(error: string): CustomDataError {
  return {
    email: error,
  };
}

function buildPasswordError(error: string): CustomDataError {
  return {
    password: error,
  };
}

function buildServiceError(
  error: string,
  redirectTo?: string,
): CustomDataError {
  return {
    otherError: error,
    redirectTo: redirectTo,
  };
}
