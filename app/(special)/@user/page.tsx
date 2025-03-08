'use client'
import React, { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import {
  Flex,
  Box,
  Stack,
  HStack,
  VStack,
  Button,
  Text,
  Heading,
  ChakraProvider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Image,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  SmallCloseIcon,
  DeleteIcon,
  RepeatClockIcon,
  LinkIcon,
  ArrowBackIcon,
} from "@chakra-ui/icons";
import { Associate_invoice } from "@/app/_ui/Associate_invoice";
import { CreatelargeAdmin } from "@/app/_ui/Createstate";
import { useSharedState } from "@/app/_ui/useSharedState";
import { userData } from "@/app/_lib/database/currentUser";
import { getProfile } from "@/app/_lib/database/profiles";
import { selectSingleSupplier } from "@/app/_lib/database/suppliers";
import { selecSupplierEmployeeByProfileId } from "@/app/_lib/database/supplier_employee";
import { FaUser } from "react-icons/fa";

export default function Userpage() {
  const { state, updateState } = useSharedState();
  const [showRightBox, setShowRightBox] = useState(false);
  const [isinicio, setisinicio] = useState(false);
  const [State, setState] = useState(false);
  const [Add, setAdd] = useState(false);
  const [name, setname] = useState("");
  const [suppliers, setsuppliers] = useState("");
  const [email, setemail] = useState("");
  


  function transformName(name: string) {
     // 1. Limpiar espacios y normalizar
  const cleaned = name
  .trim() // Eliminar espacios al inicio y final
  .replace(/\s+/g, ' ') // Colapsar múltiples espacios a uno solo
  .replace(/^\s+|\s+$/g, ''); // Eliminar espacios sobrantes nuevamente

if (!cleaned) return '';

// 2. Dividir en palabras
const words = cleaned.split(' ');

// 3. Aplicar reglas según cantidad de palabras
if (words.length === 1) {
  // Caso 1: Una sola palabra
  return words[0].substring(0, 10);
} else {
  // Caso 2: Dos o más palabras (tomamos solo las primeras dos)
  const [first, second] = words.slice(0, 2);
  const combinedLength = first.length + second.length;

  // 3a. Si la suma de caracteres <= 10
  if (combinedLength <= 10) {
    // Verificar si la primera palabra excede 8 caracteres
    const adjustedFirst = first.length > 8 ? first.substring(0, 8) : first;
    return `${adjustedFirst} ${second}`.substring(0, 10 + 1); // +1 por el espacio
  }
  // 3b. Si la suma excede 10 caracteres
  else {
    const truncatedFirst = first.substring(0, 8);
    const processedSecond = second[0] ? `${second[0]}.` : '';
    return `${truncatedFirst} ${processedSecond}`;
  }
}
}

/*console.log(transformName("jhoy castro"))
console.log(transformName("jhoy castro casanova"))
console.log(transformName("jhoy casanova"))
console.log(transformName("jhoyluis castro"))
console.log(transformName("jhoylasq castro"))*/

  const handleLogout = async () => {
    try {
      const response = await fetch("/logout", {
        method: "GET",
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Failed to log out");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const screen = (numero: number) => {
    if (numero == 1) {
      setAdd(true);
      setState(false);
    }
    if (numero == 2) {
      setAdd(false);
      setState(true);
    }
  };

  const Asociar = () => {
    setisinicio(false);
  };


  const router = useRouter();

  const [inputValue, setInputValue] = useState("");


  
  useEffect(() => {
    const Data = async () => {
      const user = await userData()
      setname(user?.data?.user?.identities?.[0].identity_data?.username)
      if(user?.data?.user?.identities?.[0].id){
        const proveedor = await selecSupplierEmployeeByProfileId(user?.data?.user?.identities?.[0].id)
      const prove = await selectSingleSupplier(proveedor[0].supplier_id)
      setsuppliers(prove.name)
      }
      setemail(String(user?.data?.user?.email))
      

      
      //console.log(user.data.user?.identities[0].identity_data.username)
      //console.log(user.data.user?.identities[0].identity_data)
    }
    Data()
  },[])

  return (
    <ChakraProvider>
      <div className=" flex w-full h-screen items-center justify-center lg:w-full bg-gradient-to-tr from-green-900 to-green-700 ">
        {!isinicio ?
          <Box className="bg-gray-200 relative px-10 py-10 rounded-3xl lg:w-96 lg:h-30">
            <Stack>
              <VStack>
              <HStack className=" bg-gray-400 rounded-2xl px-2">
                <Image
                  src="/grupo-ecopetrol.png" 
                  alt="Descripción de la imagen"
                  w="270px"
                  h="80px"

                />
                
              </HStack>
                <HStack >
                  <VStack width="22%">
                  <Heading marginLeft="10%">ZOFT</Heading>
                  </VStack>
                  <VStack width="5%">

                  </VStack>
                  <VStack justify="start" align="start" textAlign="start" width="50%" spacing={0}>
                <Text fontSize="60%" color="black">
                  Sofware de Facturacion
                </Text>
                <Text fontSize="60%" color="black">
                  By Ecopetrol
                </Text>
                </VStack>
                <VStack width="13%">

                </VStack>
                  <VStack width="5%">
                  <Menu placement="right">
                    <MenuButton style={{ marginLeft: "7%" }}>
                      <HamburgerIcon w={8} h={8} color="black" />
                    </MenuButton>
                    <MenuList>
                    <HStack mb="4px" justify="center" align="center" >
                <FaUser width={5} height={5}></FaUser>
                <Text  color="black">
                  {transformName(name)}
                </Text>
                </HStack>
                      <MenuItem icon={<DeleteIcon color="red.500" />}>
                        Eliminar Cuenta
                      </MenuItem>
                      <MenuItem
                        onClick={handleLogout}
                        icon={<SmallCloseIcon color="black" />}>
                        Cerrar Sesíon
                      </MenuItem>
                    </MenuList>
                  </Menu>
                  </VStack>
                </HStack>
                <VStack marginTop="1%" align="stretch">
                  <Button
                    onClick={() => (setisinicio(true), screen(2))}
                    style={{ marginTop: "20%" }}
                    colorScheme="teal"
                    backgroundColor="#F1D803">
                    <HStack>
                      <Text color="black">Estado de Facturas</Text>
                      <RepeatClockIcon w={5} h={5} color="black" />
                    </HStack>
                  </Button>
                  <Button
                    onClick={() => (setisinicio(true), screen(1))}
                    style={{ marginBottom: "40%", marginTop: "10%" }}
                    colorScheme="teal"
                    backgroundColor="#F1D803">
                    <HStack>
                      <Text color="black">Asociar Facturas</Text>
                      <LinkIcon marginLeft="7%" w={5} h={5} color="black" />
                    </HStack>
                  </Button>
                </VStack>
              </VStack>
            </Stack>
            <VStack spacing={0}  align="center" justify="center" textAlign="center">
            <Heading fontSize="80%">Proveedor Asociado</Heading>
            <Heading fontSize="80%">{suppliers}</Heading>
            </VStack>
          </Box>
        : <>
            <div
              className={`relative p-4 bg-gray-100 border border-gray-300 text-center h-[82%] w-[80%]  rounded-3xl shadow-md flex flex-col`}>
              {Add === true && (
                <Associate_invoice
                  setisTable={setisinicio}
                  invoi={""}
                  isTable={"Create"}
                  sharedState={state}
                  updateSharedState={updateState}
                />
              )}
              {State === true && (
                <>
                  <Flex
                    width="100%"
                    alignItems="center"
                    justifyContent="space-between"
                    p={2}
                    className="rounded-2xl"
                    position="relative">
                    <Box position="absolute" left={1}>
                      <Button
                        onClick={() => setisinicio(false)}
                        mb={2}
                        colorScheme="teal"
                        backgroundColor="#F1D803">
                        <ArrowBackIcon width={5} height={5} color="black" />
                      </Button>
                    </Box>
                    <Box flex={1} textAlign="center">
                      <Text fontSize="xl" fontWeight="bold">
                        Estado Factura
                      </Text>
                    </Box>
                  </Flex>

                  <CreatelargeAdmin
                    sharedState={state}
                    updateSharedState={updateState}
                  />
                </>
              )}
            </div>
          </>
        }
      </div>
    </ChakraProvider>
  );
}

/*{showRightBox && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-4 w-5/6 max-w-md border text-center border-gray-300 rounded-3xl shadow-md relative z-20 ">
                      <h2 className="text-xl font-bold mb-4">Asociar Factura</h2>
                      <p>Ingrese el orden de factura a asociar</p>
                      <Input type="number" value={inputValue}  onChange={handleInputChange}  width="70%" placeholder="Orden de Factura"></Input>
                      
                      <HStack mt={5} justify="center" align="center">
                        <Button 
                          colorScheme='teal'
                          bgColor="red.500"
                          textColor="white"
                          className=" px-4 py-2 rounded"
                          onClick={() => setShowRightBox(false)}
                        >
                          Cerrar
                        </Button>
                        <Button 
                          colorScheme='teal' backgroundColor='#F1D803'
                          textColor="black"
                          className=" px-4 py-2   rounded"
                          onClick={handleClick}
                        >
                          Buscar
                        </Button>
                      </HStack>
                    </div>
                  </div>
                )}

                */
