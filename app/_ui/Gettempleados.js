"use client";
import { useState, useEffect } from "react";
import {
  Spinner,
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Input,
  useToast,
} from "@chakra-ui/react";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import {
  getEmployees,
  getProfile,
  getSupplier,
} from "@/app/_lib/database/service";
import { ArrowBackIcon, ArrowForwardIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import { FaSave } from "react-icons/fa";
import { updateSupplier } from "../_lib/database/suppliers";

export const Gettempleados = ({ supplier, regresar }) => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nameSupplier, setnameSupplier] = useState("")
  const [inputname, setinputname] = useState("")
  const itemsPerPage = 8;
  const [Edit, setEdit] = useState(false);
  const toast = useToast();

  function removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter((item) => {
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
      const sup = await getSupplier(supplier, "", "");
      setnameSupplier(sup.name)
      setinputname(sup.name)
      if (Edit) setEdit(false)
      const data = await getEmployees(sup.supplier_id, page, itemsPerPage);
      console.log("Esta es la Data de empleados: ", data);
      if (data && data.length > 0) {
        const Empleados = await Promise.all(
          data.map(async (emp) => {
            const profile = await getProfile(emp.profile_id);
            return {
              email: profile.email,
              name: profile.full_name,
            };
          }),
        );

        setEmployees(removeDuplicates(Empleados, "email"));
        setHasNextPage(true);
      } else {
        setEmployees([]);
        setHasNextPage(false);
      }
    } catch (e) {
      console.error("Error fetching employees:", e);
      setError("Error fetching employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [supplier, nameSupplier, currentPage]);

  const handleNextPage = async () => {
    const nextPage = currentPage + 1;
    const sup = await getSupplier(supplier, "", "");
    if (nameSupplier !== sup.name) { setnameSupplier(sup.name); setinputname(sup.name) }
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

  const handleSave = async () => {
    const confirmSave = window.confirm("¿Seguro quieres guardar los cambios? \n El nuevo nombre sera: " + inputname);
    if (confirmSave) {
      await updateSupplier({ supplier_id: supplier, name: inputname })
      toast({
        title: "Nombre cambiado con exito",
        description: `El nombre del proveedor ha sido cambiado`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setnameSupplier(inputname); 
    }
  };

  const copytext = (action,text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: (action+" copiado con exito"),
        description: ("El "+action+` del empleado ha sido copiado en el portapapeles`),
        status: "success",
        duration: 3000,
        isClosable: true,
    })
  }


  return (
    <div>
      <VStack w="100%" bgColor="white" height="470" position="relative">
        <HStack align="center" justify="center" w="100%">
          <Button
            onClick={() => regresar()}
            colorScheme="teal"
            backgroundColor="#F1D803"
            textColor="black"
            mr="920px"
            position="absolute">
            Volver
          </Button>
          <Text className="font-bold" fontSize="120%">
            Gestionar Empleados
          </Text>
        </HStack>

        <HStack justify="flex-start" w="100%" mt={2}>
          <Text className="font-semibold" fontSize="90%">
            Proveedor:{" "}
          </Text>
          {Edit ?
            <Input h="90%" w="80" value={inputname} onChange={(e) => setinputname(e.target.value)} />
            :
            <Text fontSize="90%">{nameSupplier}</Text>
          }
          <Button h="90%" w="5" bgColor="#F1D803" onClick={() => Edit ? handleSave() : setEdit(true)}>
            {Edit ? <FaSave /> : <EditIcon />}
          </Button>
          {Edit && (
            <Button h="90%" w="5" bgColor="red" onClick={() => { setEdit(false); setinputname(nameSupplier); }}>
              <CloseIcon color="white" />
            </Button>
          )}
        </HStack>

        <VStack
          border="1px"
          borderColor="gray.300"
          w="100%"
          bgColor="white"
          h="370px"
          position="relative">
          <VStack
            whiteSpace="nowrap"
            justifyContent="center"
            alignItems="center"
            bg="gray.300"
            w="100%"
            h="50">
            <HStack
              bgColor="white"
              align="center"
              justify="center"
              w="100%"
              h="100%">
              <HStack ml="3%" alignItems="center" justify="start" width="30%">
                <Text className="font-bold">Nombre</Text>
              </HStack>
              <Text className="font-bold" width="60%">
                Email
              </Text>
              <VStack width="10%"></VStack>
            </HStack>
          </VStack>
          {error && <Text color="red.500">{error}</Text>}
          {isLoading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="350">
              <Spinner size="xl" />
              <Text ml={4}>Cargando datos...</Text>
            </Box>
          )}
          {!isLoading && (
            <VStack overflow="auto" width="100%" bg="gray.300" h="370px">
              <VStack mt="1px"></VStack>
              {employees.map((emp) => (
                <Box
                  key={emp.email}
                  whiteSpace="nowrap"
                  paddingRight={2}
                  paddingLeft={2}
                  justifyContent="center"
                  alignItems="center"
                  className="rounded-2xl"
                  bg="gray.300"
                  w="100%">
                  <HStack
                    className="rounded-2xl"
                    bgColor="white"
                    align="center"
                    justify="center"
                    w="100%"
                    h="30px">
                    <HStack
                      ml="3%"
                      alignItems="center"
                      justify="start"
                      width="30%">
                      <Text onClick={() => copytext("nombre",emp.name)}
                        _hover={{ cursor: "pointer", textDecoration: "underline"}}
                        >{emp.name}</Text>
                    </HStack>
                    <Text width="60%" onClick={() => copytext("email",emp.email)}
                      _hover={{ cursor: "pointer", textDecoration: "underline"}}
                      >{emp.email}</Text>
                    <VStack width="10%">
                      <Icon
                        as={IoEllipsisVerticalSharp}
                        w={4}
                        h={4}
                        color="black"
                      />
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
            colorScheme="teal">
            <ArrowBackIcon width={4} height={4} color="black" />
          </Button>
          <Text>{currentPage}</Text>
          <Button
            width="1%"
            height="60%"
            bg="#F1D803"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            colorScheme="teal">
            <ArrowForwardIcon width={4} height={4} color="black" />
          </Button>
        </HStack>
      </VStack>
    </div>
  );
};
