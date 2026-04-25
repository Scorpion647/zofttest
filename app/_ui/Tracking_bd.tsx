import React, { useState, useEffect, useRef } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.css";
import {
  VStack,
  HStack,
  Spinner,
  Text,
  Button,
  Input,
  Box,
  Flex,
  Select,
  Tooltip,
  useToast,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { selectSuppliers } from "../_lib/database/suppliers";
import {
  selectTrackingExportRows,
  selectTrackingSummary,
} from "../_lib/database/tracking";
import ExcelJS from "exceljs";
import PaginationControls from "./components/PaginationControls";

function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString: string | number | Date) {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

export const Tracking_bd = () => {
  const TRACKING_LIST_LIMIT = 40;
  const [isLoading, setIsLoading] = useState(false);
  const [Selectyear, setSelectyear] = useState("all");
  const [Selectmonth, setSelectmonth] = useState("all");
  const [SearchSupplier, setSearchSupplier] = useState("");
  const [data, Setdata] = useState<InvoiceData[]>([]);
  const [InputValue, setInputValue] = useState("");
  const [savedata, setsavedata] = useState<MiObjeto | undefined>();
  const hotTableRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [error, setError] = useState("");
  const [isLoading1, setIsLoading1] = useState(false);

  const toast = useToast();

  const columns = [
    { data: 0, readOnly: true, title: "OC" },
    { data: 1, readOnly: true, title: "ITEMS" },
    { data: 2, readOnly: true, title: "CODIGO" },
    { data: 3, readOnly: true, title: "DESCRIPCION" },
    { data: 4, readOnly: true, title: "CANT" },
    { data: 5, readOnly: true, title: "UND" },
    { data: 6, readOnly: true, title: "PROVEEDOR" },
    { data: 7, readOnly: true, title: "FOB UNIT" },
    { data: 8, readOnly: true, title: "FACTURA" },
    { data: 9, readOnly: true, title: "PA" },
    { data: 10, readOnly: true, title: "UC" },
    { data: 11, readOnly: true, title: "TRM" },
    { data: 12, readOnly: true, title: "FOB" },
    { data: 13, readOnly: true, title: "COP UNIT" },
    { data: 14, readOnly: true, title: "COP TOTAL" },
    { data: 15, readOnly: true, title: "TIPO" },
    { data: 16, readOnly: true, title: "PB" },
    { data: 17, readOnly: true, title: "PN" },
    { data: 18, readOnly: true, title: "Bultos" },
    { data: 19, readOnly: true, title: "Conversion" },
  ];

  interface InvoiceData {
    consecutivo: string;
    orden: string | undefined; // Usa 'string | undefined' si puede ser 'undefined' en caso de error
    bill: string | undefined;
    subtotal: number;
    fob: number;
    fecha: string;
    estado: string;
  }

  type OrderBy = {
    column:
      | "state"
      | "created_at"
      | "updated_at"
      | "supplier_id"
      | "feedback"
      | "invoice_id"
      | "last_modified_by";
    options: {
      ascending: boolean;
    };
  };

  type MiObjeto = {
    page: number;
    limit: number;
    equals: {
      state: "pending" | "rejected" | "approved";
      supplier_id?: number;
      datem?: number;
      dateyear?: number;
    };
    orderBy: OrderBy;
  };

  type Tracking = {
    OC: number;
    ITEMS: number;
    CODIGO: string;
    DESCRIPCION: string;
    CANT: number;
    UND: string;
    NOTA: string | undefined; // Asumiendo que puede estar vacío
    PROVEEDOR: string;
    FOB_UNIT: number;
    FACTURA: string;
    FMM: string | undefined; // Si es opcional
    PA: number;
    UC: string;
    TRM: number;
    FOB: string; // Formato con símbolo de moneda
    COP_UNIT: string; // Formato con símbolo de moneda
    COP_TOTAL: string; // Formato con símbolo de moneda
    TIPO: string;
    Embalaje: string;
    PB: number;
    PN: number;
    Bultos: number;
    CODBANDERA: number;
    CODPAIS_ORIGEN: number;
    CODPAIS_COMPRA: number;
    PAIS_DESTINO: number;
    PAIS_PROCEDENCIA: number;
    Transporte: number;
    Conversion: number;
  };

  const ShortConsecutivo = (e: any) => {
    let consecutivo = String(e).slice(0, 8);
    return consecutivo;
  };
  /*

worksheet.columns = [
                    { header: 'OC', key: 'OC' },
                    { header: 'ITEMS', key: 'ITEMS' },
                    { header: 'CODIGO', key: 'CODIGO' },
                    { header: 'DESCRIPCION', key: 'DESCRIPCION' },
                    { header: 'CANT', key: 'CANT' },
                    { header: 'UND', key: 'UND' },
                    { header: 'NOTA', key: 'NOTA' },
                    { header: 'PROVEEDOR', key: 'PROVEEDOR' },
                    { header: 'FOB_UNIT', key: 'FOB_UNIT' },
                    { header: 'FACTURA', key: 'FACTURA' },
                    { header: 'FMM', key: 'FMM' },
                    { header: 'PA', key: 'PA' },
                    { header: 'UC', key: 'UC' },
                    { header: 'TRM', key: 'TRM' },
                    { header: 'FOB', key: 'FOB' },
                    { header: 'COP_UNIT', key: 'COP_UNIT' },
                    { header: 'COP_TOTAL', key: 'COP_TOTAL' },
                    { header: 'TIPO', key: 'TIPO' },
                    { header: 'EMBALAJE', key: 'EMBALAJE' },
                    { header: 'PB', key: 'PB' },
                    { header: 'PN', key: 'PN' },
                    { header: 'BULTOS', key: 'BULTOS' },
                    { header: 'CODBANDERA', key: 'CODBANDERA' },
                    { header: 'CODPAIS_ORIGEN', key: 'CODPAIS_ORIGEN' },
                    { header: 'CODPAIS_COMPRA', key: 'CODPAIS_COMPRA' },
                    { header: 'PAIS_DESTINO', key: 'PAIS_DESTINO' },
                    { header: 'PAIS_PROCEDENCIA', key: 'PAIS_PROCEDENCIA' },
                    { header: 'TRANSPORTE', key: 'TRANSPORTE' },
                    { header: 'CONVERSION', key: 'CONVERSION' },
                ];


    worksheet.addRow({
                                        OC: parseInt(bill[0].purchase_order),
                                        ITEMS: bill[0].item,  // Ordena por el valor de ITEM
                                        CODIGO: material,
                                        DESCRIPCION: descripcion,
                                        CANT: sup.billed_quantity,
                                        UND: bill[0].measurement_unit,
                                        NOTA: undefined,
                                        PROVEEDOR: supplier.name,
                                        FOB_UNIT: parseFloat(((sup.billed_unit_price / 100) / (sup.billed_currency === "USD" ? 1 : sup.trm)).toFixed(8)),
                                        FACTURA: sup.bill_number,
                                        FMM: invo.fmm,
                                        PA: subpartida,
                                        UC: measurement,
                                        TRM: sup.trm,
                                        FOB: parseFloat(((((sup.billed_unit_price / 100) * sup.billed_quantity) / (sup.billed_currency === "USD" ? 1 : sup.trm))).toFixed(2)),
                                        COP_UNIT: (sup.billed_unit_price / 100),
                                        COP_TOTAL: ((sup.billed_unit_price / 100) * sup.billed_quantity),
                                        TIPO: tipo,
                                        EMBALAJE: "PK",
                                        PB: sup.gross_weight,
                                        PN: sup.gross_weight,
                                        BULTOS: sup.packages,
                                        CODBANDERA: 169,
                                        CODPAIS_ORIGEN: 169,
                                        CODPAIS_COMPRA: 169,
                                        PAIS_DESTINO: 953,
                                        PAIS_PROCEDENCIA: 169,
                                        TRANSPORTE: 3,
                                        CONVERSION: conversion,
                                    });
    */

  const resolveSupplierId = async () => {
    if (!InputValue.trim()) return undefined;
    const suppliers = await selectSuppliers({
      page: 1,
      limit: 1,
      equals: {},
      search: InputValue.trim(),
      orderBy: { column: "name", options: { ascending: true } },
    });
    return suppliers[0]?.supplier_id;
  };

  const resolveTrackingFilters = async () => {
    const supplierId = await resolveSupplierId();
    if (InputValue.trim() && !supplierId) {
      return null;
    }

    return {
      supplierId,
      year: Selectyear !== "all" ? parseInt(Selectyear) : undefined,
      month: Selectmonth !== "all" ? parseInt(Selectmonth) : undefined,
    };
  };

  const Supp_Export = async () => {
    setIsLoading1(true);
    setError("");
    onOpen();

    try {
      const filters = await resolveTrackingFilters();
      if (!filters) {
        setsavedata(undefined);
        return;
      }

      const exportRows = await selectTrackingExportRows(filters);
      if (exportRows.length === 0) {
        setsavedata(undefined);
        return;
      }
      setsavedata(undefined);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Suppliers Data");
      worksheet.columns = [
        { header: "OC", key: "OC" },
        { header: "ITEMS", key: "ITEMS" },
        { header: "CODIGO", key: "CODIGO" },
        { header: "DESCRIPCION", key: "DESCRIPCION" },
        { header: "CANT", key: "CANT" },
        { header: "UND", key: "UND" },
        { header: "NOTA", key: "NOTA" },
        { header: "PROVEEDOR", key: "PROVEEDOR" },
        { header: "FOB_UNIT", key: "FOB_UNIT" },
        { header: "FACTURA", key: "FACTURA" },
        { header: "FMM", key: "FMM" },
        { header: "PA", key: "PA" },
        { header: "UC", key: "UC" },
        { header: "TRM", key: "TRM" },
        { header: "FOB", key: "FOB" },
        { header: "COP_UNIT", key: "COP_UNIT" },
        { header: "COP_TOTAL", key: "COP_TOTAL" },
        { header: "TIPO", key: "TIPO" },
        { header: "EMBALAJE", key: "EMBALAJE" },
        { header: "PB", key: "PB" },
        { header: "PN", key: "PN" },
        { header: "BULTOS", key: "BULTOS" },
        { header: "CODBANDERA", key: "CODBANDERA" },
        { header: "CODPAIS_ORIGEN", key: "CODPAIS_ORIGEN" },
        { header: "CODPAIS_COMPRA", key: "CODPAIS_COMPRA" },
        { header: "PAIS_DESTINO", key: "PAIS_DESTINO" },
        { header: "PAIS_PROCEDENCIA", key: "PAIS_PROCEDENCIA" },
        { header: "TRANSPORTE", key: "TRANSPORTE" },
        { header: "CONVERSION", key: "CONVERSION" },
      ];

      for (const row of exportRows) {
        if (!row.trm) continue;
        const measurement = row.material_measurement_unit || "VACIO";
        const type =
          row.material_type === "national" ? "NACIONAL"
          : row.material_type === "nationalized" ? "NACIONALALIZADO"
          : row.material_type === "other" ? "OTRO"
          : "";
        const conversion =
          measurement === "KG" || measurement === "KGM" ?
            parseFloat((row.gross_weight / row.billed_quantity).toFixed(8))
          : ["U", "L"].includes(measurement) ? 1
          : 0;

        worksheet.addRow({
          OC: parseInt(row.purchase_order || "0"),
          ITEMS: row.item || 0,
          CODIGO: row.material_code || "",
          DESCRIPCION: row.description || "",
          CANT: row.billed_quantity,
          UND: row.bill_measurement_unit || "",
          NOTA: undefined,
          PROVEEDOR: row.supplier_name,
          FOB_UNIT: parseFloat(
            (
              row.billed_unit_price /
              100 /
              (row.billed_currency === "USD" ? 1 : row.trm)
            ).toFixed(8),
          ),
          FACTURA: row.bill_number,
          FMM: row.fmm,
          PA: parseInt(row.subheading || "1234567891"),
          UC: measurement,
          TRM: row.trm,
          FOB: parseFloat(
            (
              ((row.billed_unit_price / 100) * row.billed_quantity) /
              (row.billed_currency === "USD" ? 1 : row.trm)
            ).toFixed(2),
          ),
          COP_UNIT: row.billed_unit_price / 100,
          COP_TOTAL: (row.billed_unit_price / 100) * row.billed_quantity,
          TIPO: type,
          EMBALAJE: "PK",
          PB: row.gross_weight,
          PN: row.gross_weight,
          BULTOS: row.packages,
          CODBANDERA: 169,
          CODPAIS_ORIGEN: 169,
          CODPAIS_COMPRA: 169,
          PAIS_DESTINO: 953,
          PAIS_PROCEDENCIA: 169,
          TRANSPORTE: 3,
          CONVERSION: conversion,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "suppliers_data.xlsx";
      link.click();
    } catch (error) {
      setError("Error al generar el archivo de seguimiento.");
      console.error("Error al generar el archivo:", error);
    } finally {
      setIsLoading1(false);
      onClose();
    }
  };

  const FetchData = async () => {
    setIsLoading(true);
    try {
      const filters = await resolveTrackingFilters();
      if (!filters) {
        setsavedata(undefined);
        Setdata([]);
        return;
      }

      const summaryRows = await selectTrackingSummary({
        ...filters,
        limit: TRACKING_LIST_LIMIT,
        offset: 0,
      });

      const rows: InvoiceData[] = summaryRows.map((row) => ({
        consecutivo: row.invoice_id,
        orden: row.purchase_order || undefined,
        bill: row.bill_number || undefined,
        subtotal: row.subtotal,
        fob: row.fob,
        fecha: formatDate(row.modified_at),
        estado: row.supplier_name,
      }));

      setsavedata({
        page: 1,
        limit: TRACKING_LIST_LIMIT,
        equals: {
          state: "approved",
          supplier_id: filters.supplierId,
          dateyear: filters.year,
          datem: filters.month,
        },
        orderBy: { column: "updated_at", options: { ascending: true } },
      });
      Setdata(rows);
    } catch (error) {
      console.error("Error al cargar el tracking:", error);
      Setdata([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Selectyear === "all" && Selectmonth !== "all") {
      setSelectmonth("all");
    } else {
      FetchData();
    }
  }, [InputValue, Selectyear, Selectmonth]);

  const HandleInput = () => {
    if (SearchSupplier && SearchSupplier !== "") {
      setInputValue(SearchSupplier);
    } else {
      setInputValue("");
    }
  };

  const [clickType, setClickType] = useState<string>("");
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const isDoubleClick = useRef<boolean>(false); // Flag para doble clic
  const [isCheckboxClicked, setIsCheckboxClicked] = useState(false);
  const [Checkboxs, setCheckboxs] = useState(false);

  const handleClick = () => {
    // Establece la flag en falso inicialmente
    isDoubleClick.current = false;

    // Configura un temporizador para determinar si es un clic simple
    clickTimeout.current = setTimeout(() => {
      if (!isDoubleClick.current) {
        alert("Simple Click");
      }
    }, 250); // Tiempo de espera ajustable
  };

  const handleDoubleClick = () => {
    // Marca la flag como doble clic y cancela el temporizador del clic simple
    isDoubleClick.current = true;
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    setCheckboxs(!Checkboxs);
  };

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deselectedItems, setDeselectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Maneja cambios individuales en los checkboxes
  const handleCheckboxChange = (consecutivo: string, isChecked: boolean) => {
    if (selectAll) {
      setDeselectedItems((prevDeselected) => {
        if (isChecked) {
          return prevDeselected.filter((item) => item !== consecutivo); // Elimina del deseleccionados si se activa
        } else {
          return [...prevDeselected, consecutivo]; // Agrega a deseleccionados si se desactiva
        }
      });
    } else {
      // Manejo normal cuando no está activado "Seleccionar todos"
      setSelectedItems((prevSelected) => {
        if (isChecked) {
          return [...prevSelected, consecutivo];
        } else {
          return prevSelected.filter((item) => item !== consecutivo);
        }
      });
    }
  };

  // Maneja el cambio del checkbox "Seleccionar todos"
  const handleSelectAllChange = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedItems(["completo"]); // Solo guarda "completo"
      setDeselectedItems([]); // Borra deseleccionados
    } else {
      setSelectedItems([]); // Limpia seleccionados
      setDeselectedItems([]); // Limpia deseleccionados
    }
    setSelectAll(isChecked);
  };

  // Verifica si un Checkbox está marcado
  const isChecked = (consecutivo: string) => {
    if (selectAll) {
      return !deselectedItems.includes(consecutivo); // Marca si no está en deseleccionados
    }
    return selectedItems.includes(consecutivo);
  };
  return (
    <div>
      {isLoading ?
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="420">
          <Spinner size="xl" />
          <Text ml={4}>Cargando datos...</Text>
        </Box>
      : <>
          <Box>
            <Flex marginTop="5px" height="14%" width="100%">
              <HStack width="100%" spacing={5}>
                <HStack width="30%" spacing={2}>
                  <Input
                    border="1px"
                    placeholder="Proveedor"
                    value={SearchSupplier}
                    onChange={(e) => setSearchSupplier(e.target.value)}
                  />
                  <Button onClick={HandleInput} colorScheme="teal" bg="#F1D803">
                    <SearchIcon color="black" width={5} height={5} />
                  </Button>
                </HStack>
                <HStack spacing={2} width="30%">
                  <Select
                    value={Selectyear}
                    border="1px"
                    onChange={(e) => setSelectyear(e.target.value)}
                    backgroundColor="white">
                    <option value="all">Todos</option>
                    <option value="2025">2025</option>
                  </Select>
                  <Select
                    border="1px"
                    backgroundColor="white"
                    onChange={(e) => setSelectmonth(e.target.value)}
                    value={Selectmonth}
                    disabled={Selectyear === "all"}>
                    <option value="all">Todos</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </Select>
                </HStack>
                <HStack width="20%">
                  <Button
                    onClick={() => Supp_Export()}
                    colorScheme="teal"
                    bg="#F1D803">
                    <Text color="black">Export</Text>
                  </Button>
                </HStack>
                <HStack width="20%"></HStack>
              </HStack>
            </Flex>
            <HStack
              mt={2}
              borderColor="gray.300"
              whiteSpace="nowrap"
              className="rounded-2xl"
              justifyContent="center"
              alignItems="center"
              bg="gray.200"
              w="100%"
              h="10%">
              <HStack
                bgColor="white"
                align="center"
                justify="center"
                w="100%"
                h="100%">
                <HStack
                  position="relative"
                  alignItems="center"
                  justify="center"
                  w="5%">
                  {Checkboxs && (
                    <Checkbox
                      position="absolute"
                      ml="140%"
                      isChecked={selectAll}
                      onChange={(e) => handleSelectAllChange(e.target.checked)}
                      zIndex={50}
                    />
                  )}
                </HStack>
                <HStack
                  overflowX="clip"
                  ml="3%"
                  alignItems="center"
                  justify="start"
                  w="25%">
                  <Text ml={4} className="font-bold" fontSize="100%">
                    ID Fact
                  </Text>
                </HStack>
                <HStack alignItems="center" justify="center" w="20%">
                  <Text marginRight={2} className="font-bold" fontSize="100%">
                    orden
                  </Text>
                </HStack>
                <HStack
                  spacing={8}
                  alignItems="center"
                  justify="center"
                  w="30%">
                  <Text marginRight={2} className="font-bold" fontSize="100%">
                    Fecha
                  </Text>
                </HStack>
                <HStack
                  mr="3%"
                  spacing={4}
                  alignItems="center"
                  justify="center"
                  w="30%">
                  <Text className="font-bold" fontSize="100%">
                    Proveedor
                  </Text>
                </HStack>
              </HStack>
            </HStack>
            <VStack marginTop="10px" height="353px" width="100%" bg="gray.200">
              <VStack width="100%"></VStack>
              {data.slice(0, 7).map((item) => (
                <VStack position="relative" w="100%" key={item.orden}>
                  {Checkboxs && (
                    <Checkbox
                      mt="1.1%"
                      mr="90%"
                      isChecked={isChecked(item.consecutivo)}
                      onChange={(e) =>
                        handleCheckboxChange(item.consecutivo, e.target.checked)
                      }
                      position="absolute"
                      zIndex={50}
                    />
                  )}
                  <Button
                    whiteSpace="nowrap"
                    paddingRight={2}
                    paddingLeft={2}
                    justifyContent="center"
                    alignItems="center"
                    className="rounded-2xl"
                    bg="gray.200"
                    w="100%"
                    h="10">
                    <HStack
                      className="rounded-2xl"
                      bgColor="white"
                      align="center"
                      justify="center"
                      w="100%"
                      h="100%">
                      <HStack
                        ml="3%"
                        alignItems="center"
                        justify="start"
                        w="5%"></HStack>
                      <HStack alignItems="center" justify="start" w="25%">
                        <Tooltip
                          label={item.consecutivo}
                          aria-label={item.consecutivo}>
                          <Text
                            className="font-bold"
                            fontSize="100%"
                            onClick={(event) => {
                              event.stopPropagation(); // Detiene la propagación del evento
                              toast({
                                title: "ID de Factura se ha copiado con exito",
                                description: `El ID de Factura se ha copiado al portapapeles con exito`,
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                              });
                              navigator.clipboard.writeText(item.consecutivo);
                              // Aquí puedes añadir un mensaje de éxito o feedback
                            }}
                            _hover={{
                              cursor: "pointer",
                              textDecoration: "underline",
                            }} // Cambia el cursor y añade un subrayado al pasar el mouse
                          >
                            {ShortConsecutivo(item.consecutivo)}
                          </Text>
                        </Tooltip>
                      </HStack>
                      <HStack
                        spacing={0}
                        alignItems="center"
                        justify="center"
                        w="20%">
                        <Tooltip
                          label={
                            <Box>
                              <Text>
                                Subtotal.F: {formatMoney(item.subtotal)}
                              </Text>
                              <Text>FOB: {formatMoney(item.fob)}</Text>
                            </Box>
                          }
                          bg="gray.300"
                          placement="top"
                          color="black">
                          <HStack>
                            <Text className="font-light">{item.orden}</Text>
                            <Text className="font-light">{item.bill}</Text>
                          </HStack>
                        </Tooltip>
                      </HStack>
                      <HStack
                        spacing={4}
                        alignItems="center"
                        justify="center"
                        w="30%">
                        <Text className="font-light" fontSize="100%">
                          {item.fecha}
                        </Text>
                      </HStack>
                      <HStack
                        mr="3%"
                        spacing={4}
                        alignItems="center"
                        justify="center"
                        w="30%">
                        <Text fontSize="60%">{item.estado}</Text>
                      </HStack>
                    </HStack>
                  </Button>
                </VStack>
              ))}
            </VStack>
            <HStack marginTop="10px">
              <PaginationControls
                currentPage={1}
                canPrevious={false}
                canNext={false}
              />
            </HStack>
          </Box>

          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
              <ModalHeader>Exportando Archivo de seguimiento</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {isLoading1 ?
                  "Generando archivo..."
                : "Archivo generado exitosamente."}
                {error !== "" && <p className="text-red-500">{error}</p>}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      }
    </div>
  );
};
