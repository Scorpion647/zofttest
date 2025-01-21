"use client";
import { signup } from "@/app/_lib/signup";
import { useFormContext } from "@/app/_lib/utils/formContext";
import AccessForm, { FormType } from "@/app/_ui/components/accessForm";
import {
  Box,
  ChakraProvider,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

import Image from "next/image";

export default function SignupPage() {
  const { setFormType } = useFormContext();
  const handleSignUp = async (data: FormData) => {
    return signup(data);
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
              Registro
            </Heading>
            <AccessForm type={FormType.SignUp} action={handleSignUp} />
            <VStack spacing="0px">
              <Text fontSize="sm">¿Ya esta Registrado?</Text>
              <HStack>
                <Text fontSize="sm">Inicie sesion</Text>
                <Text
                  cursor="pointer"
                  onClick={() => {
                    setFormType(FormType.Login);
                  }}
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
