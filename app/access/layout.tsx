"use client";
import FormContext from "@/app/_lib/utils/formContext";
import { useState } from "react";
import Image from "next/image";
import AccessHero from "../_ui/AccessHero";
import { FormType } from "../_ui/components/accessForm";
import {
  Select,
  Stack,
  HStack,
  VStack,
  Text,
  Input,
  Button,
  Box,
  ChakraProvider,
  IconButton,
  Heading,
} from "@chakra-ui/react";

export default function AccessPageLayout({
  login,
  signup,
}: {
  login: React.ReactNode;
  signup: React.ReactNode;
}) {
  const [formType, setFormType] = useState<FormType>(FormType.Login);

  return (
    <FormContext.Provider value={{ formType, setFormType }}>
      <main className="flex w-full h-screen">
        {formType === FormType.Login && login}

        <AccessHero />

        {formType === FormType.SignUp && signup}
      </main>
    </FormContext.Provider>
  );
}
