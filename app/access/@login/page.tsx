"use client";
import { login } from "@/app/_lib/login";
import { useFormContext } from "@/app/_lib/utils/formContext";
import AccessForm, { FormType } from "@/app/_ui/components/accessForm";
import Image from "next/image";

import {
  Box,
  ChakraProvider,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

export default function LoginPage() {
  const { setFormType } = useFormContext();
  const handleLogin = async (data: FormData) => {
    return login(data);
  };

  return (
    <ChakraProvider>
      <div className="w-full flex items-center justify-center lg:w-1/2 bg-gradient-to-tr from-green-900 to-green-700 ">
        <Box className="bg-gradient-to-tr border-2 border-black from-gray-200 to-gray-300 px-10 py-8 rounded-3xl">
          <VStack>
            <Image
              src={"/grupo-ecopetrol.png"}
              alt="Logo del sitio"
              width={270}
              height={80}
            />
            <Heading
              mb="2"
              h={10}
              color="black"
              style={{ fontSize: "200%" }}
              noOfLines={1}>
              Inicio de sesion
            </Heading>
            <AccessForm type={FormType.Login} action={handleLogin} />

            <VStack spacing="0px">
              <Text fontSize="sm">¿No esta registrado?</Text>
              <HStack style={{ marginBottom: "40%" }}>
                <Text fontSize="sm">Registrese</Text>
                <Text
                  onClick={() => {
                    setFormType(FormType.SignUp);
                  }}
                  cursor="pointer"
                  fontSize="sm"
                  color="blue">
                  aqui
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </div>
    </ChakraProvider>
  );
}
