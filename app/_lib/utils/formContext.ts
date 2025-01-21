"use client";
import { FormType } from "@/app/_ui/components/accessForm";
import { createContext, useContext } from "react";

const FormContext = createContext<{
  formType: FormType;
  setFormType: (formType: FormType) => void;
}>({
  formType: FormType.Login,
  setFormType: () => {},
});

export const useFormContext = () => useContext(FormContext);

export default FormContext;
