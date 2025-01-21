'use client'
import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react";
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
    <div className="flex w-full h-screen items-center justify-center lg:w-full bg-gradient-to-tr from-green-900 to-green-700">
      <Box bgColor="white" className="rounded-2xl p-12 lg:w-[40%] sm:w-[60%] w-[80%] h-[50%] lg:h-[46%] sm:h-[50%] content-center">
        <HStack justify="center" h="20%">
          <HStack display="inline-flex" className="p-4 bg-gray-400">
            <Image
              src="/grupo-ecopetrol.png"
              alt="Descripción de la imagen"
              w="260px"
              h="80px"
            />
            
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
  );
}

