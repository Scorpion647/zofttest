import { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom"
import {Button} from "@chakra-ui/react";

export interface FormSubmitProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    text: string,
}

export default function FormSubmit({ text, className, ...props }: FormSubmitProps) {
    const { pending } = useFormStatus();

    return (
        <Button  type="submit" color="black" colorScheme="teal" bg="#F1D803" className={" color btn " + className } disabled={props.disabled ? props.disabled : pending} {...props}>
            {pending ? <span className="loading loading-spinner"></span> : text}
        </Button>
    )
}