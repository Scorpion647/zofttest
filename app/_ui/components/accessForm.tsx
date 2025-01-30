'use client';
import { useEffect, useState } from "react";
import { createClient } from "@lib/supabase/client";
import FormInput from "./formInput";
import FormSubmit from "./formSubmit";
import { CustomDataError } from "@/app/_lib/definitions";
import { useFormContext } from "@/app/_lib/utils/formContext";
import { Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Input, useToast } from "@chakra-ui/react";
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

  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>(undefined);
  const [ChangePasswordError, setChangePasswordError] = useState<string | undefined>(undefined);
  const [userNameError, setUserNameError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // Estado para los modales
  const [resetEmail, setResetEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal de correo
  const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onClose: onPasswordModalClose } = useDisclosure(); // Modal de contraseña
    const toast = useToast();

  const resetErrors = () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setUserNameError(undefined);
    setError(undefined);
    setConfirmPasswordError(undefined);
    setChangePasswordError(undefined);
  };

  const handleResetPassword = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.href,
    });
    if (error) {
        toast({ title: "El Envio del Correo ha fallado", description: `Ha fallado el intento de mandar la guia a su correo, intente mas tarde`, status: "error", duration: 3000, isClosable: true });
    } else {
        toast({ title: "Correo enviado con exito", description: `Ha sido enviado a su correo la guia para recuperar su contraseña`, status: "success", duration: 3000, isClosable: true });
      onClose(); // Cierra el modal
    }
  };

  const handleChangePassword = async () => {
    if (newPassword === confirmNewPassword) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        alert("There was an error updating your password.");
      } else {
        alert("Password updated successfully!");
        onPasswordModalClose(); // Cierra el modal
      }
    } else {
      alert("Passwords do not match!");
    }
  };

  const actionHandler = async (data: FormData) => {
    resetErrors();

    const result = await props.action(data);
    if (result) {
      if (result.email) { setEmailError(result.email); }
      if (result.password) { setPasswordError(result.password); }
      if (result.username) { setUserNameError(result.username); }
      if (result.confirmPassword) { setConfirmPasswordError(result.confirmPassword); }
      if (result.changePassword) { setChangePasswordError(result.changePassword); }
      if (result.authError) { setError(result.authError); }
      else if (result.otherError) { setError(result.otherError); }

      if (!result.email && !result.password && !result.username && !result.confirmPassword && !result.changePassword && !result.authError && !result.otherError) {
        if (formType === FormType.SignUp) {
          setFormType(FormType.Login);

          console.log("Registro exitoso");
        }
      }
    }
  };

  return (
    <>
      <form action={actionHandler} className="flex flex-col gap-3 justify-center items-center max-w-xs w-80">
        <div className="flex flex-col gap-2 w-full">
          {props.type === FormType.Login && (
            <>
              <FormInput name="email" label={emailError} placeholder="Email" type="email" className={emailError ? "input-error" : ""} labelStyle="text-red-500" />
              <FormInput name="password" label={passwordError ?? ChangePasswordError} placeholder="Password" type="password" className={passwordError ? "input-error" : ""} labelStyle="text-red-500" />
              <Text fontSize='sm' textAlign="center" textColor="blue" cursor="pointer" onClick={onOpen}>¿Has olvidado tu contraseña?</Text>
            </>
          )}
          {props.type === FormType.SignUp && (
            <>
              <FormInput name="username" label={userNameError} placeholder="Username" className={userNameError ? "input-error" : ""} labelStyle="text-red-500" />
              <FormInput name="email" label={emailError} placeholder="Email" type="email" className={emailError ? "input-error" : ""} labelStyle="text-red-500" />
              <FormInput name="password" label={passwordError ?? ChangePasswordError} placeholder="Password" type="password" className={passwordError ? "input-error" : ""} labelStyle="text-red-500" />
              <FormInput name="confirmPassword" label={confirmPasswordError ?? ChangePasswordError} placeholder="Confirm Password" type="password" className={confirmPasswordError ? "input-error" : ""} labelStyle="text-red-500" />
            </>
          )}
        </div>

        <FormSubmit text={props.type} className="btn btn-primary w-full" />
        {error && <p className="label-text-alt text-red-500">{error}</p>}
      </form>

      {/* Modal para restablecer contraseña */}
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
            <Button backgroundColor="#F1D803" textColor="black" onClick={handleResetPassword}>Enviar enlace de restablecimiento</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para cambiar la contraseña */}
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
            <Button colorScheme="blue" onClick={handleChangePassword}>Cambiar Contraseña</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
