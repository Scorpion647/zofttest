// deno-lint-ignore-file no-unused-vars no-explicit-any
'use client'
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from 'react';
import { useToast, useMediaQuery, Spinner, Tooltip, Select, Flex, Box, VStack, HStack, Button, Text, Input } from "@chakra-ui/react";
import { SearchIcon, AddIcon, ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { selectInvoice_data, selectSingleInvoice } from '@/app/_lib/database/invoice_data'
import { selectSupplierDataByInvoiceID } from '@/app/_lib/database/supplier_data'
import {  selectSingleBill } from '@/app/_lib/database/base_bills'
import ReturnTable from '@/app/_ui/components/ReturnTable'
import { Associate_invoice } from '@/app/_ui/Associate_invoice'
import { getRole } from "../_lib/supabase/client";






function formatDate(dateString: string | number | Date) {
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}




interface SharedState {
  conditionMet: boolean;
  anotherCondition: boolean;
  dataList: any[]; // Cambia `any` al tipo que necesites
  someValue: string;
  onVisibilityChange: boolean;
  columnSum: number;
  SelectedCellValue: any; // Cambia `any` al tipo que necesites
  cantidadespor: number;
  pesopor: number;
  bulto: number;
  bultos: number;
  pesototal: number;
  factor: number;
  TRM: boolean;
  valorTRM: number;
  descripcion: string;
  proveedor: string;
  cantidadoc: number;
  preciouni: number;
  factunit: number;
  moneda: string;
  facttotal: number;
  totalfactura: number;
  nofactura: string;
  TRMNUM: number;
  pesostotal: number;
  bultostotal: number;
  totalfacturas: number;
}

// Define el tipo de la función para actualizar el estado
type UpdateState = (key: keyof SharedState, value: any) => void;

// Define las props del componente
interface CreatelargeAdminProps {
  sharedState: SharedState;
  updateSharedState: UpdateState;
}

export const CreatelargeAdmin: React.FC<CreatelargeAdminProps> = ({ sharedState, updateSharedState }) => {









  const [hola, sethola] = useState(false);
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isTable, setisTable] = useState(false);
  const [IsLoading, setIsLoading] = useState(false)
  const [selectedSupplier2, setselectedSupplier2] = useState("")
  const [Role, setRole] = useState("")
  const toast = useToast();


  const [IsAdmin, setIsAdmin] = useState(false)
  interface InvoiceData {
    consecutivo: string;
    orden: string | undefined; // Usa 'string | undefined' si puede ser 'undefined' en caso de error
    fecha: string;
    estado: "pending" | "approved" | "rejected";
  }
  const [filteredData, setFilteredData] = useState<InvoiceData[]>([]);




  useEffect(() => {
    const Validar = async () => {
      const role = await getRole();
      if (role === "administrator") {
        setIsAdmin(true)
      }
    }
    Validar()
  }, []);




  const ShortConsecutivo = (e: any) => {
    const consecutivo = String(e).slice(0, 8)
    return consecutivo
  }

  const PressButton = () => {
    if(currentPage > 1){
      setCurrentPage(1)
    }else{
      fetchData()
    }
  }




  interface InvoiceData {
    consecutivo: string;
    orden: string | undefined;
    fecha: string;
    estado: "pending" | "approved" | "rejected";
  }
  type EqualsType = {
    created_at?: string;
    feedback?: string | null;
    invoice_id?: string;
    last_modified_by?: string | null;
    state?: "pending" | "approved" | "rejected";
    supplier_id?: number;
    updated_at?: string;
  };

  type FilterType = {
    page?: number;
    limit: number;
    orderBy?: {
      column: "created_at" | "updated_at" | "supplier_id" | "feedback" | "invoice_id" | "last_modified_by" | "state";
      options: {
        ascending: boolean;
      };
    };
    equals: EqualsType;
  };

const isFetchingRef = useRef(false);
const [previousfilter,setpreviousfilter] = useState<FilterType>()
const [currentPage, setCurrentPage] = useState(1); // Página inicial
 
 const nextpages = async () => {
  if(!isFetchingRef.current){
    if(nextpage === true){
      setCurrentPage(currentPage + 1)
    }
  }
 }
  
 const previouspages = async () => {
  if(!isFetchingRef.current){
    if(currentPage > 1){
      setCurrentPage(currentPage - 1)
    }
  }
 }
const [previouspage,setpreviouspage] = useState(false)
const [nextpage,setnextpage] = useState(false)



const checkfilter = async (filter: FilterType, atfilter: FilterType) => {
    
    if(JSON.stringify(previousfilter?.orderBy) !== JSON.stringify(filter.orderBy) && JSON.stringify(previousfilter?.equals) !== JSON.stringify(filter.equals) && previousfilter){

      setCurrentPage(1)
      setpreviousfilter(atfilter)
      setpreviouspage(false)
    const invoice = await selectInvoice_data({page: currentPage + 1, limit: filter.limit, orderBy: filter.orderBy, equals: filter.equals });
    if(invoice.length > 0){

      setnextpage(true)
    }else{

      setnextpage(false)
    } 
    return atfilter


    }else if(!previousfilter){

      setpreviousfilter(filter)
      setpreviouspage(false)
    const invoice = await selectInvoice_data({page: 2, limit: 7, orderBy: filter.orderBy, equals: filter.equals });

    if(invoice.length > 0){

      setnextpage(true)
    }else{

      setnextpage(false)
    } 
    return filter
    }
    
  
  const next = await selectInvoice_data({page: currentPage + 1, limit: filter.limit, orderBy: filter.orderBy, equals: filter.equals });
    if(next.length > 0){

      setnextpage(true)
    }else{

      setnextpage(false)
    }
    const prev = await selectInvoice_data({page: currentPage - 1, limit: filter.limit, orderBy: filter.orderBy, equals: filter.equals });
    if(prev.length > 0){

      setpreviouspage(true)
    }else{

      setpreviouspage(false)
    } 
  return filter
}


useEffect(() => {
  if(currentPage > 0){
    fetchData()
  }
},[currentPage])


  const fetchData = async () => {
    setIsLoading(true);
    isFetchingRef.current = true;
    

    let filter: FilterType = { limit: 7, equals: {} };

    try {
      const role = await getRole();
      setRole(role || "");

      if (selectedStatus !== "all") {
        if (!inputValue || inputValue === "") {
          filter = { page: currentPage, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: { state: (selectedStatus === "approved" ? "approved" : (selectedStatus === "pending" ? "pending" : "rejected")) } }
          filter = await checkfilter(filter,{ page: 1, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: { state: (selectedStatus === "approved" ? "approved" : (selectedStatus === "pending" ? "pending" : "rejected")) } })
        } else {
          filter = { page: currentPage, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: { invoice_id: inputValue, state: (selectedStatus === "approved" ? "approved" : (selectedStatus === "pending" ? "pending" : "rejected")) } }
          filter = await checkfilter(filter,{ page: 1, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: { invoice_id: inputValue, state: (selectedStatus === "approved" ? "approved" : (selectedStatus === "pending" ? "pending" : "rejected")) } })
        }
      } else {
        if (!inputValue || inputValue === "") {
          filter = { page: currentPage, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: {} }
          filter = await checkfilter(filter, { page: 1, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: {} })
        } else {
          filter = { page: currentPage, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: { invoice_id: inputValue } }
          filter = await checkfilter(filter, { page: 1, limit: 7, orderBy: { column: "updated_at", options: { ascending: (role === "administrator" ? true : false) } }, equals: { invoice_id: inputValue } })
        }

      }


      const invoice = await selectInvoice_data(filter);

      //const filteredData = data.filter(item => item.isActive); para eliminar, falta ajustar
      const Data: (InvoiceData | null)[] = await Promise.all(
        invoice.map(async (invo: { invoice_id: any; state: any; }) => {
          try {
            const data = await selectSupplierDataByInvoiceID(invo.invoice_id);
            try {
              const record = await selectSingleBill(data[0].base_bill_id);
              //console.log('Record:', record);  // Para verificar el resultado
              return {
                consecutivo: invo.invoice_id,
                orden: record[0]?.purchase_order, // Asegúrate de manejar 'undefined'
                fecha: formatDate(data[0].modified_at),
                estado: invo.state,
              } as InvoiceData; // Asegúrate de que esto se interprete como InvoiceData
            } catch (error) {
              console.error('Error al obtener el registro:', error);
              return null; // Retornar null si falla
            }
          } catch (error) {
            console.error("Error fetching data for invoice", invo.invoice_id, error);
            return null; // Retornar null si falla
          }
        })
      );

      // Filtramos los resultados nulos en caso de error
      setFilteredData(Data.filter((item): item is InvoiceData => item !== null));
    } catch (error) {
      console.error("En algún punto fallamos", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchData()

  }, [isTable, hola]);
  useEffect(() => {
    if(currentPage > 1){
      setCurrentPage(1)
    }else{
      fetchData()
    }
  }, [selectedStatus])

  const [Razon, setRazon] = useState(false)
  const [Type, setType] = useState("View")
  const [codigo, setcodigo] = useState("")
  const [Textv, setTextv] = useState("")
  const [conta, setconta] = useState(0)

  useEffect(() => {
    if (codigo) {
      if (Role === "administrator") {
        setselectedSupplier2(codigo)
        sethola(true)
      } else if (Role === "employee") {
        handleEmployeeActions(codigo)
      }
    }
  }, [codigo, conta])

  const handleEmployeeActions = async (e: string) => {
    const invoice = await selectSingleInvoice(e)
    if (invoice.state === "rejected") {
      setTextv(invoice.feedback || "")
      setRazon(true)
      setType("Edit")
    } else if (invoice.state === "pending") {
      setType("View")
      setisTable(true)
    } else if (invoice.state === "approved") {
      setType("View")
      setisTable(true)
    }
  }

  const ChangeReturn = (e: React.SetStateAction<string>) => {
    setconta(conta + 1)
    setcodigo(e)
  }

  const ChangeHola = () => {
    sethola(false)
  }

  const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [iMediumScreen] = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
  const [iLargeScreen] = useMediaQuery("(min-width: 1024px)");







  return (
    <>

      {!hola && (
        <>
          {!isTable ? (
            <VStack border="1px" borderColor="gray.300" className=" rounded-2xl" overflow="auto" w="100%" bgColor="white" height="100%" justify='flex-start' alignItems="flex-start">
              <Flex w="100%" className="mt-2 mb-1" justify="space-between" align="center">
                <HStack ml={2}>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    width={iSmallScreen ? "60%" : '80%'}
                    border='1px'
                    backgroundColor='white'
                    placeholder="ID Factura"
                  />
                  <Button onClick={PressButton} colorScheme='teal' backgroundColor='#F1D803'>
                    <SearchIcon w={5} h={5} color='black' />
                  </Button>
                </HStack>
                {!iSmallScreen && (
                  <HStack width="20%">

                  </HStack>
                )}

                <Select
                  mr="2"
                  border="1px"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  width={iSmallScreen ? "40%" : "20%"}
                  backgroundColor='white'
                >
                  <option value="all">Todos</option>
                  <option value="approved">Aprobado</option>
                  <option value="pending">Pendiente</option>
                  <option value="rejected">Rechazado</option>
                </Select>
                {(IsAdmin && !iSmallScreen) && (
                  <Button mr="2" onClick={() => (setisTable(true), setType("Create"), setcodigo(""))} colorScheme='teal' backgroundColor='#F1D803'>
                    <AddIcon w={5} h={5} color='black' />
                  </Button>
                )}


              </Flex>
              <HStack borderColor="gray.300" whiteSpace="nowrap" className="rounded-2xl" justifyContent='center' alignItems="center" bg="gray.200" w="100%" h="10%">
                <HStack bgColor="white" align="center" justify="center" w="100%" h="100%">
                  <HStack overflowX="clip" ml='3%' alignItems="center" justify="start" w="30%">
                    <Text ml={4} className="font-bold" fontSize='100%'>ID Fact</Text>
                  </HStack>
                  <HStack alignItems="center" justify="center" w="20%">
                    <Text marginRight={2} className="font-bold" fontSize='100%'>orden</Text>
                  </HStack>
                  <HStack spacing={8} alignItems="center" justify="center" w="30%">
                    <Text marginRight={2} className="font-bold" fontSize='100%'>Fecha</Text>
                  </HStack>
                  <HStack mr='3%' spacing={4} alignItems="center" justify="center" w="30%">
                    <Text className="font-bold" fontSize='100%'>Estado</Text>
                  </HStack>
                </HStack>
              </HStack>
              <Box bgColor="gray.200" overflowY='auto' w="100%" h="100%">
                {IsLoading && (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%" >
                    <Spinner size="xl" />
                    <Text ml={4}>Cargando datos...</Text>
                  </Box>
                )}
                {!IsLoading && (
                  <VStack>
                    <VStack width="100%" >

                    </VStack>
                    {filteredData.map((item) => (
                      <VStack w="100%" key={item.orden}>
                        <Button
                          onClick={() => ChangeReturn(item.consecutivo)}
                          whiteSpace="nowrap"
                          paddingRight={2}
                          paddingLeft={2}
                          justifyContent="center"
                          alignItems="center"
                          className="rounded-2xl"
                          bg="gray.200"
                          w="100%"
                          h="10"
                        >
                          <HStack className="rounded-2xl" bgColor="white" align="center" justify="center" w="100%" h="100%">
                            <HStack ml="3%" alignItems="center" justify="start" w="30%">
                              <Tooltip label={item.consecutivo} aria-label={item.consecutivo}>
                                <Text
                                  className="font-bold"
                                  fontSize="100%"
                                  onClick={(event) => {
                                    event.stopPropagation(); // Detiene la propagación del evento
                                    toast({ title: "ID de Factura se ha copiado con exito", description: `El ID de Factura se ha copiado al portapapeles con exito`, status: "success", duration: 3000, isClosable: true });
                                    navigator.clipboard.writeText(item.consecutivo);
                                    // Aquí puedes añadir un mensaje de éxito o feedback
                                  }}
                                  _hover={{ cursor: "pointer", textDecoration: "underline" }} // Cambia el cursor y añade un subrayado al pasar el mouse
                                >
                                  {ShortConsecutivo(item.consecutivo)}
                                </Text>
                              </Tooltip>
                            </HStack>
                            <HStack alignItems="center" justify="center" w="20%">
                              <Text className="font-light" fontSize="100%">{item.orden}</Text>
                            </HStack>
                            <HStack spacing={4} alignItems="center" justify="center" w="30%">
                              <Text className="font-light" fontSize="100%">{item.fecha}</Text>
                            </HStack>
                            <HStack mr="3%" spacing={4} alignItems="center" justify="center" w="30%">
                              <Text
                                color={
                                  item.estado === "approved" ? "green" :
                                    item.estado === "pending" ? "yellow.500" : "red"
                                }
                                fontSize="100%"
                              >
                                {item.estado === 'pending' && 'PENDIENTE'}
                                {item.estado === 'approved' && 'APROBADO'}
                                {item.estado === 'rejected' && 'RECHAZADO'}
                                {item.estado !== 'pending' && item.estado !== 'approved' && item.estado !== 'rejected' && 'DESCONOCIDO'}
                              </Text>
                            </HStack>
                          </HStack>
                        </Button>
                      </VStack>
                    ))}

                  </VStack>
                )}

              </Box>

              <HStack width="100%" height="6%" bg="gray.200" justify="center">
                <Button
                  width="1%"
                  height="60%"
                  bg="#F1D803"
                  onClick={() => previouspages()}
                  disabled={!previouspage || currentPage === 1}
                  colorScheme="teal"
                >
                  <ArrowBackIcon width={4} height={4} color="black" />
                </Button>
                <Text>{currentPage}</Text>
                <Button
                  width="1%"
                  height="60%"
                  bg="#F1D803"
                  onClick={() => nextpages()}
                  disabled={!nextpage}
                  colorScheme="teal"
                >
                  <ArrowForwardIcon width={4} height={4} color="black" />
                </Button>
              </HStack>

              {Razon && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
                <div className="bg-white p-4 w-5/6 max-w-md border text-center border-gray-300 rounded-3xl shadow-md relative z-20 ">
                  <h2 className="text-xl font-bold mb-4">Su Solicitud de asociacion a sido Rechazada</h2>

                  <p className=" font-bold">Razon de rechazo</p>
                  <p className=" mt-2">{Textv}</p>

                  <p className=" mt-2 font-bold">Si desea editar la asociacion anterior haga click en Editar</p>

                  <HStack mt={4} justify="center" align="center">
                    <Button bgColor="red.500" colorScheme="teal" className=" px-4 py-2 rounded" onClick={() => setRazon(false)}>
                      Cerrar
                    </Button>
                    <Button textColor="black" bgColor="#F1D803" colorScheme="teal" className=" px-4 py-2 rounded" onClick={() => (setisTable(true), setRazon(false))}>
                      Editar
                    </Button>
                  </HStack>
                </div>
              </div>)}
            </VStack>


          ) : (
            <>

              {(Type === "Create") && (
                <Associate_invoice setisTable={setisTable} isTable={Type} invoi={codigo} sharedState={sharedState} updateSharedState={updateSharedState} />
              )}

              {(Type === "Edit" || Type === "View") && (
                <div
                  className={` absolute p-4 bg-gray-100 border border-gray-300 text-center h-[100%] w-[100%] justify-center self-center content-center bottom-1 snap-center origin-center  rounded-3xl shadow-md flex flex-col`}>
                  <Associate_invoice setisTable={setisTable} isTable={Type} invoi={codigo} sharedState={sharedState} updateSharedState={updateSharedState} />
                </div>
              )}
            </>







          )}

        </>
      )}
      {hola && (<ReturnTable suppliers={selectedSupplier2} volver={() => ChangeHola()} />)}
    </>

  );

}




