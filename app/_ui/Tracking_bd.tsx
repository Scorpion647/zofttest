import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { ArrowBackIcon, ArrowForwardIcon, SearchIcon } from "@chakra-ui/icons";
import { selectInvoice_data } from "../_lib/database/invoice_data";
import {
  selectSupplierData,
  selectSupplierDataByInvoiceID,
} from "../_lib/database/supplier_data";
import { selectSingleBill } from "../_lib/database/base_bills";
import {
  selectSingleSupplier,
  selectSuppliers,
} from "../_lib/database/suppliers";
import { selectSingleMaterial } from "../_lib/database/materials";
import ExcelJS from "exceljs";
import { Tables } from "@lib/database.types";

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
  const [isLoading, setIsLoading] = useState(false);
  const [Selectyear, setSelectyear] = useState("all");
  const [Selectmonth, setSelectmonth] = useState("all");
  const [SearchSupplier, setSearchSupplier] = useState("");
  const [data, Setdata] = useState<InvoiceData[]>([]);
  const [InputValue, setInputValue] = useState("");
  const [savedata, setsavedata] = useState<MiObjeto | undefined>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [error, setError] = useState("");
  const [isLoading1, setIsLoading1] = useState(false);
  const supplierCacheRef = useRef<Map<number, Tables<"suppliers">>>(new Map());
  const billCacheRef = useRef<Map<string, Tables<"base_bills"> | null>>(
    new Map(),
  );
  const materialCacheRef = useRef<Map<string, Tables<"materials"> | null>>(
    new Map(),
  );
  const supplierListRef = useRef<Tables<"suppliers">[] | null>(null);

  const toast = useToast();

  const getSupplierFromCache = async (supplierId: number) => {
    const cache = supplierCacheRef.current;
    if (cache.has(supplierId)) {
      return cache.get(supplierId)!;
    }

    const supplier = await selectSingleSupplier(supplierId);
    cache.set(supplierId, supplier);
    return supplier;
  };

  const getBillFromCache = async (baseBillId: string | null) => {
    if (!baseBillId) {
      return null;
    }

    const cache = billCacheRef.current;
    if (cache.has(baseBillId)) {
      return cache.get(baseBillId) ?? null;
    }

    try {
      const billResponse = await selectSingleBill(baseBillId);
      const bill = billResponse?.[0] ?? null;
      cache.set(baseBillId, bill);
      return bill;
    } catch (error) {
      console.error("Error al obtener la factura base:", error);
      cache.set(baseBillId, null);
      return null;
    }
  };

  const getMaterialFromCache = async (
    materialCode: string | null | undefined,
  ) => {
    if (!materialCode) {
      return null;
    }

    const cache = materialCacheRef.current;
    if (cache.has(materialCode)) {
      return cache.get(materialCode) ?? null;
    }

    try {
      const material = await selectSingleMaterial(materialCode);
      cache.set(materialCode, material);
      return material;
    } catch (error) {
      console.error("Error al obtener el material:", error);
      cache.set(materialCode, null);
      return null;
    }
  };

  const loadSuppliersList = useCallback(async () => {
    if (!supplierListRef.current) {
      supplierListRef.current = await selectSuppliers({
        page: 1,
        limit: 4000,
        equals: {},
      });
    }

    return supplierListRef.current;
  }, []);

  const findClosestSupplier = useCallback(
    async (targetSupplierName: string) => {
      const normalizedName = targetSupplierName.trim().toLowerCase();
      if (!normalizedName) {
        return null;
      }

      const suppliers = await loadSuppliersList();
      return (
        suppliers?.find((supplier) =>
          supplier.name?.toLowerCase().includes(normalizedName),
        ) ?? null
      );
    },
    [loadSuppliersList],
  );

  const buildInvoiceFilter = useCallback(async (): Promise<MiObjeto> => {
    const filter: MiObjeto = {
      page: 1,
      limit: 1000,
      equals: { state: "approved" },
      orderBy: { column: "updated_at", options: { ascending: true } },
    };

    if (InputValue.trim() !== "") {
      try {
        const supplier = await findClosestSupplier(InputValue);
        if (supplier) {
          filter.equals.supplier_id = supplier.supplier_id;
        }
      } catch (error) {
        console.error("Error al procesar el proveedor:", error);
      }
    }

    return filter;
  }, [InputValue, findClosestSupplier]);

  const fetchAllInvoices = async (filter: MiObjeto) => {
    const invoices: Tables<"invoice_data">[] = [];
    let currentPage = filter.page;

    while (true) {
      const chunk = await selectInvoice_data({
        ...filter,
        page: currentPage,
      });

      if (!chunk || chunk.length === 0) {
        break;
      }

      invoices.push(...chunk);

      if (!filter.limit || chunk.length < filter.limit) {
        break;
      }

      currentPage += 1;
    }

    return invoices;
  };

  const buildTrackingRows = async (
    invoiceList: Tables<"invoice_data">[],
  ): Promise<Tracking[]> => {
    const rows: Tracking[] = [];

    for (const invoice of invoiceList) {
      let supplierData;
      try {
        supplierData = await selectSupplierDataByInvoiceID(
          invoice.invoice_id,
          1,
          250,
        );
      } catch (error) {
        console.error(
          "Error al obtener los datos del proveedor para la factura:",
          invoice.invoice_id,
          error,
        );
        continue;
      }

      if (!supplierData.length) {
        continue;
      }

      const firstEntryDate = supplierData[0]?.modified_at;
      if (!firstEntryDate) {
        continue;
      }

      if (
        Selectyear !== "all" &&
        firstEntryDate.substring(0, 4) !== Selectyear
      ) {
        continue;
      }

      if (
        Selectmonth !== "all" &&
        firstEntryDate.substring(5, 7) !== Selectmonth
      ) {
        continue;
      }

      const supplier = await getSupplierFromCache(invoice.supplier_id).catch(
        (error) => {
          console.error("Error al obtener el proveedor:", error);
          return null;
        },
      );

      if (!supplier) {
        continue;
      }

      const itemRows = await Promise.all(
        supplierData.map(async (sup) => {
          const requiresTrm = sup.billed_currency !== "USD";

          if (requiresTrm && !sup.trm) {
            return null;
          }

          const bill = await getBillFromCache(sup.base_bill_id);
          if (!bill) {
            return null;
          }

          const material = await getMaterialFromCache(bill.material_code);

          const measurement =
            material?.measurement_unit ?? bill.measurement_unit ?? "VACIO";

          const typeMap: Record<string, string> = {
            national: "NACIONAL",
            nationalized: "NACIONALALIZADO",
            other: "OTRO",
            foreign: "EXTRANJERO",
          };

          const tipo = material?.type ? (typeMap[material.type] ?? "") : "";

          const conversion =
            measurement === "KG" || measurement === "KGM" ?
              parseFloat((sup.gross_weight / sup.billed_quantity).toFixed(8))
            : ["U", "L"].includes(measurement) ? 1
            : 0;

          const billedUnitPrice = sup.billed_unit_price / 100;
          const trmValue = requiresTrm ? (sup.trm ?? 1) : 1;
          const fobUnit = parseFloat((billedUnitPrice / trmValue).toFixed(8));
          const fobTotal = parseFloat(
            ((billedUnitPrice * sup.billed_quantity) / trmValue).toFixed(2),
          );

          const subheading =
            material?.subheading ? Number.parseInt(material.subheading, 10) : 0;

          const purchaseOrder = Number.parseInt(bill.purchase_order, 10);
          const oc = Number.isNaN(purchaseOrder) ? 0 : purchaseOrder;

          return {
            OC: oc,
            ITEMS: bill.item ?? 0,
            CODIGO: bill.material_code ?? "",
            DESCRIPCION: bill.description ?? "",
            CANT: sup.billed_quantity,
            UND: bill.measurement_unit ?? "",
            NOTA: undefined,
            PROVEEDOR: supplier.name ?? "",
            FOB_UNIT: fobUnit,
            FACTURA: sup.bill_number ?? "",
            FMM: invoice.fmm ?? undefined,
            PA: subheading,
            UC: measurement,
            TRM: requiresTrm ? (sup.trm ?? 0) : 1,
            FOB: fobTotal,
            COP_UNIT: billedUnitPrice,
            COP_TOTAL: billedUnitPrice * sup.billed_quantity,
            TIPO: tipo,
            EMBALAJE: "PK",
            PB: sup.gross_weight ?? 0,
            PN: sup.gross_weight ?? 0,
            Bultos: sup.packages ?? 0,
            CODBANDERA: 169,
            CODPAIS_ORIGEN: 169,
            CODPAIS_COMPRA: 169,
            PAIS_DESTINO: 953,
            PAIS_PROCEDENCIA: 169,
            Transporte: 3,
            Conversion: conversion,
          } as Tracking;
        }),
      );

      rows.push(...itemRows.filter((row): row is Tracking => row !== null));
    }

    return rows;
  };

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

  const Supp_Export = async () => {
    setIsLoading1(true);
    setError("");
    onOpen();

    try {
      const filter = await buildInvoiceFilter();
      const invoices = await fetchAllInvoices(filter);

      if (!invoices.length) {
        setsavedata(undefined);
        setError(
          "No se encontraron facturas aprobadas con los filtros seleccionados.",
        );
        toast({
          title: "Sin resultados",
          description:
            "No se encontraron facturas aprobadas para los filtros seleccionados.",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      setsavedata(filter);

      const rows = await buildTrackingRows(invoices);

      if (!rows.length) {
        setError("No hay datos para exportar con los filtros seleccionados.");
        toast({
          title: "Exportación vacía",
          description:
            "No se encontraron registros para generar el archivo con los filtros actuales.",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

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

      const sortedRows = [...rows].sort((a, b) => {
        if (a.OC === b.OC) {
          return a.ITEMS - b.ITEMS;
        }
        return a.OC - b.OC;
      });
      worksheet.addRows(sortedRows);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "suppliers_data.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError("Error al generar el archivo de seguimiento.");
      console.error("Error al generar el archivo de seguimiento:", error);
      toast({
        title: "Error al exportar",
        description: "Ocurrió un problema al generar el archivo.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading1(false);
      onClose();
    }
  };

  const FetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const filter = await buildInvoiceFilter();
      const invoices = await selectInvoice_data(filter);

      if (!invoices || invoices.length === 0) {
        setsavedata(undefined);
        Setdata([]);
        return;
      }

      setsavedata(filter);

      const invoiceSummaries: (InvoiceData | null)[] = await Promise.all(
        invoices.map(async (invoice) => {
          try {
            const supplierData = await selectSupplierDataByInvoiceID(
              invoice.invoice_id,
              1,
              250,
            );

            if (!supplierData.length) {
              return null;
            }

            const firstEntry = supplierData[0];

            if (
              Selectyear !== "all" &&
              firstEntry.modified_at.substring(0, 4) !== Selectyear
            ) {
              return null;
            }

            if (
              Selectmonth !== "all" &&
              firstEntry.modified_at.substring(5, 7) !== Selectmonth
            ) {
              return null;
            }

            const [supplier, bill] = await Promise.all([
              getSupplierFromCache(invoice.supplier_id).catch(() => null),
              getBillFromCache(firstEntry.base_bill_id),
            ]);

            if (!supplier) {
              return null;
            }

            let subtotal = 0;
            let fob = 0;

            for (const sup of supplierData) {
              const billedUnitPrice = sup.billed_unit_price / 100;
              subtotal += billedUnitPrice * sup.billed_quantity;

              const trmValue =
                sup.billed_currency === "USD" ? 1 : (sup.trm ?? 1);
              fob += (billedUnitPrice * sup.billed_quantity) / trmValue;
            }

            return {
              consecutivo: invoice.invoice_id,
              orden: bill?.purchase_order,
              bill: firstEntry.bill_number,
              subtotal,
              fob: Number.parseFloat(fob.toFixed(2)),
              fecha: formatDate(firstEntry.modified_at),
              estado: supplier.name ?? "",
            } satisfies InvoiceData;
          } catch (error) {
            console.error(
              "Error fetching data for invoice",
              invoice.invoice_id,
              error,
            );
            return null;
          }
        }),
      );

      Setdata(
        invoiceSummaries.filter((item): item is InvoiceData => item !== null),
      );
    } catch (error) {
      console.error("Error al obtener los datos de las facturas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [Selectmonth, Selectyear, buildInvoiceFilter]);

  /* const ExportButton = async () => {

        if(savedata){
            const invoice = await selectInvoice_data(savedata)
            
            if(invoice){

            }
        }else{

        }
    }*/

  useEffect(() => {
    if (Selectyear === "all" && Selectmonth !== "all") {
      setSelectmonth("all");
      return;
    }

    FetchData();
  }, [FetchData, Selectmonth, Selectyear]);

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
            <HStack
              marginTop="10px"
              width="100%"
              height="6%"
              bg="gray.200"
              justify="center">
              <Button
                isDisabled={true}
                width="1%"
                height="60%"
                bg="#F1D803"
                colorScheme="teal">
                <ArrowBackIcon width={4} height={4} color="black" />
              </Button>
              <Text>1</Text>
              <Button
                isDisabled={true}
                width="1%"
                height="60%"
                bg="#F1D803"
                colorScheme="teal">
                <ArrowForwardIcon width={4} height={4} color="black" />
              </Button>
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
