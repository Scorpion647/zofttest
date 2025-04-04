'use client'
import { Box, ChakraProvider, Divider, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { useState } from "react"; // Importar useState para manejar el estado

export default function GuestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

 

  return (
    <>
    <ChakraProvider>
      <Box className="   justify-items-center align-top z-50 w-full top-0  absolute">

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
          alignItems="center"
        >
          <HStack>
            <VStack spacing={0}>
              <Box>
                <Text className=" font-bold" fontSize="200%">ZOFT</Text>
                <Divider borderColor="black" borderWidth="1px" />
              </Box>
              <Text fontSize="60%">Powered By Ecopetrol</Text>
            </VStack>
            <Image alt="" width='50' height='50' src="/zoft.png"></Image>

          </HStack>
        </Box>

      </Box>
    </ChakraProvider>
    <div className="flex w-full h-screen items-center justify-center lg:w-full bg-gradient-to-tr from-green-900 to-green-700">


        <Box bgColor="white" className="rounded-2xl p-12 lg:w-[40%] sm:w-[60%] w-[80%] h-[50%] lg:h-[46%] sm:h-[50%] content-center">
          <HStack justify="center" h="20%">
            <HStack  className=" bg-gray-400">
              <Image
                src="/grupo-ecopetrol.png"
                alt="Descripción de la imagen"
                w="260px"
                h="80px" />

            </HStack>
          </HStack>

          <VStack h="10%"></VStack>

          <VStack justify="center" h="40%" align="center">
            <Text className="font-semibold text-start" fontSize="90%">
              Hola Estimado Usuario
            </Text>
            <Text fontSize="90%">
              Por favor espera a que el administrador valide tu información para acceder.
            </Text>
          </VStack>

          <VStack className="mt-5 lg:mt-0 sm:mt-3" textAlign="center" justify="center" h="20%">
            <Text className=" font-semibold" fontSize="80%">
              Comuniquese con el administrados para que valide su identidad.
            </Text>

          </VStack>

          <VStack h="10%"></VStack>
        </Box>



      </div>
      </>
  );
}

