"use client";

import { getData, saveAppData } from "@/app/_lib/database/app_data";
import { selectBills } from "@/app/_lib/database/base_bills";
import { selectInvoice_data } from "@/app/_lib/database/invoice_data";
import { selectProfiles } from "@/app/_lib/database/profiles";
import MainButton from "@/app/_ui/component_items/MainButton";
import { CreatelargeDomain, CreateSmallDomain } from "@/app/_ui/CreateDomain";
import { CreatelargeAdmin } from "@/app/_ui/Createstate";
import { CreateLargeUser, CreateSmallUser } from "@/app/_ui/CreateUser";
import { handleExport } from "@/app/_ui/ExportButton";
import { ImportDataBase } from "@/app/_ui/ImportDataBase";
import { Tracking_bd } from "@/app/_ui/Tracking_bd";
import { useSharedState } from "@/app/_ui/useSharedState";
import {
  AddIcon,
  AtSignIcon,
  AttachmentIcon,
  CalendarIcon,
  CheckCircleIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  ExternalLinkIcon,
  SearchIcon,
  SmallCloseIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  ChakraProvider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
  useMediaQuery,
  Tooltip,
} from "@chakra-ui/react";
import "handsontable/dist/handsontable.full.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUserCheck } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";

function _formatCurrency(number: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

export default function Admin() {
  const { state, updateState } = useSharedState();
  const [MenuL, setMenuL] = useState(true);
  const [AddDomain, setAddDomain] = useState(false);
  const [isInicio, setisInicio] = useState(true);
  const [isRegistro, setisRegistro] = useState(false);
  const [isUsuario, setisUsuario] = useState(false);
  const [isDominio, setisDominio] = useState(false);
  const [isDatos, setisDatos] = useState(false);
  const [isTracking, setisTracking] = useState(false);
  const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [iMediumScreen] = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
  const [iLargeScreen] = useMediaQuery("(min-width: 1024px)");

  const [showRightBox, setShowRightBox] = useState(false);
  const [PendingUsers, setPendingUsers] = useState(0)
  const [Pendingbills, setPendingbills] = useState(0)

  const obtenerValorDesdeDB = async () => {
    try {
      const users = await selectProfiles({ limit: 200, page: 1, equals: { user_role: "guest" } });
      const bills = await selectInvoice_data({ limit: 200, page: 1, equals: { state: "pending" } });
  

  
      // Verificar si 'users' es un array y tiene elementos
      if (Array.isArray(users) && users.length > 0) {
    
        setPendingUsers(users.length);
  
      } else {
      
        setPendingUsers(0);
      }
  
   
  
      // Verificar si 'bills' es un array y tiene elementos
      if (Array.isArray(bills) && bills.length > 0) {
 
      
        // Verificar que el primer elemento tiene 'supplier_id' definido
        if (bills[0].supplier_id !== undefined) {
      
          setPendingbills(bills.length);
     
        } else {
    
          setPendingbills(0);
        }
      } else {
        setPendingbills(0);
      }
  
    } catch (error) {
      console.error("Error al obtener datos desde la base de datos:", error);
    }
  };
  
  useEffect(() => {

      // Llama a obtenerValorDesdeDB una vez para obtener el valor inicial
   
      obtenerValorDesdeDB()

    // Configura un intervalo para llamar a obtenerValorDesdeDB cada 60 segundos
    const intervalo = setInterval(obtenerValorDesdeDB, 10000);

    // Limpia el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalo);
 

  }, []);
  

  const screen = (numero: number) => {
    if (numero == 1) {
      setisRegistro(true);
      setisDatos(false);
      setisDominio(false);
      setisUsuario(false);
      setisInicio(false);
      setisTracking(false);
    }
    if (numero == 2) {
      setisRegistro(false);
      setisDatos(false);
      setisDominio(false);
      setisUsuario(true);
      setisInicio(false);
      setisTracking(false);
    }
    if (numero == 3) {
      setisRegistro(false);
      setisDatos(false);
      setisDominio(true);
      setisUsuario(false);
      setisInicio(false);
      setisTracking(false);
    }
    if (numero == 4) {
      setisRegistro(false);
      setisDatos(true);
      setisDominio(false);
      setisUsuario(false);
      setisInicio(false);
      setisTracking(false);
    }
    if (numero == 5) {
      setisRegistro(false);
      setisDatos(false);
      setisDominio(false);
      setisUsuario(false);
      setisInicio(false);
      setisTracking(true);
    }
  };
  const router = useRouter();
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

  

  const toggleActive = () => {
    setMenuL((prevState) => !prevState);
  };

  const handleVisibilityChange = (visible: any) => {
    setShowRightBox(visible);
  };

  const [isVisible, setIsVisible] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = async (visibledata: any) => {
    setIsLoading(true);
    setError(null);
    onOpen();

    try {
      console.log(state.TRMNUM);
      await handleExport(visibledata);
    } catch (err) {
      setError("Error al generar el archivo CSV.");
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const {
    isOpen: isOpenSecondModal,
    onOpen: onOpenSecondModal,
    onClose: onCloseSecondModal,
  } = useDisclosure();

  const [InputUSD, setInputUSD] = useState("");
  const [InputEUR, setInputEUR] = useState("");
  const [updatedValue, setUpdatedValue] = useState("");

  // Manejo del cambio en el input
  const handleInputChangeUSD = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputUSD(event.target.value);
  };
  const handleInputChangeEUR = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputEUR(event.target.value);
  };

  const handleApply = async () => {
    const TRMUSD = JSON.parse(InputUSD);
    const TRMEUR = JSON.parse(InputEUR);
    console.log("USD:", TRMUSD)
    console.log("EUR:", TRMEUR)

    const USD = await saveAppData({value: TRMUSD, key: "trm_usd"});
    console.log("Pasamos por aqui 1")
    const EUR = await saveAppData({value: TRMEUR, key: "trm_eur"})
    console.log("Pasamos por aqui 2")
    onCloseSecondModal();
  };

  const bring_TRM = async () => {
    try{
      const USD = await getData("trm_usd")
    const EUR = await getData("trm_eur")
    if (USD[0].value !== null && USD[0].value !== undefined) {
      setInputUSD(USD[0].value.toString()); // Convierte el número a cadena
    } else {
      setInputUSD("0"); // Asigna un valor por defecto si es null
    }
    if (EUR[0].value !== null && EUR[0].value !== undefined) {
      setInputEUR(EUR[0].value.toString()); // Convierte el número a cadena
    } else {
      setInputEUR("0"); // Asigna un valor por defecto si es null
    } 
    } catch{

    }   
    onOpenSecondModal()
  }

  

  return (
    <ChakraProvider>
      <div className="w-full h-full flex justify-center items-center p-4 bg-gradient-to-tr from-green-900 to-green-700">
        <div
          className={`relative flex w-full max-w-6xl   `}>
            <Box position="relative">
 

 

      
    </Box>
             
          {/* Caja Principal */}
          <div
            className={`relative p-4 bg-gradient-to-tr from-gray-200 to-gray-300 border border-gray-300 text-center rounded-3xl shadow-md  ${showRightBox ? "md:w-2/3" : "w-full"} flex flex-col `}>
            <Flex
              width="100%"
              alignItems="center"
              justifyContent="space-between"
              paddingLeft={0}
              paddingRight={4}
              paddingBottom={4}
              paddingTop={4}
              bg="gray.100"
              className="rounded-2xl"
              position="relative">
              <Box position="absolute" right={4}>
              
                <Menu>
                <MenuButton
    as={Button} // Usa Button como el elemento base para MenuButton
    colorScheme="teal"
    backgroundColor="#F1D803"
  >
    <Icon as={IoMenu} w={5} h={5} color="black" />
  </MenuButton>
                    <MenuList>
                      <MenuItem icon={<AddIcon color="black" />}>
                        Colaboradores
                      </MenuItem>
                      <MenuItem
                        onClick={bring_TRM}
                        icon={<EditIcon color="black" />}>
                        Actualizar TRM
                      </MenuItem>
                      <MenuItem
                        onClick={handleLogout}
                        icon={<SmallCloseIcon color="red.500" />}>
                        Cerrar Sesíon
                      </MenuItem>
                    </MenuList>
                  
                  
                </Menu>
              </Box>
              <Box flex={1} textAlign="center">
                <Text fontSize="xl" fontWeight="bold">
                  Administrador
                </Text>
              </Box>
              <Box position="absolute"  >
              <HStack>
                <Image
                  src={iSmallScreen ? "/grupo-ecopetrol-Small.png" : "/grupo-ecopetrol.png"} 
                  alt="Descripción de la imagen"
                  w={iSmallScreen ? "120px" : "270px"}
                  h={iSmallScreen ? "50px" : "60px"}
                  borderTopLeftRadius="2xl"  // Redondea solo el lado superior izquierdo
                  borderBottomLeftRadius="2xl"  // Redondea solo el lado inferior izquierdo
                />
              </HStack>
              </Box>
            </Flex>
            {/*xl:max-h-[550px] */}
            <HStack height="100%" mt={3} spacing={2} align="stretch" className=" [@media(max-width:1430px)]:max-h-[450px] [@media(min-width:1440px)]:max-h-[500px] ">
              <VStack
                justify="center"
                width={MenuL ? "7%" : "15%"}
                bg="white"
                border="1px"
                borderColor="gray.300"
                backgroundColor="gray.100"
                borderRadius="md"
                p={iSmallScreen ? "1" : "3"}
                align="center"
                transition="width 0.3s ease-in-out">
                <VStack height={iLargeScreen ? "" : "60%"}   justify={iLargeScreen ? "center" : ""}>
                  <MainButton
                    onClick={() => screen(1)}
                    text="Gestion de OCs"
                    icon={
                      <SearchIcon
                        w={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                        h={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                        backgroundColor={iSmallScreen ? isRegistro ? "teal" : "#F1D803" : ""}
                        padding={iSmallScreen ? "5px" : "" }
                        color="black"
                      />
                   
                    }
                    
                    backgroundColor={iSmallScreen  ? "transparent" : isRegistro ? "teal" : "#F1D803"}
                    showRightBox={showRightBox}
                    isScreenSmall={iSmallScreen}
                    MenuL={MenuL}
                    isDisabled={state.ButtonDisabled}
                  />
                  <MainButton
                    onClick={() => screen(2)}
                    text="Autorizacion de Usuarios"
                    icon={<CheckCircleIcon 
                      w={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                        h={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                        backgroundColor={iSmallScreen ? isUsuario ? "teal" : "#F1D803" : ""}
                        padding={iSmallScreen ? "5px" : "" }
                        color="black"
                       />}
                    backgroundColor={iSmallScreen ? "transparent" : isUsuario ? "teal" : "#F1D803"}
                    showRightBox={showRightBox}
                    isScreenSmall={iSmallScreen}
                    MenuL={MenuL}
                    isDisabled={state.ButtonDisabled}
                  />
                  <MainButton
                    onClick={() => screen(3)}
                    text="Dominios"
                    icon={<AtSignIcon
                      w={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                      h={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                      backgroundColor={iSmallScreen ? isDominio ? "teal" : "#F1D803" : ""}
                      padding={iSmallScreen ? "5px" : "" }
                      color="black"
                       />}
                    backgroundColor={iSmallScreen ? "transparent" : isDominio ? "teal" : "#F1D803"}
                    showRightBox={showRightBox}
                    isScreenSmall={iSmallScreen}
                    MenuL={MenuL}
                    isDisabled={state.ButtonDisabled}
                  />
                  <MainButton
                    onClick={() => screen(4)}
                    text="Base de Datos"
                    icon={<AttachmentIcon
                      w={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                      h={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                      backgroundColor={iSmallScreen ? isDatos ? "teal" : "#F1D803" : ""}
                      padding={iSmallScreen ? "5px" : "" }
                      color="black"
                      />}
                    backgroundColor={iSmallScreen ? "transparent" : isDatos ? "teal" : "#F1D803"}
                    showRightBox={showRightBox}
                    isScreenSmall={iSmallScreen}
                    MenuL={MenuL}
                    isDisabled={state.ButtonDisabled}
                  />

<MainButton
                    onClick={() => screen(5)}
                    text="Archivo de Seguimiento"
                    icon={<ExternalLinkIcon
                      w={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                      h={iSmallScreen ? "25px" : iMediumScreen ? "12px" : "14px"}
                      backgroundColor={iSmallScreen ? isTracking ? "teal" : "#F1D803" : ""}
                      padding={iSmallScreen ? "5px" : "" }
                      color="black"
                      />}
                    backgroundColor={iSmallScreen ? "transparent" : isTracking ? "teal" : "#F1D803"}
                    showRightBox={showRightBox}
                    isScreenSmall={iSmallScreen}
                    MenuL={MenuL}
                    isDisabled={state.ButtonDisabled}
                  />
                  
                </VStack>
                <VStack height="40%"></VStack>
                
             
                  <VStack
                    justify="center"
                    align="center"
                    bg={iSmallScreen  ? "transparent" : "gray.200"}
                    spacing="20%"
                    height="20%">
                    <Tooltip label={PendingUsers > 0 ? "Hay Usuarios pendientes" : ""}>
                    <Button
                    onClick={() => screen(2)}
                      position="relative"
                      colorScheme="transparent"
                      bg="transparent"
                      isDisabled={state.ButtonDisabled}
                      >
                      {(PendingUsers > 0) && (
                        <Text
                        bottom="5"
                        borderRadius="100"
                        backgroundColor="red"
                        right="1"
                        position="absolute"
                        color="white">
                        {PendingUsers}
                      </Text>
                      )}
                      <Icon w={4} h={4} color="black" as={FaUserCheck} />
                      
                    </Button>
                    </Tooltip>
                    <Tooltip label={Pendingbills > 0 ? "Hay Registros pendiente": ""}>
                    <Button
                    onClick={() => screen(1)}
                      position="relative"
                      colorScheme="transparent"
                      bg="transparent"
                      isDisabled={state.ButtonDisabled}
                      >
                      {(Pendingbills > 0) && (
                        <Text
                        bottom="5"
                        borderRadius="100"
                        backgroundColor="red"
                        right="1"
                        position="absolute"
                        color="white">
                        {Pendingbills}
                      </Text>
                      )}
                      <CalendarIcon w={4} h={4} color="black" />
                    </Button>
                    </Tooltip>
                  </VStack>
             
              </VStack>
              <VStack
                overflow="auto"
                flex="1"
                width="100%"
                height="500"
                bg="white"
                border="1px"
                borderColor="gray.300"
                borderRadius="md"
                className=" p-3 [@media(max-width:1430px)]:max-h-[450px]  [@media(min-width:1440px)]:max-h-[500px] "
                align="stretch">
              
                {isRegistro &&
                  !isUsuario &&
                  !isDominio &&
                  !isDatos &&
                  !isTracking && (
                    <>
       
                        <CreatelargeAdmin
                          sharedState={state}
                          updateSharedState={updateState}
                        />
                
                      
                    </>
                  )}
                {!isRegistro &&
                  isUsuario &&
                  !isDominio &&
                  !isDatos &&
                  !isTracking && (
                    <>
                     <CreateLargeUser />
  
                    </>
                  )}
                {!isRegistro &&
                  !isUsuario &&
                  isDominio &&
                  !isDatos &&
                  !isTracking && (
                    <>
                      <CreatelargeDomain />
 
                    </>
                  )}
                {!isRegistro &&
                  !isUsuario &&
                  !isDominio &&
                  isDatos &&
                  !isTracking && (
                    <>
                    
                       
                          <ImportDataBase 
                          sharedState={state}
                          updateSharedState={updateState}
                          />
                       
                      
                      
                    </>
                  )}
                  {!isRegistro &&
                  !isUsuario &&
                  !isDominio &&
                  !isDatos &&
                  isTracking && (
                    <>
                    
                       
                          <Tracking_bd />
                       
                      
                      
                    </>
                  )}
                  {!isRegistro &&
                  !isUsuario &&
                  !isDominio &&
                  !isDatos &&
                  !isTracking && (
                    <>

                       
                          <VStack justify="center" align="center" width="100%" height="100%">
                            <Text className=" font-bold" textColor="gray.500" fontSize="200%">ZOFT</Text>
                            <Image
                            src="/iconogriss.png" 
                            alt="icongray"
                            w="150px"
                            h="150px"
                            />
                            <Text className=" font-bold" textColor="gray.500" fontSize="80%">El gestor de facturación que necesitas</Text>
                          </VStack>
                       
                      
                      
                    </>
                  )}
                
                  
              </VStack>
            </HStack>

            <Modal isOpen={isOpenSecondModal} onClose={onCloseSecondModal}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Actualizar TRM</ModalHeader>
                <ModalBody>
                  <FormControl>
                    <FormLabel>TRM USD (dolares)  <Text as="span" fontWeight="bold">USD → COP</Text></FormLabel>
                    <Input
                      type="number"
                      value={InputUSD}
                      onChange={handleInputChangeUSD}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>TRM EUR (euros)   <Text as="span" fontWeight="bold">USD → EUR</Text></FormLabel>
                    <Input
                      type="number"
                      value={InputEUR}
                      onChange={handleInputChangeEUR}
                    />
                  </FormControl>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="teal" backgroundColor="#F1D803" textColor="black" onClick={handleApply}>
                    Aplicar
                  </Button>
                  <Button  backgroundColor="red" textColor="white" onClick={onCloseSecondModal} ml={3}>
                    Cerrar
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalContent>
                <ModalHeader>Exportando CSV</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  {isLoading ?
                    "Generando archivo..."
                  : "Archivo generado exitosamente."}
                  {error && <p className="text-red-500">{error}</p>}
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Cerrar
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </div>

          {AddDomain && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50  transition-opacity duration-300">
              <div className="bg-white p-4 w-5/6 max-w-md border text-center border-gray-300 rounded-3xl shadow-md relative z-20 ">
                <h2 className="text-xl font-bold mb-4">Asociar factura</h2>
                <p className="font-medium text-lg text-gray-500">
                  Digite el dominio a agregar
                </p>
                <Input placeholder="Dominio"></Input>
                <Box
                  width="70%"
                  height="150"
                  className=" mb-4 "
                  overflow="auto"></Box>
                <HStack
                  textAlign="center"
                  justifyContent="center"
                  alignItems="center">
                  <Button
                    bg="red"
                    textColor="white"
                    className="mt-4 px-4 py- rounded"
                    onClick={() => setAddDomain(false)}>
                    Cancelar
                  </Button>
                  <Button
                    backgroundColor="#F1D803"
                    className="mt-4 px-4 py-2 rounded"
                    onClick={() => setAddDomain(false)}>
                    Agregar
                  </Button>
                </HStack>
              </div>
            </div>
          )}
        </div>
      </div>
    </ChakraProvider>
  );
}


