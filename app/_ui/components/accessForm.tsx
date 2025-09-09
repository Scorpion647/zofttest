"use client";
import { useEffect, useState } from "react";
import { createClient } from "@lib/supabase/client";
import FormInput from "./formInput";
import FormSubmit from "./formSubmit";
import { CustomDataError } from "@/app/_lib/definitions";
import { useFormContext } from "@/app/_lib/utils/formContext";
import {
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";

const supabase = createClient();

export type AccessFormProps = {
  type: FormType;
  action: (data: FormData) => Promise<void | CustomDataError>;
};

export enum FormType {
  Login = "Iniciar Sesión",
  SignUp = "Registrarse",
  ResetPassword = "Restablecer Contraseña",
  ChangePassword = "Cambiar Contraseña",
}

export default function AccessForm(props: AccessFormProps) {
  const { setFormType, formType } = useFormContext();
  const toast = useToast();

  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const [ChangePasswordError, setChangePasswordError] = useState<string | undefined>();
  const [userNameError, setUserNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const [resetEmail, setResetEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [tokenHash, setTokenHash] = useState<string | null>(null);


  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal de correo
  const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onClose: onPasswordModalClose } = useDisclosure(); // Modal de cambio de contraseña

  const resetErrors = () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setUserNameError(undefined);
    setError(undefined);
    setConfirmPasswordError(undefined);
    setChangePasswordError(undefined);
  };

  // === DEBUG: Detecta token en URL ===
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token_hash = params.get("token_hash");
  const next = params.get("next");

  console.log("[DEBUG] URL params:", { token_hash, next });
  toast({
    title: "DEBUG URL params",
    description: `token_hash: ${token_hash}, next: ${next}`,
    status: "info",
    duration: 5000,
    isClosable: true,
  });

  if (token_hash) {
    onPasswordModalOpen();
    toast({
      title: "DEBUG: recovery token detected",
      description: "Abriendo modal de cambio de contraseña",
      status: "info",
      duration: 5000,
      isClosable: true,
    });

    // Guardar el token para cuando el usuario cambie la contraseña
    setResetEmail(token_hash); // <-- o un estado nuevo tokenHash

    const url = new URL(window.location.href);
    url.searchParams.delete("token_hash");
    url.searchParams.delete("next");
    window.history.replaceState({}, "", url.toString());
  }
}, []);


  const handleResetPassword = async () => {
    console.log("[DEBUG] Sending reset password email for:", resetEmail);
    toast({
      title: "DEBUG",
      description: `Enviando correo a: ${resetEmail}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/access`,
    });

    if (error) {
      console.error("[DEBUG] Reset password error:", error);
      toast({
        title: "Error al enviar correo",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    }
  };

  const handleChangePassword = async () => {
    if (!tokenHash) return;

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("[DEBUG] updateUser error:", error);
      toast({
        title: "Error al cambiar contraseña",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onPasswordModalClose();
    }
  };

  const actionHandler = async (data: FormData) => {
    resetErrors();
    const result = await props.action(data);
    console.log("[DEBUG] Form action result:", result);

    if (!result) return;

    if (result.email) setEmailError(result.email);
    if (result.password) setPasswordError(result.password);
    if (result.username) setUserNameError(result.username);
    if (result.confirmPassword) setConfirmPasswordError(result.confirmPassword);
    if (result.changePassword) setChangePasswordError(result.changePassword);
    if (result.authError) setError(result.authError);
    if (result.otherError) setError(result.otherError);

    if (
      !result.email &&
      !result.password &&
      !result.username &&
      !result.confirmPassword &&
      !result.changePassword &&
      !result.authError &&
      !result.otherError
    ) {
      if (formType === FormType.SignUp) setFormType(FormType.Login);
    }
  };

  return (
    <>
      <form
        action={actionHandler}
        className="flex w-80 max-w-xs flex-col items-center justify-center gap-3"
      >
        <div className="flex w-full flex-col gap-2">
          {props.type === FormType.Login && (
            <>
              <FormInput
                name="email"
                label={emailError}
                placeholder="Email"
                type="email"
                className={emailError ? "input-error" : ""}
                labelStyle="text-red-500"
              />
              <FormInput
                name="password"
                label={passwordError ?? ChangePasswordError}
                placeholder="Password"
                type="password"
                className={passwordError ? "input-error" : ""}
                labelStyle="text-red-500"
              />
              <Text
                fontSize="sm"
                textAlign="center"
                textColor="blue"
                cursor="pointer"
                onClick={onOpen}
              >
                ¿Has olvidado tu contraseña?
              </Text>
            </>
          )}

          {props.type === FormType.SignUp && (
            <>
              <FormInput
                name="username"
                label={userNameError}
                placeholder="Username"
                className={userNameError ? "input-error" : ""}
                labelStyle="text-red-500"
              />
              <FormInput
                name="email"
                label={emailError}
                placeholder="Email"
                type="email"
                className={emailError ? "input-error" : ""}
                labelStyle="text-red-500"
              />
              <FormInput
                name="password"
                label={passwordError ?? ChangePasswordError}
                placeholder="Password"
                type="password"
                className={passwordError ? "input-error" : ""}
                labelStyle="text-red-500"
              />
              <FormInput
                name="confirmPassword"
                label={confirmPasswordError ?? ChangePasswordError}
                placeholder="Confirm Password"
                type="password"
                className={confirmPasswordError ? "input-error" : ""}
                labelStyle="text-red-500"
              />
            </>
          )}
        </div>

        <FormSubmit text={props.type} className="btn btn-primary w-full" />
        {error && <p className="label-text-alt text-red-500">{error}</p>}
      </form>

      {/* Modal de restablecer contraseña */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Restablecer Contraseña</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormInput
              name="email"
              label="Correo electrónico"
              placeholder="Ingresa tu correo"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              backgroundColor="#F1D803"
              textColor="black"
              onClick={handleResetPassword}
            >
              Enviar enlace de restablecimiento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cambiar Contraseña</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormInput
              name="newPassword"
              label="Nueva Contraseña"
              placeholder="Ingresa nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <FormInput
              name="confirmNewPassword"
              label="Confirmar Contraseña"
              placeholder="Confirma nueva contraseña"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleChangePassword}>
              Cambiar Contraseña
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}


