'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast, useMediaQuery,Checkbox,ChakraProvider, Flex, Box, VStack, Heading, HStack, Menu, MenuButton, MenuList, MenuItem, Button, Text, Input, useDisclosure, Select } from "@chakra-ui/react";
import { SearchIcon, CheckIcon, CloseIcon, AddIcon, ArrowForwardIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { getProfile, selectProfiles} from "../_lib/database/profiles";
import { insertSupplier, selectSingleSupplier, selectSuppliers } from "../_lib/database/suppliers";
import { insertSupplierEmployee } from "../_lib/database/supplier_employee";
import { insertEmployee, updateProfile } from "../_lib/database/service";








const create = [
    { email: "jcastroc1@unicartagena.edu.co" },
    { email: "jhoyflow15@gmail.com" },
    { email: "jhoyflow@hotmail.com" },
    


]




export const CreateLargeUser = () => {
    const [Email, setEmail] = useState('');
    const [Searchvalue, setSearchvalue] = useState('');
    const [Selecctvalue, setSelecctvalue] = useState('');
    const [filteredValue, setFilteredValue] = useState('');
    const [isAccept, setisAccept] = useState(false);
    const [Options, setOptions] = useState([]);
    const [Profiles, setProfiles] = useState([]);
    const [name, setname] = useState("");
    const [id, setid] = useState("");
    const [Filteredselecct, setFilteredselecct] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const toast = useToast();
    const [inputValue, setInputValue] = useState(''); // Valor actual del input
    const [finalValue, setFinalValue] = useState(""); // Valor final mostrado al cambiar
    
    const handleButtonClick = () => {

        FetchData()
      };

    

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked); // Actualiza el estado según si está marcado o no
      };

useEffect(() => {
    const Search = async () => {
    const data = await selectSuppliers({page: 1, limit: 3000})
    const matches = data.filter(user =>
        user.name.toLowerCase().includes(Searchvalue.toLowerCase())
      );
      setOptions(matches.slice(0, 3)); // Limitar a 3 coincidencias
    
    }
    Search()
},[Searchvalue])

const AsocciateProfile = async () => {

        if(parseInt(id) === 0){
            const dataa = {
            name: Searchvalue
            }
            if(isChecked === true){
                dataa.domain = Email.split('@')[1];
            }
            const supplier = await insertSupplier(dataa)
            if(supplier){
                const ids = await selectSuppliers({page: 1, limit: 1, equals: {name: Searchvalue}})
                const obtener = await selectProfiles({limit: 1, page: 1, equals:{email: Email}})
                console.log(obtener[0].profile_id)
                const employee = await insertSupplierEmployee({profile_id: obtener[0].profile_id, supplier_id: ids[0].supplier_id})

                if(employee){
                    toast({ title: "Asociacion se realizo correctamente", description: `La asociacion y creacion del proveedor se realizo con exito.`, status: "success", duration: 3000, isClosable: true });
                setisAccept(false)
                FetchData()
                }else{
                    toast({ title: 'Asociacion no se ha podido realizar con exito', description: "Hubo un error en la creacion o asociacion del usuario al proveedor", status: 'error', position: 'top', isClosable: true, duration: 10000 });
                }
            }else{
                toast({ title: 'Asociacion no se ha podido realizar con exito', description: "Hubo un error en la creacion del proveedor", status: 'error', position: 'top', isClosable: true, duration: 10000 });
            }
        }else if(parseInt(id) !== 0){
            const obtener = await selectProfiles({limit: 1, page: 1, equals:{email: Email}})
            const employee = await insertSupplierEmployee({profile_id: obtener[0].profile_id, supplier_id: id})
            if(employee){
                toast({ title: "Asociacion se realizo correctamente", description: `La asociacion del usuario se realizo con exito.`, status: "success", duration: 3000, isClosable: true });
                setisAccept(false)
                FetchData()
            }
        }else{

        }
    
}


    const handleSelectChange = async (event) => {
        const selectedId = event.target.value;

        if(parseInt(selectedId) !== 0){
            const selected = await selectSingleSupplier(selectedId)
    
         if(selected){
          setname(selected.name)
        setid(selected.supplier_id)

         }
        }
        else if(parseInt(selectedId) === 0){

            setname(Searchvalue)
        setid(0)
         }

      };

