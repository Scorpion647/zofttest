"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  Icon,
  useMediaQuery,
  Tooltip,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon, AddIcon } from "@chakra-ui/icons";
import { FaUsersGear } from "react-icons/fa6";

import { Gettempleados } from "@/app/_ui/Gettempleados";
import { selectSuppliers } from "../_lib/database/suppliers";
import { GrRefresh } from "react-icons/gr";
import PaginationControls from "./components/PaginationControls";

export const CreatelargeDomain = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [isInput, setisInput] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [hola, setHola] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [iMediumScreen] = useMediaQuery(
    "(min-width: 768px) and (max-width: 1024px)",
  );
  const [iLargeScreen] = useMediaQuery("(min-width: 1024px)");

  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      let data = {};

      try {
        if (search) {
          data = await selectSuppliers({
            page: currentPage,
            limit: 8,
            equals: {},
            orderBy: { column: "name", options: { ascending: true } },
            search: search,
          });
        } else {
          data = await selectSuppliers({
            page: currentPage,
            limit: 8,
            equals: {},
            orderBy: { column: "name", options: { ascending: true } },
          });
        }
        if (data) {
          setSuppliers(data);
          let nextPageData = {};
          if (search) {
            nextPageData = await selectSuppliers({
              page: currentPage + 1,
              limit: 8,
              equals: {},
              orderBy: { column: "name", options: { ascending: true } },
              search: search,
            });
          } else {
            nextPageData = await selectSuppliers({
              page: currentPage + 1,
              limit: 8,
              equals: {},
              orderBy: { column: "name", options: { ascending: true } },
            });
          }
          setHasNextPage(nextPageData.length > 0);
        } else {
          setSuppliers([]);
          setHasNextPage(false);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    if (hola) fetchSuppliers();
  }, [search, currentPage, hola]);

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier);
    setHola(false);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && hasNextPage) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (!isFetchingRef.current) {
      if (currentPage > 1) {
        setCurrentPage((prevPage) => prevPage - 1);
      }
    }
  };

  const handleNextPage = () => {
    if (!isFetchingRef.current) {
      if (hasNextPage) {
        setCurrentPage((prevPage) => prevPage + 1);
      }
    }
  };

  const ChangeEmployeed = () => {
    setHola(true);
  };
  if (!hola && selectedSupplier) {
    return (
      <Gettempleados supplier={selectedSupplier} regresar={ChangeEmployeed} />
    );
  }

  return (
    <>
      {hola && (
        <>
          <Flex
            w="100%"
            className="mb-3 mt-3"
            justify="space-between"
            align="center">
            <HStack>
              <Input
                width="80%"
                value={isInput}
                border="1px"
                backgroundColor="white"
                onChange={(e) => setisInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(isInput);
                  }
                }}
                placeholder="Proveedor"
              />
              <Tooltip label="Buscar">
                <Button
                  colorScheme="teal"
                  onClick={() => setSearch(isInput)}
                  backgroundColor="#F1D803">
                  <SearchIcon w={5} h={5} color="black" />
                </Button>
              </Tooltip>
              <Tooltip label="Refrescar">
                <Button
                  colorScheme="teal"
                  onClick={() => setSearch("")}
                  backgroundColor="#F1D803">
                  <GrRefresh color="black" />
                </Button>
              </Tooltip>
            </HStack>
          </Flex>
          <VStack
            border="1px"
            borderColor="gray.200"
            w="100%"
            bgColor="gray.200"
            height="400"
            justify="flex-start"
            alignItems="flex-start">
            <VStack
              whiteSpace="nowrap"
              justifyContent="center"
              alignItems="center"
              bg="gray.200"
              w="100%"
              h="50">
              <HStack
                paddingRight={2}
                paddingLeft={2}
                bgColor="white"
                align="center"
                justify="center"
                w="100%"
                h="100%">
                <HStack ml="3%" alignItems="center" justify="start" width="30%">
                  <Text className="font-bold">Dominio</Text>
                </HStack>
                <Text className="font-bold" width="60%">
                  Proveedor
                </Text>
                <VStack width="10%"></VStack>
              </HStack>
            </VStack>
            <VStack
              height={suppliers.length === 0 ? "100%" : ""}
              width="100%"
              bgColor="gray.200">
              {suppliers.length > 0 ?
                suppliers.map((supplier) => (
                  <Box
                    key={supplier.supplier_id}
                    whiteSpace="nowrap"
                    paddingLeft={2}
                    justifyContent="center"
                    alignItems="center"
                    className="rounded-xl"
                    mx={10}
                    bg="white"
                    w="98%"
                    h="100%">
                    <HStack h="100%">
                      <HStack
                        className="rounded-xl"
                        bgColor="white"
                        align="center"
                        justify="center"
                        w="90%"
                        h="30px">
                        <HStack
                          ml="3%"
                          alignItems="center"
                          justify="start"
                          width="35%">
                          <Text fontSize={iSmallScreen ? "60%" : "100%"}>
                            {supplier.domain}
                          </Text>
                        </HStack>
                        <Text
                          fontSize={iSmallScreen ? "60%" : "100%"}
                          width="65%">
                          {supplier.name}
                        </Text>
                      </HStack>
                      <HStack h="100%" w="10%">
                        <HStack w="20%"></HStack>
                        <Tooltip label="Administrar">
                          <HStack
                            onClick={() =>
                              handleSupplierClick(supplier.supplier_id)
                            }
                            h="100%"
                            w="80%"
                            className="cursor-pointer items-center justify-center rounded-r-xl align-middle"
                            bgColor="#F1D803">
                            <FaUsersGear />
                          </HStack>
                        </Tooltip>
                      </HStack>
                    </HStack>
                  </Box>
                ))
              : <HStack
                  align="center"
                  justify="center"
                  h="100%"
                  w="100%"
                  textAlign="center">
                  <Text fontSize="150%" color="gray.500">
                    No se encontraron proveedores
                  </Text>
                </HStack>
              }
            </VStack>
          </VStack>
          <PaginationControls
            currentPage={currentPage}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            canPrevious={currentPage > 1}
            canNext={hasNextPage}
          />
        </>
      )}
    </>
  );
};
