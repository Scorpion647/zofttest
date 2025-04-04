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
  Tooltip,
  Skeleton,
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
import { getProfile, removeUser } from "@/app/_lib/database/profiles";
import { selectSingleSupplier } from "@/app/_lib/database/suppliers";
import { selecSupplierEmployeeByProfileId } from "@/app/_lib/database/supplier_employee";
import { FaUser } from "react-icons/fa";
import { selectInvoice_data } from "@/app/_lib/database/invoice_data";



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
      cache: "no-store", // para evitar respuestas en caché
    });

    if (response.ok) {
      // Forzar la actualización del estado en el cliente
      router.refresh();
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

  const [Squeleton, setSqueleton] = useState(true);
  const [idsup, setidsup] = useState(-1);
  const [pensup, setpensup] = useState(0);
  const [rechsup, setrechsup] = useState(0);
  const [cantporuser, setcantporuser] = useState(0);
  const [iduser, setiduser] = useState("");



  
  useEffect(() => {

    const Data = async () => {
      const user = await userData()
      setname(user?.data?.user?.identities?.[0].identity_data?.username)
      if(user?.data?.user?.identities?.[0].id){
        const proveedor = await selecSupplierEmployeeByProfileId(user?.data?.user?.identities?.[0].id)
        setiduser(user?.data?.user?.identities?.[0].id)
      if(!proveedor[0]?.supplier_id) return
      setidsup(proveedor[0]?.supplier_id)
      const prove = await selectSingleSupplier(proveedor[0]?.supplier_id)
      setsuppliers(prove.name)
      }
      setemail(String(user?.data?.user?.email))
      

      
      //console.log(user.data.user?.identities[0].identity_data.username)
      //console.log(user.data.user?.identities[0].identity_data)
      //lg:w-96 lg:h-30
    }
    Data()
  },[])


  const deleteAccount = async () => {
    // Mostrar confirmación con el diálogo nativo del navegador
    const confirmacion = window.confirm("¿Estás seguro que deseas eliminar tu cuenta? Esta acción es irreversible.");
  
    // Si el usuario cancela, detenemos el proceso
    if (!confirmacion) return;
  
    // Si confirma, ejecutamos la eliminación
    try {

      const deleteac = await removeUser(iduser)
      console.log(deleteac)
      
      console.log("Cuenta eliminada exitosamente");
    } catch (error) {
      console.error("Error eliminando la cuenta:", error);
      alert("Ocurrió un error al eliminar la cuenta");
    }
  };
  const supplierData = async () => {
    setSqueleton(true)
    //const total = selectBills({limit: 300,page: 1, equals: {supplier_id: idsup}})
    //const approved = selectInvoice_data({ limit: 300, page: 1, equals: {supplier_id: idsup, state: "approved"}})
    const pending = selectInvoice_data({ limit: 300, page: 1, equals: {supplier_id: idsup, state: "pending"}})
    const rejected = selectInvoice_data({ limit: 300, page: 1, equals: {supplier_id: idsup, state: "rejected"}})
    const poruser = selectInvoice_data({ limit: 300, page: 1, equals: {supplier_id: idsup, last_modified_by: iduser}})
    setcantporuser((await poruser).length)
    setpensup((await pending).length)
    setrechsup((await rejected).length)
    setSqueleton(false)
  }
  
  useEffect(() => {

  },[])

  useEffect(() => {
    if(!isinicio){
      let isMounted = true;
  
    const startPolling = async () => {
      while (isMounted) {
        if (idsup > -1) {
          await supplierData();
          break; // Sale del bucle si tiene éxito
        } else {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    };
  
    startPolling();
  
    return () => {
      isMounted = false; // Evita actualizaciones si el componente se desmonta
    };
    }
  }, [isinicio,idsup]); // Vuelve a ejecutar cuando cambien estas variables


  return (
    <ChakraProvider>
      <div className=" flex w-full h-screen items-center justify-center lg:w-full bg-gradient-to-tr from-green-900 to-green-700 ">
        {!isinicio ?
          <HStack spacing={6}>
            <Box className="bg-gray-200 relative px-10 py-10 rounded-3xl ">
            <Stack>
              <VStack>
              <HStack justify="center" align="center" >
              <Image
                  src="/zoft.png" 
                  alt="ZOFT"
                  w="55px"
                  h="55px"

                />
                  <VStack spacing={0}>
                  <Heading >ZOFT</Heading>
                  <Text fontSize="60%" color="black">
                  Powered by Ecopetrol
                </Text>
                  </VStack>
                  
                  
                
                  
                </HStack>
              <HStack className=" bg-gray-300 rounded-2xl px-2">
                <Image
                  src="/grupo-ecopetrol.png" 
                  alt="Grupo Ecopetrol"
                  w="270px"
                  h="80px"

                />
                
              </HStack>
                
                <HStack width="95%" className="bg-yellow-300 rounded-2xl px-2" padding={5} marginTop="10%" marginBottom="10%" align="stretch" spacing={5}>
                  
                  <VStack width="70%" justify="start" textAlign="start" align="start">
                  
                  <Text className=" font-bold" fontSize="70%">OC pendientes de revision: </Text>
                  <Text className=" font-bold" fontSize="70%">OC rechazados: </Text>
                  <Text className=" font-bold" fontSize="70%">OC creados por ti: </Text>
                  
                  
                  </VStack>
                  <VStack align="stretch" textAlign="center" width="30%">
                  <Skeleton isLoaded={!Squeleton}>
                  <Text className=" font-bold" fontSize="70%">{pensup.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Text>
                    </Skeleton>
                    <Skeleton isLoaded={!Squeleton}>
                    <Text className=" font-bold" fontSize="70%">{rechsup.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Text>
                  </Skeleton>
                  <Skeleton isLoaded={!Squeleton}>
                  <Text className=" font-bold" fontSize="70%">{cantporuser}</Text>
                  </Skeleton>
                  </VStack>
                </HStack>


                
                
                
                
                
                
              </VStack>

            </Stack>

            <HStack marginBottom="10%" align="stretch" justify="center" textAlign="center">
                <Skeleton  isLoaded={!Squeleton}>
                <HStack >
                <FaUser width={5} height={5}></FaUser>
                <Tooltip label={name}>
                <Text  fontSize="80%">{(name ? transformName(name) : "Invalido" )}</Text>
                </Tooltip>
                </HStack>
                </Skeleton>
                </HStack>
            <VStack  spacing={0}  align="stretch" justify="center" textAlign="center">
            <Heading fontSize="80%">Proveedor Asociado</Heading>
            <Skeleton     isLoaded={!Squeleton}>
            <Heading fontSize="80%">{(suppliers ? suppliers : "No Valido")}</Heading>
            </Skeleton>
            </VStack>
          </Box>




          <Box className="bg-gray-200 relative px-10 py-10 rounded-3xl ">
            <Stack>
              <VStack>
              <HStack className="relative bg-yellow-300 rounded-2xl px-2" width="270px" justify="end" align="end">
              
              <HStack
              position="absolute"
              left="0"
              right="0"
              top="0"
              bottom="0"
              margin="auto"
              justify="center"
              align="center"
              >
                <Text className=" font-bold" fontSize="120%">DASHBOARD</Text>
              </HStack>
              <Menu >
                    <MenuButton zIndex={50} >
                      <HamburgerIcon w={8} h={8} color="black" />
                    </MenuButton>
                    <MenuList>
                    
                      <MenuItem icon={<DeleteIcon color="red.500" />} onClick={deleteAccount}>
                        Eliminar Cuenta
                      </MenuItem>
                      <MenuItem
                        onClick={handleLogout}
                        icon={<SmallCloseIcon color="black" />}>
                        Cerrar Sesíon
                      </MenuItem>
                    </MenuList>
                  </Menu>
              </HStack>
              <HStack className=" h-[43px]"></HStack>
                <Text fontSize="110%" className=" font-bold">OPCIONES DE FACTURA</Text>
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
            <Heading marginTop="7%" fontSize="80%">© {new Date().getFullYear()} Reficar - Todos los derechos reservados.</Heading>
            </VStack>
          </Box>
          </HStack>
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