const handleinput = (e) => {
setSearchvalue(e.target.value)
}

const handlesupplier = (e) => {
    setSelecctvalue(e.target.value)
    setname()
    }

    const handleFilterClick = () => {
        FetchData()
    };
    const router = useRouter();
    
    
   const FetchData = async () => {
    const data = []
        try{
        let filter = {}
        if(!inputValue || inputValue === ""){ 
        filter = {page: 1, limit: 10, equals: {user_role: "guest"}}
        }else{
  
        filter = {page: 1, limit: 10, equals: {user_role: "guest", email: inputValue}}
        }
        const Data = await selectProfiles(filter)
        Data.map((prof) => {
            data.push({
                email: prof.email
            })
        })
     
        setProfiles(data)

        
        }catch{

        }finally{

        }
    }

    useEffect(() => {
        FetchData()
    },[])
    const [valor, setvalor] = useState()



    const filteredData = Profiles.filter(item =>
        item.email.startsWith(filteredValue)  
    );
    
    const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
    const [iMediumScreen] = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
    const [iLargeScreen] = useMediaQuery("(min-width: 1024px)");
   
     
return(
    <>
        <HStack className="mt-3 mb-3">
            <Input value={inputValue}  onChange={(e) => setInputValue(e.target.value)} width={iSmallScreen ? "70%" : '30%'} border='1px' backgroundColor='white' placeholder="Correo"></Input>
            <Button onClick={handleButtonClick} colorScheme='teal' backgroundColor='#F1D803'>
                <SearchIcon w={5} h={5} color='black'></SearchIcon>
            </Button>
        </HStack>
        <VStack overflow="auto" w="100%" bgColor="gray.200" height="400" justify={(filteredData.length === 0)? "center" : ""} align="center" >
            {(filteredData.length > 0) && (
                <>
                {filteredData.map ((item) => (
                    <VStack key={item.email} w="100%" h="50" >
                        <Box whiteSpace="nowrap" paddingRight={2} paddingLeft={2}  justifyContent='center' alignItems="center" className="rounded-2xl" bg="gray.200" w="100%" h="50">
                            <HStack marginTop="1%" className="rounded-2xl" bgColor="white"  align="center" justify="center" w="100%" h="100%">
                                <HStack ml="3%" alignItems="center" justify="start" w={iSmallScreen ? "60%" : "80%"}>
                                    <Text fontSize={iSmallScreen ? "60%" : '100%'}>{item.email}</Text>
                                </HStack>
                                <HStack spacing={4} alignItems="center" justify="center" w={iSmallScreen ? "40%" : "20%"}>
                                    <Button  bg="red">
                                        <CloseIcon w={3} h={3} color="white" />
                                    </Button>
                                    <Button onClick={() => (setisAccept(true), setEmail(item.email))} bg="green">
                                        <CheckIcon w={3} h={3} color="white" />
                                    </Button>
                                </HStack>
                            </HStack>
                        </Box>  
                    </VStack> 
                ))}
                </>  
            )}
            {(filteredData.length === 0) && (
                <>
                <HStack align="center" justify="center" textAlign="center">
                <Text fontSize="150%" color="gray.500">
                    No hay usuarios pendientes a confirmacion
                </Text>
                </HStack>
                </>
            )}    
        </VStack>
        <HStack width="100%" height="6%" bg="gray.200" justify="center">
                        <Button
                            width="1%"
                            height="60%"
                            bg="#F1D803"

                            colorScheme="teal"
                        >
                            <ArrowBackIcon width={4} height={4} color="black" />
                        </Button>
                        <Text>1</Text>
                        <Button
                            width="1%"
                            height="60%"
                            bg="#F1D803"

                            colorScheme="teal"
                        >
                            <ArrowForwardIcon width={4} height={4} color="black" />
                        </Button>
                    </HStack>
        {isAccept && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-white p-4 w-5/6 max-w-md border text-center border-gray-300 rounded-3xl shadow-md relative z-20 ">
              <h2 className="text-xl font-bold mb-4">Confirmacion de Autorizacion de Usuario</h2>
              <p className="font-semibold">Seleccione el Proveedor al que quiere asociar este usuario</p>
              <p className="font-bold">{Email}</p>
              <Input mt={2} mb={2} onChange={handleinput} value={Searchvalue}>
              </Input>
              <Select onChange={handleSelectChange}  placeholder="Seleccione el Proveedor">
              {Options.map((user) => (
                  <option key={user.supplier_id}  value={user.supplier_id}>
                    {user.name}
                  </option>
                ))}
                {Options.length === 0 && Searchvalue && (
                  <option value="0" onClick={handlesupplier}>
                    Crear Proveedor: {Searchvalue}
                  </option>
                )}
              </Select>

              {id === 0 && (
                <VStack mb={4} textAlign='start' justifyContent="start" alignItems='start' mt={5} >
                <Checkbox isChecked={isChecked} onChange={handleCheckboxChange}>¿Desea agregar este dominio como dominio autorizado para este proveedor?</Checkbox>
                </VStack>
              )}
              
             
              <HStack mt={4} justify="center" align="center">
                <Button bgColor="red.500" colorScheme="teal" className=" px-4 py-2 rounded" onClick={() => setisAccept(false)}>
                    Cerrar
                </Button>
                <Button textColor="black" bgColor="#F1D803" colorScheme="teal" className=" px-4 py-2 rounded" onClick={AsocciateProfile}>
                    Aceptar
                </Button>
              </HStack>
            </div>
          </div>)}
    </>
    
);

}
































