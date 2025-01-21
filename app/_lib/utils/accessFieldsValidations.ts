import { CustomDataError, AccessDataFields } from "@/app/_lib/definitions";

export function validateAndConfirmPassword(
  password: string,
  confirmPassword: string,
): void | CustomDataError {
  if (password) {
    const error = validatePassword(password, AccessDataFields.password);
    if (error) {
      return error;
    }
  }

  if (password && confirmPassword && password !== confirmPassword) {
    return {
      confirmPassword: "Las contraseñas no coinciden",
    };
  }

  if (confirmPassword && !password) {
    return {
      password: "Ingrese una contraseña antes de confirmarla",
    };
  }
}

export function validatePassword(
  password: string,
  field: AccessDataFields,
): void | CustomDataError {
  if (password.length < 8) {
    return {
      password: "La contraseña debe tener al menos 8 caracteres",
    };
  }

  const numberRegex = /^.*(?=[0-9]).+$/;
  const lettersRegex = /^.*(?=[a-zA-Z]).+$/;

  if (!numberRegex.test(password)) {
    return {
      password: "La contraseña debe contener al menos un número",
    };
  }

  if (!lettersRegex.test(password)) {
    return {
      password: "La contraseña debe contener al menos una letra",
    };
  }
}
