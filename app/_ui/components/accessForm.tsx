'use client'
import FormInput from "./formInput";
import { useState } from "react";
import FormSubmit from "./formSubmit";
import { CustomDataError } from "@/app/_lib/definitions";
import { useFormContext } from "@/app/_lib/utils/formContext";
import {Text} from "@chakra-ui/react";

export type AccessFormProps = {
    type: FormType;
    action: (data: FormData) => Promise<void | CustomDataError>;
}

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
    const [ResetPassword, setResetPassword] = useState(false);

    const resetErrors = () => {
        setEmailError(undefined);
        setPasswordError(undefined);
        setUserNameError(undefined);
        setError(undefined);
        setConfirmPasswordError(undefined);
        setChangePasswordError(undefined);
    }

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
                    setFormType(FormType.Login)

                    console.log("Registro exitoso")
                }
            }
        }
    }

    return (
        <form action={actionHandler} className="flex flex-col gap-3 justify-center items-center max-w-xs w-80">
            <div className="flex flex-col gap-2 w-full">
            {props.type === FormType.Login && (
                    <>
                        <FormInput name="email" label={emailError} placeholder="Email" type="email" className={emailError ? "input-error" : ""} labelStyle="text-red-500" />
                        <FormInput name="password" label={passwordError ?? ChangePasswordError} placeholder="Password" type="password" className={passwordError ? "input-error" : ""} labelStyle="text-red-500" />
                        <Text fontSize='sm' textAlign="center" textColor="blue" cursor="pointer" onClick={() => setResetPassword(true)}>¿Has olvidado tu contraseña?</Text>
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
    )
}