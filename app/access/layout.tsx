"use client";
import FormContext from "@/app/_lib/utils/formContext";
import { useState, useEffect } from "react";
import Image from "next/image";
import AccessHero from "../_ui/AccessHero";
import { FormType } from "../_ui/components/accessForm";
import {
  HStack,
  VStack,
  Text,
  Box,
  Divider,
  ChakraProvider,
} from "@chakra-ui/react";

export default function AccessPageLayout({
  login,
  signup,
}: {
  login: React.ReactNode;
  signup: React.ReactNode;
}) {
  const [formType, setFormType] = useState<FormType>(FormType.Login);

  const [height, setHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <>
      <ChakraProvider>
        {height > 730 && (
          <>
            <Box className="absolute z-50 w-full justify-items-center align-top">
              <Box
                mt={2}
                p={3}
                boxShadow="lg"
                borderRadius="md"
                borderWidth={1}
                borderColor="gray.300"
                backgroundColor="gray.200"
                textAlign="center"
                width="auto"
                minWidth="300px"
                display="flex"
                flexDirection="column"
                alignItems="center">
                <HStack>
                  <VStack spacing={0}>
                    <Box>
                      <Text className="font-bold" fontSize="200%">
                        ZOFT
                      </Text>
                      <Divider borderColor="black" borderWidth="1px" />
                    </Box>
                    <Text fontSize="60%">Powered By Ecopetrol</Text>
                  </VStack>
                  <Image alt="" width="50" height="50" src="/zoft.png"></Image>
                </HStack>
              </Box>
            </Box>
          </>
        )}
      </ChakraProvider>
      <FormContext.Provider value={{ formType, setFormType }}>
        <main className="flex h-screen w-full">
          {formType === FormType.Login && login}

          <AccessHero />

          {formType === FormType.SignUp && signup}
        </main>
      </FormContext.Provider>
    </>
  );
}

/*

<HStack className={`absolute ${formType === FormType.Login ? 'right-2' : 'left-2'} top-2`}>
      <Box
      p={3}
      boxShadow="lg"
      borderRadius="md"
      borderWidth={1}
      borderColor="gray.300"
      backgroundColor="gray.200"
      textAlign="center"
      width="auto"
      minWidth="300px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      >
      <HStack >
      { formType === FormType.Login && (
        <VStack spacing={0}>
        <Box>
        <Text className=" font-bold" fontSize="200%">ZOFT</Text>
        <Divider borderColor="black" borderWidth="1px" />
        </Box>
        <Text fontSize="60%">Powered By Ecopetrol</Text>
      </VStack>
      )}
    <Image alt=""  width='50' height='50' src="/zoft.png"></Image>
    { formType === FormType.SignUp && (
        <VStack spacing={0}>
        <Box>
        <Text className=" font-bold" fontSize="250%">ZOFT</Text>
        <Divider borderColor="black" borderWidth="1px" />
        </Box>
        <Text fontSize="70%">Powered By Ecopetrol</Text>
      </VStack>
      )}
      </HStack>
      </Box>
    </HStack>

*/
