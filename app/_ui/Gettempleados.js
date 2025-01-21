'use client'
import { useState, useEffect } from "react";
import { Spinner, Box, VStack, HStack, Text, Icon, Button } from "@chakra-ui/react";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { getEmployees, getProfile, getSupplier } from '@/app/_lib/database/service';
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";

export const Gettempleados = ({ supplier, regresar }) => {
    const [employees, setEmployees] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const itemsPerPage = 8;


    function removeDuplicates(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false; 
            } else {
                seen.add(value); 
                return true; 
            }
        });
    }

    const fetchEmployees = async (page) => {
        setIsLoading(true);
        try {
            const sup = await getSupplier("", "", supplier);
            const data = await getEmployees(sup.supplier_id, page, itemsPerPage);
            console.log("Esta es la Data de empleados: ",data)
            if (data && data.length > 0) {
                const Empleados = await Promise.all(
                    data.map(async (emp) => {
                        const profile = await getProfile(emp.profile_id);
                        return {
                            email: profile.email,
                            name: profile.full_name,
                        };
                    })
                );

                setEmployees(removeDuplicates(Empleados, "email"));
                setHasNextPage(true); 
            } else {
                setEmployees([]);
                setHasNextPage(false);
            }
        } catch (e) {
            console.error('Error fetching employees:', e);
            setError('Error fetching employees');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees(currentPage);
    }, [supplier, currentPage]);

    const handleNextPage = async () => {
        const nextPage = currentPage + 1;
        const sup = await getSupplier("", "", supplier);
        const data = await getEmployees(sup.supplier_id, nextPage, itemsPerPage);


        if (data && data.length > 0) {
            setCurrentPage(nextPage);
        } else {
            setHasNextPage(false); 
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    return (
        <div>
            
                <VStack w="100%" bgColor="white" height="470" position="relative">
                    <HStack  align="center" justify="center" w="100%">
                        <Button onClick={() => regresar()} colorScheme='teal' backgroundColor='#F1D803' textColor="black" mr="920px" position="absolute">Volver</Button>
                        <Text className=" font-bold" fontSize="120%">Gestionar Empleados</Text>
                    </HStack>

                    <HStack justify="flex-start" w="100%" mt={2}>
                        <Text className=" font-semibold" fontSize="90%">Proveedor: </Text>
                        <Text fontSize="90%">{supplier}</Text>
                    </HStack>
                            
                    
                         <VStack border="1px" borderColor="gray.300" w="100%" bgColor="white" h="370px" position="relative">
                         <VStack
                             whiteSpace="nowrap"
                             justifyContent='center'
                             alignItems="center"
                             bg="gray.300"
                             w="100%"
                             h="50"
     
                         >
                             <HStack  bgColor="white" align="center" justify="center" w="100%" h="100%">
                                 <HStack ml="3%" alignItems="center" justify="start" width="30%">
                                     <Text className="font-bold">Nombre</Text>
                                 </HStack>
                                 <Text className="font-bold" width="60%">Email</Text>
                                 <VStack width="10%"></VStack>
                             </HStack>
                         </VStack>
                         {error && <Text color="red.500">{error}</Text>}
                         {isLoading && (
                        <Box display="flex" justifyContent="center" alignItems="center" height="350">
                            <Spinner size="xl" />
                            <Text ml={4}>Cargando datos...</Text>
                        </Box>
                    )}
                    {!isLoading && (
                        <VStack overflow="auto" width="100%" bg="gray.300" h="370px">
                        <VStack mt="1px"></VStack>
                        {employees.map(emp => (
                            <Box
                                key={emp.email}
                                whiteSpace="nowrap"
                                paddingRight={2}
                                paddingLeft={2}
                                justifyContent='center'
                                alignItems="center"
                                className="rounded-2xl"
                                bg="gray.300"
                                w="100%"
   
                            >
                                <HStack
                                    className="rounded-2xl"
                                    bgColor="white"
                                    align="center"
                                    justify="center"
                                    w="100%"
                                    h="30px"
                                >
                                    <HStack ml="3%" alignItems="center" justify="start" width="30%">
                                        <Text>{emp.name}</Text>
                                    </HStack>
                                    <Text width="60%">{emp.email}</Text>
                                    <VStack width="10%">
                                        <Icon as={IoEllipsisVerticalSharp} w={4} h={4} color='black' />
                                    </VStack>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                    )}
                         
                         
                         </VStack>
                 
                   
                    <HStack width="100%" height="6%" bg="gray.300" justify="center">
                        <Button
                            width="1%"
                            height="60%"
                            bg="#F1D803"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="teal"
                        >
                            <ArrowBackIcon width={4} height={4} color="black" />
                        </Button>
                        <Text>{currentPage}</Text>
                        <Button
                            width="1%"
                            height="60%"
                            bg="#F1D803"
                            onClick={handleNextPage}
                            disabled={!hasNextPage}
                            colorScheme="teal"
                        >
                            <ArrowForwardIcon width={4} height={4} color="black" />
                        </Button>
                    </HStack>
     
                </VStack>
        
        </div>
    );
}