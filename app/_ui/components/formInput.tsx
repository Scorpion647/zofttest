import { InputHTMLAttributes } from "react";


export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    labelStyle?: string
};

export default function FormInput({ label, labelStyle, className, ...props }: FormInputProps) {
    return (
        <label className="form-control w-full max-w-xs">

            <input className={"input input-bordered " + (className ?? "")} {...props} />

            {label &&
                <div className="text-wrap break-words">
                    <span className={"label-text-alt " + labelStyle}>{label}</span>
                </div>
            }
        </label>
    );
}