export const CreateSmallUser = () =>  {
    const [Email, setEmail] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [filteredValue, setFilteredValue] = useState('');
    const [isAccept, setisAccept] = useState(false);

    const filteredData = create.filter(item =>
        item.email.startsWith(filteredValue)  

    );
    
    const handleFilterClick = () => {
        if (inputValue.trim() !== '') {
            setFilteredValue(inputValue.trim());
        } else {
            setFilteredValue('');
        }
    };
    const router = useRouter();

     

    

return(
    <>
        <HStack className="mt-3 mb-3">
            <Input fontSize="60%" width='58%' border='1px' backgroundColor='white' placeholder="Usuario"></Input>
            <Button width={6} colorScheme='teal' backgroundColor='#F1D803'>
                <SearchIcon w={5} h={5} color='black'></SearchIcon>
            </Button>
        </HStack>
        <VStack overflow="auto" w="100%" bgColor="gray.200" height="400" justify='flex-start' alignItems="flex-start">
            {filteredData.map ((item) => (
                <VStack key={item.id} w="100%">
                    <Box w="100%" h="30" whiteSpace="nowrap"   justifyContent='center' alignItems="center" className="rounded-2xl" bg="gray.200">
                        <HStack marginTop="1%" className="rounded-2xl" bgColor="white"  align="center" justify="center" w="100%" h="100%">
                            <HStack ml="3%" alignItems="center" justify="start" w="70%">
                                <Text fontSize='50%'>{item.email} </Text>
                            </HStack>
                            <HStack spacing={2} alignItems="center" justify="start" w="30%">
                                <Box w="5"   bg="red">
                                <CloseIcon w={2} h={2} color="white" />
                                </Box>
                                <Box w="5"  onClick={() => (setisAccept(true), setEmail(item.email))} bg="green">
                                <CheckIcon w={2} h={2} color="white" />
                                </Box>
                            </HStack>
                        </HStack>
                    </Box>
                </VStack>
            ))}
        </VStack>
        {isAccept && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-white p-4 w-5/6 max-w-md border text-center border-gray-300 rounded-3xl shadow-md relative z-20 ">
              <h2 className="text-xl font-bold mb-4">Confirmacion de Autorizacion de Usuario</h2>
              <p className="font-semibold">¿Esta seguro de querer agregar al siguiente usuario?</p>
              <p className="font-bold">{Email}</p>
              
              <p className="font-bold">No acepte esta opcion si el dominio no es privado</p>
             
              <HStack mt={4} justify="center" align="center">
                <Button bgColor="red.500" colorScheme="teal" className=" px-4 py-2 rounded" onClick={() => setisAccept(false)}>
                    Cerrar
                </Button>
                <Button textColor="black" bgColor="#F1D803" colorScheme="teal" className=" px-4 py-2 rounded" onClick={() => setisAccept(false)}>
                    Aceptar
                </Button>
              </HStack>
            </div>
          </div>)}
    </>
    
);

}