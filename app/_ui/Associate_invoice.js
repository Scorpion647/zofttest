"use client";
import { useState, useEffect, useRef } from "react";
import {
  useMediaQuery,
  Radio,
  RadioGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Switch,
  Tooltip,
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  useDisclosure,
  Icon,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  Portal,
} from "@chakra-ui/react";
import {
  SearchIcon,
  ArrowBackIcon,
  EditIcon,
  InfoOutlineIcon,
} from "@chakra-ui/icons";
import {
  getRecords,
  getSupplier,
  getRecord,
  checkSubheadingExists,
  getSuplierInvoice,
  getMaterial,
} from "@/app/_lib/database/service";
import debounce from "lodash/debounce";
import {
  deleteSupplierData,
  insertSupplierData,
  selectSupplierData,
  updateSupplierData,
} from "../_lib/database/supplier_data";

import { getRole } from "../_lib/supabase/client";
import { userData } from "@/app/_lib/database/currentUser";
import { selectSingleSupplier } from "../_lib/database/suppliers";
import { getData } from "../_lib/database/app_data";
import {
  selectBills,
  selectByPurchaseOrder,
  selectSingleBill,
} from "../_lib/database/base_bills";
import {
  deleteInvoice,
  deleteInvoiceDocs,
  insertInvoice,
  insertInvoiceDoc,
  selectInvoice_data,
  selectSingleInvoice,
  updateInvoice,
} from "../_lib/database/invoice_data";
import {
  updateMaterial,
  insertMaterial,
  selectMaterials,
} from "../_lib/database/materials";
import { GrDocumentPdf } from "react-icons/gr";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import useSWR from "swr";
import CustomHotTable from "@/app/_ui/components/HotTable_associate";

function formatMoney(amount) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const Associate_invoice = ({
  setisTable,
  isTable,
  sharedState,
  updateSharedState,
  invoi,
}) => {
  const [isActive, setisActive] = useState(false);
  const [isButton, setButton] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const hotTableRef = useRef(null);
  const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [iMediumScreen] = useMediaQuery("(min-width: 768px) and (max-width: 1024px)",);
  const [position, setposition] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [columnSum2, setColumnSum2] = useState(0);
  const processingRef = useRef(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [copia, setcopia] = useState([]);
  const [data, setData] = useState(
    Array(200)
      .fill()
      .map(() => Array(6).fill("")),
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  const pruebas = async () => {
  let trmcop = 0;
  let result = [];

  try {
    const hot = hotTableRef.current?.hotInstance;

    if (!hot) {
      console.warn("⚠️ Handsontable todavía no está listo");
      return;
    }

    setIsLoading2(true);

    const invoice = await selectSingleInvoice(invoi);


    setisActive(
      invoice.state === "approved" ? false : invoice.state === "pending" ? false : true
    );
    setButton(
      invoice.state === "approved" ? false : invoice.state === "pending" ? true : false
    );

    // Obtener facturas
    const Data = await getSuplierInvoice(1, 200, invoi);
    setcopia(Data);

    let total = 0;
    let bultos = 0;
    let purchase = "";
    let proveedor = "";
    let cont = 0;
    const changes = [];

    const billPromises = Data.map(async (datas) => {
      if (datas && datas.base_bill_id) {
        try {
          const bill = await selectSingleBill(datas.base_bill_id);

          if (!purchase) {
            purchase = bill[0]?.purchase_order || "";
            const pro = await selectSingleSupplier(bill[0]?.supplier_id);

            setrealcurrency(bill[0]?.currency);

            if (datas.billed_currency !== bill[0]?.currency) {
              trmcop = parseFloat(
                (datas.billed_unit_price / bill[0]?.unit_price).toFixed(10)
              );
              updateSharedState("TRMCOP", trmcop);
            }

            const cachebills = await selectBills({
              limit: 300,
              page: 1,
              equals: { purchase_order: purchase },
            });

            setshoworder(purchase);
            setOrderNumber(purchase);
            setInitialRecords(cachebills);
            mutate(cachebills, false);

            proveedor = pro?.name || "";
            updateSharedState("proveedor", proveedor);

            updateSharedState("TRM", datas.billed_currency !== "COP");
            setSelectedCurrency(datas.billed_currency);
          }

          // Actualización de campos
          updateSharedState("nofactura", datas.bill_number);
          total += datas.gross_weight || 0;
          bultos += datas.packages || 0;

          changes.push({
            row: cont,
            item: bill[0].item,
            quantity: datas.billed_quantity,
          });

          cont++;
        } catch (err) {
          console.error("❌ Error en bill:", datas.base_bill_id, err);
        }
      }
    });

    await Promise.all(billPromises);

    const cantidad = Math.ceil(cont / 10);
    console.log("Cantidad calculada:", cantidad);

    // Ordenar por item
    const grouped = changes.sort((a, b) => a.item - b.item);

    // Construir filas
    result = grouped.map((entry) => [
      entry.item,     
      "",             
      entry.quantity, 
      ""             
    ]);

    // Rellenar hasta 200 filas
    while (result.length < 200) {
      result.push(["", "", "", ""]);
    }

    
    setData(result);


    updateSharedState("pesototal", parseFloat(total.toFixed(2)));
    updateSharedState("bultos", parseFloat(bultos.toFixed(2)));
  } catch (error) {
    console.error("Error en pruebas:", error);
  } finally {
    const hot = hotTableRef.current?.hotInstance;
    const currentData = result.length > 0 ? result : hot?.getData() || [];

    updateSharedState("TRMCOP", trmcop);

    const totalSum = currentData.reduce((sum, row) => {
      const unip = parseFloat(String(row[3]).replace(/[$,]/g, "")) || 0;
      const can = parseFloat(row[2]) || 0;
      return unip > 0 && can > 0 ? sum + unip * can : sum;
    }, 0);

    updateSharedState("totalfactura", formatMoney(totalSum.toFixed(2)));
  }
};




  useEffect(() => {
    const config = async () => {
      if (isTable === "Create") {
        updateSharedState("nofactura", "");
        updateSharedState("proveedor", "");
        updateSharedState("descripcion", "N/A");
        updateSharedState("unidad", "N/A");
        updateSharedState("cantidadoc", 0);
        updateSharedState("preciouni", 0);
        updateSharedState("pesopor", 0);
        updateSharedState("totalfactura", 0);
        updateSharedState("TRM", false);
        updateSharedState("bultos");
        updateSharedState("pesototal");
        updateSharedState("TRMCOP");
        setisActive(true);
        setButton(false);
        onOpen();
      } else {
        updateSharedState("proveedor", "");
        updateSharedState("descripcion", "N/A");
        updateSharedState("unidad", "N/A");
        updateSharedState("cantidadoc", 0);
        updateSharedState("preciouni", 0);
        updateSharedState("pesopor", 0);
        updateSharedState("totalfactura", 0);
        updateSharedState("TRM", false);
        updateSharedState("pesototal", 0);
        updateSharedState("TRMCOP");

        pruebas();
      }
    };
    config();
  }, []);



  const globalCounterRef = useRef({});

  function updateGlobalCounter(rowIndex, value) {
    if (value === "**********") {
      globalCounterRef.current[rowIndex] = true; // Marca la fila como secuencia automática
    } else {
      delete globalCounterRef.current[rowIndex]; // Elimina la fila del contador si no es secuencia automática
    }
  }

  function getCounter(row) {
    return globalCounterRef.current[row];
  }

  const calculateColumnSum = () => {
    const columnIndexToSum = 2;
    const columnIndexCondition = 0;
    const columnIndexToSum2 = 5;
    const columnIndexCondition2 = 0;
    const sum = data.reduce((total, row) => {
      const conditionValue = row[columnIndexCondition];

      if (conditionValue !== 0 && conditionValue !== null) {
        let valueStr = row[columnIndexToSum];

        if (typeof valueStr === "string") {
          valueStr = valueStr.replace(/,/g, ".");
        }

        let value = parseFloat(valueStr);

        if (!isNaN(value)) {
          value = parseFloat(value.toFixed(4));
        }

        return !isNaN(value) ? parseFloat((total + value).toFixed(4)) : total;
      }

      return total;
    }, 0);
    const sum2 = data.reduce((total, row) => {
      const conditionValue = row[columnIndexCondition2];
      if (
        conditionValue !== 0 &&
        conditionValue !== null &&
        conditionValue != ""
      ) {
        const value = parseFloat(row[columnIndexToSum2]);
        return !isNaN(value) ? total + value : total;
      }
      return total;
    }, 0);
    updateSharedState("columnSum", sum);
    setColumnSum2(sum2);
  };

  useEffect(() => {
    calculateColumnSum();
  }, [data]);

  useEffect(() => {
    calculateColumnSum();
  }, []);

  const handleAccept = () => {
    console.log(`Moneda seleccionada: ${selectedCurrency}`);
    if (selectedCurrency === "USD" || selectedCurrency === "EUR") {
      if (selectedCurrency === "USD") {
        setSelectedCurrency("USD");
      } else {
        setSelectedCurrency("EUR");
      }
      updateSharedState("TRM", true);
    } else {
      setSelectedCurrency("COP");
      updateSharedState("TRM", false);
    }
    onClose();
  };

  const [realcurrency, setrealcurrency] = useState("");

  const [initialRecords, setInitialRecords] = useState([]);
  const [materialResults, setMaterialResults] = useState([]);
  const [showorder, setshoworder] = useState("");
  const [edittable, setedittable] = useState(false);

  const hasFetchedMaterials = useRef(false);


  const {
    data: records,
    error,
    mutate,
  } = useSWR(
    orderNumber ? `purchaseOrderRecords-${orderNumber}` : null,
    () => Promise.resolve(initialRecords),
    {
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {

    if (!records || records.length === 0) {
      setMaterialResults([]);
      console.log("No hay registros, materialResults limpiado.");
      setedittable(false);
      return;
    }
    if (hasFetchedMaterials.current) return;

    hasFetchedMaterials.current = true; 


    (async () => {
      const results = [];
      for (const record of records) {
        try {
          const result = await selectMaterials({
            limit: 1,
            page: 1,
            equals: { material_code: record.material_code },
          });
          results.push({
            material_code: record.material_code,
            data: result || "", 
          });
        } catch (error) {
          results.push({
            material_code: record.material_code,
            data: undefined,
          });
        }
      }
      setMaterialResults(results);
      console.log("Resultados de Material:", results);
      setedittable(true);
    })();
  }, [records]);

  const handleOrderNumberChange = async (e) => {
    const order = e.target.value;
    setshoworder(order);
    hasFetchedMaterials.current = false;

    try {

      const record = await selectBills({
        limit: 300,
        page: 1,
        equals: { purchase_order: order },
      });
      console.log("Orden: ", order);
      console.log("Orden traida: ", record[0]?.purchase_order);
      if (record[0]?.purchase_order === order) {
        setOrderNumber(order);

        const supplier = await getSupplier(record[0].supplier_id);
        if (supplier && supplier.name) {
          console.log("Realcurrency: ", record[0].currency);
          setrealcurrency(record[0].currency);
          console.log("RealCurrency: ", record[0].currency);

          setInitialRecords(record);

          mutate(record, false); 
          updateSharedState("proveedor", supplier.name);
        } else {
          updateSharedState("proveedor", "");
          setrealcurrency("");
        }
      } else {
        updateSharedState("proveedor", "");
      }
    } catch (error) {
      console.error("Error fetching records", error);
      updateSharedState("proveedor", "");
    }
  };

  const handlebulto = (e) => {
    updateSharedState("bultos", e.target.value);
  };
  const handleTRMCOP = (e) => {
    updateSharedState("TRMCOP", e.target.value);
  };
  const handlepesototal = (e) => {
    updateSharedState("pesototal", e.target.value);
  };
  const handleTRM = (e) => {
    updateSharedState("valorTRM", e.target.value);
  };
  const handleNoFactura = (e) => {
    updateSharedState("nofactura", e.target.value);
  };
  const handleSwitchChange = (e) => {
    const currentValue = sharedState.TRM;

    updateSharedState("TRM", !currentValue);
    setSelectedCurrency(
      selectedCurrency === "USD" ?
        !currentValue === true ?
          "USD"
          : "COP"
        : selectedCurrency === "EUR" ?
          !currentValue === true ?
            "EUR"
            : "COP"
          : !currentValue === true ? "USD"
            : "COP",
    );
    console.log(
      "Esto es despues del switch: ",
      selectedCurrency === "USD" ?
        !currentValue === true ?
          "USD"
          : "COP"
        : selectedCurrency === "EUR" ?
          !currentValue === true ?
            "EUR"
            : "COP"
          : !currentValue === true ? "USD"
            : "COP",
    );
  };
  const toggleActive = () => {
    setisActive((prevState) => !prevState); 
  };

  const debounceTimeoutRef = useRef(null);
  const debounceTimeoutRef1 = useRef(null);
  const debounceTimeoutRef2 = useRef(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (orderNumber) {
        clearRowsWithValuesInColumn0();
      }
    }, 700);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [orderNumber, sharedState.TRM, sharedState.TRMCOP]);

  useEffect(() => {
    if (debounceTimeoutRef1.current) {
      clearTimeout(debounceTimeoutRef1.current);
    }

    debounceTimeoutRef1.current = setTimeout(() => {
      if (showorder) {
        if (showorder.trim() !== "") {
          setIsLoading(true);

          getRecords(1, 40000)
            .then((data) => {
              if (Array.isArray(data)) {
                const matchingRecords = data
                  .map((record) => record.purchase_order)
                  .filter(
                    (value, index, self) =>
                      self.indexOf(value) === index &&
                      value.includes(showorder),
                  );

                if (matchingRecords.length > 4) {
                  setSuggestions(matchingRecords.slice(0, 4));
                  setRemainingCount(matchingRecords.length - 4);
                } else {
                  setSuggestions(matchingRecords);
                  setRemainingCount(0);
                }
              } else {
                setSuggestions([]);
                setRemainingCount(0);
              }
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          setSuggestions([]);
          setRemainingCount(0);
        }
      }
    }, 500);
    return () => {
      if (debounceTimeoutRef1.current) {
        clearTimeout(debounceTimeoutRef1.current);
      }
    };
  }, [showorder]);

  const clearRowsWithValuesInColumn0 = debounce(async () => {
    if (!hotTableRef.current) return;
    const hot = hotTableRef.current.hotInstance;
    const data = hot.getData();

    await sleep(1500);
    const changes = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const pos = row[0];

      if (
        !orderNumber ||
        pos === null ||
        pos === undefined ||
        pos === "" ||
        isNaN(pos)
      ) {
        continue;
      }

      try {
        const [records, revi] = await Promise.all([
          getRecord(orderNumber, pos),
          getRecord(orderNumber, 1),
        ]);

        if (records && !("message" in records)) {
          const hola = Number(records.item);
          const hola1 = Number(revi.item);

          if (row[0]) {
            if (hola === Number(row[0])) {
              const {
                material_code,
                unit_price,
                total_quantity,
                pending_quantity,
                approved_quantity,
              } = records;

              if (
                parseFloat(approved_quantity) < parseFloat(total_quantity) ||
                isLoading2
              ) {
                const materialDetails = await selectMaterials({
                  limit: 1,
                  page: 1,
                  equals: { material_code: material_code },
                });
                const subheading = materialDetails[0]?.subheading || "";

                changes.push([rowIndex, 1, material_code]);

                console.log(realcurrency);
                console.log(selectedCurrency);
                if (
                  ((realcurrency === "USD" || realcurrency === "EUR") &&
                    selectedCurrency === "COP") ||
                  (selectedCurrency === "USD" && realcurrency === "EUR") ||
                  (selectedCurrency === "EUR" && realcurrency === "USD")
                ) {
                  console.log("1");
                  changes.push([
                    rowIndex,
                    3,
                    String(
                      formatMoney((unit_price / 100) * sharedState.TRMCOP),
                    ),
                  ]);
                  changes.push([
                    rowIndex,
                    4,
                    String(
                      formatMoney(
                        (unit_price / 100) *
                        sharedState.TRMCOP *
                        data[rowIndex][2],
                      ),
                    ),
                  ]);
                } else if (
                  realcurrency === "COP" &&
                  selectedCurrency !== "COP"
                ) {
                  console.log("2");
                  changes.push([
                    rowIndex,
                    3,
                    String(
                      formatMoney((unit_price / 100) * sharedState.TRMCOP),
                    ),
                  ]);
                  changes.push([
                    rowIndex,
                    4,
                    String(
                      formatMoney(
                        (unit_price / 100) *
                        sharedState.TRMCOP *
                        data[rowIndex][2],
                      ),
                    ),
                  ]);
                } else if (realcurrency === selectedCurrency) {
                  console.log("2");
                  changes.push([
                    rowIndex,
                    3,
                    String(formatMoney(unit_price / 100)),
                  ]);
                  changes.push([
                    rowIndex,
                    4,
                    String(formatMoney((unit_price / 100) * data[rowIndex][2])),
                  ]);
                } else {
                  console.log("4");
                  changes.push([rowIndex, 3, ""]);
                  changes.push([rowIndex, 4, ""]);
                }
                if (subheading) {
                  changes.push([rowIndex, 5, String("**********")]);
                } else {
                  changes.push([rowIndex, 5, String("")]);
                }
              }
            } else if (hola1 === 1) {
              changes.push([rowIndex, 0, ""]);
            }
          }
        } else {
          console.log("Error en records:");
        }
      } catch (error) {
        console.log("Error en el procesamiento de fila:", error);
      }
    }

    if (changes.length > 0) {
      hot.batch(() => {
        changes.forEach(([row, col, value]) => {
          hot.setDataAtCell(row, col, value);
        });
      });
    }

    if (isTable !== "Create" && isLoading2 === true) {
      setIsLoading2(false);
    }
  }, 300);

  const UpdateData = async () => {
    const userConfirmed = window.confirm(
      "¿Estás seguro de que deseas realizar la siguiente asociación de factura?",
    );
    if (!userConfirmed) return;

    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance)
      return console.error("No hay instancia de Handsontable disponible.");

    if (
      !sharedState.pesototal ||
      !sharedState.bultos ||
      !sharedState.nofactura ||
      (realcurrency !== selectedCurrency &&
        (!sharedState.TRMCOP || sharedState.TRMCOP <= 0))
    ) {
      window.alert("Error, debe llenar todos los campos requeridos.");
      return;
    }
    console.log("Estamos en update");

    const tableData = hotInstance.getData();
    const records = [];
    const update = [];
    const seenPositions = new Set();
    const duplicatePositions = new Map();
    const incompleteRows = [];
    let id = invoi;
    let suname = "";
    let email = "";
    let copiaa = copia;
    let hasCompleteRow = false;
    let currency = "";
    let unit = 0;
    let total = 0;

    let invoiceDocUpdated = false;

    for (const [index, row] of tableData.entries()) {
      const isEmptyRow = row.every(
        (cell) => cell === null || cell === "" || cell === undefined,
      );
      if (isEmptyRow) continue;

      const [
        record_position,
        material_code,
        billed_quantity,
        bill_number,
        ,
        subheading,
      ] = row;

      if (
        record_position &&
        material_code &&
        bill_number &&
        billed_quantity &&
        subheading
      ) {
        const prue = await checkSubheadingExists(subheading);
        if (
          String(subheading) !== "**********" &&
          (String(subheading).length !== 10 || prue !== true)
        ) {
          window.alert(
            "Error, una subpartida ingresada no es valida, por favor revise y vuelva a intentar",
          );
          return;
        }

        hasCompleteRow = true;
        const pos = hotInstance.getDataAtCell(index, 0);

        const matchedRecord = await selectBills({
          limit: 1,
          page: 1,
          equals: { purchase_order: orderNumber, item: pos },
        });
        if (!matchedRecord[0]?.base_bill_id) {
          console.error(`No se encontró el registro para la posición ${pos}`);
          continue;
        }

        if (currency === "") {
          currency = matchedRecord[0]?.currency;
        }

        unit = matchedRecord[0]?.unit_price / 100;
        total =
          (matchedRecord[0]?.unit_price / 100) *
          parseFloat(hotInstance.getDataAtCell(index, 2));

        const { base_bill_id, supplier_id } = matchedRecord[0];

        if (selectedFile !== null && !invoiceDocUpdated) {
          try {
            const invoices = await selectInvoice_data({
              limit: 1,
              page: 1,
              equals: { invoice_id: id },
            });
            const deletedoc = await deleteInvoiceDocs(
              invoices[0]?.invoice_docs[0],
              supplier_id,
            );
            const doc = await insertInvoiceDoc(supplier_id, id, selectedFile);
            invoiceDocUpdated = true;
          } catch (error) {
            console.error("Error completo:", error);
            if (error.message)
              console.error("Mensaje de error:", error.message);
            if (error.details)
              console.error("Detalles del error:", error.details);
          }
        }

        if (subheading !== "**********") {
          const valida = await selectMaterials({
            limit: 1,
            page: 1,
            equals: { material_code },
          });
          if (valida[0]?.material_code === material_code) {
            await updateMaterial({ material_code, subheading });
          } else {
            await insertMaterial({ material_code, subheading });
          }
        }

        const factunitprice =
          currency === selectedCurrency ? unit : (
            parseFloat(
              String(hotInstance.getDataAtCell(index, 3)).replace(/[$,]/g, ""),
            )
          );
        const totalprice =
          currency === selectedCurrency ? total : (
            (
              factunitprice * parseFloat(hotInstance.getDataAtCell(index, 2))
            ).toFixed(2)
          );
        const gross = (
          (hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) *
          sharedState.pesototal
        ).toFixed(9);
        const packag = (
          (hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) *
          sharedState.bultos
        ).toFixed(9);
        let conver = 0;
        let trm = 0;

        if (sharedState.TRM) {
          trm =
            selectedCurrency === "USD" ?
              await getExchangeRate("trm_usd")
              : await getExchangeRate("trm_eur");
          conver = selectedCurrency === "USD" ? "USD" : "EUR";
        } else {
          trm = await getExchangeRate("trm_usd");
          conver = "COP";
        }

        // Manejo de posiciones duplicadas
        if (seenPositions.has(record_position)) {
          if (!duplicatePositions.has(record_position)) {
            duplicatePositions.set(record_position, []);
          }
          duplicatePositions.get(record_position).push(index + 1);
        } else {
          seenPositions.add(record_position);

          const objeto = copia.find(
            (objeto) => objeto.base_bill_id === base_bill_id,
          );

          // Filtrar eliminaciones
          const nuevoArray = copiaa.filter(
            (objeto) => objeto.base_bill_id !== base_bill_id,
          );
          if (nuevoArray.length !== copiaa.length) {
            copiaa = nuevoArray;
          }

          const record = {
            base_bill_id,
            bill_number: String(sharedState.nofactura),
            trm: parseFloat(trm),
            billed_quantity: parseInt(billed_quantity),
            billed_unit_price: Math.round(factunitprice * 100),
            billed_total_price: Math.round(totalprice * 100),
            gross_weight: parseFloat(gross),
            packages: parseFloat(packag),
            billed_currency: conver,
            invoice_id: id,
            modified_at: new Date().toISOString(),
          };

          // Actualizar si ya existe, crear si es nuevo
          if (objeto) {
            const up = {
              bill_number: String(sharedState.nofactura),
              supplier_data_id: objeto.supplier_data_id,
              trm: parseFloat(trm),
              billed_quantity: parseInt(billed_quantity),
              billed_unit_price: Math.round(factunitprice * 100),
              billed_total_price: Math.round(totalprice * 100),
              gross_weight: parseFloat(gross),
              packages: parseFloat(packag),
              billed_currency: conver,
              modified_at: new Date().toISOString(),
            };
            update.push(up);
          } else {
            records.push(record);
          }
        }
      } else {
        incompleteRows.push(index + 1);
      }
    }

    if (incompleteRows.length > 0) {
      alert(`ERROR: revise las siguientes filas: ${incompleteRows.join(", ")}`);
      return;
    }

    if (!hasCompleteRow) {
      alert("Debe haber al menos una fila completa.");
      return;
    }

    if (duplicatePositions.size > 0) {
      const duplicatesMsg = Array.from(duplicatePositions.entries())
        .map(
          ([pos, indices]) => `Posición ${pos}: Fila(s) ${indices.join(", ")}`,
        )
        .join("\n");
      alert(`Hay posiciones duplicadas:\n${duplicatesMsg}`);
      return;
    }

    if (copiaa.length > 0) {
      for (const objeto of copiaa) {
        if (Object.keys(objeto).length > 0) {
          try {
            console.log(
              "eliminamos uno sesupone, este es su supplier_data: ",
              objeto.supplier_data_id,
            );
            await deleteSupplierData(objeto.supplier_data_id);
          } catch (error) {
            console.error("Error en la eliminación:", error);
          }
        }
      }
    }

    // Procesar eliminaciones, actualizaciones y creaciones
    try {
      if (records.length > 0) {
        await insertSupplierData(records);
      }

      if (update.length > 0) {
        await updateSupplierData(update);
      }
      const now = new Date();
      await updateInvoice({
        invoice_id: id,
        state: "pending",
        feedback: "",
        updated_at: now.toISOString().replace("T", " ").replace("Z", "+00"),
      });
      alert("Registros enviados correctamente.");
      setisTable(false);
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error al enviar los registros.");
    }
  };

  const columns = [
    {
      data: 0,
      readOnly:
        !isActive ? true
          : edittable === true ? false
            : true,
      title: "Posicion",
    },
    { data: 1, readOnly: true, title: "Codigo de Material" },
    {
      data: 2,
      readOnly:
        !isActive ? true
          : edittable === true ? false
            : true,
      title: "Cantidad",
    },
    { data: 3, readOnly: true, title: "Precio Unitario" },
    { data: 4, readOnly: true, title: "Valor Neto" },
    {
      data: 5,
      readOnly:
        !isActive ? true
          : edittable === true ? false
            : true,
      title: "Subpartida ",
    },
  ];

  const handleCellDoubleClick = (event, coords, TD) => {

    if (processingRef.current) return;
    processingRef.current = true;


    setTimeout(async () => {
      try {
        const currentTime = Date.now();
        const cellValue = (data[coords.row]?.[coords.col] || "")
          .toString()
          .trim();
        const pos = (data[coords.row]?.[0] || "").toString().trim();
        const quanti = parseInt(
          (data[coords.row]?.[2] || "0").toString().trim(),
          10
        );

        const updates = {};

        if (!orderNumber || !pos || isNaN(Number(orderNumber)) || isNaN(Number(pos))) {
          Object.assign(updates, {
            descripcion: "N/A",
            cantidadoc: 0,
            preciouni: 0,
            facttotal: 0,
            pesopor: 0,
            unidad: "N/A",
            SelectedCellValue: cellValue,
          });
        } else {
          const record = records.find(
            (r) =>
              Number(r.item) === Number(pos) &&
              r.purchase_order === orderNumber
          );
          if (!record) {
            Object.assign(updates, {
              descripcion: "N/A",
              cantidadoc: 0,
              preciouni: 0,
              facttotal: 0,
              pesopor: 0,
              unidad: "N/A",
              SelectedCellValue: cellValue,
            });
          } else {
            const {
              unit_price,
              currency,
              measurement_unit,
              description,
              total_quantity,
              approved_quantity,
              pending_quantity,
              base_bill_id,
            } = record;

            updates.descripcion = description;
            updates.unidad = measurement_unit;

            let billedQty = 0;
            if (isTable !== "Create") {
              const sup = await selectSupplierData({
                page: 1,
                limit: 1,
                equals: { invoice_id: invoi, base_bill_id },
              });
              billedQty = sup[0]?.billed_quantity || 0;
            }

            if (isTable === "Create" || billedQty === 0) {
              updates.cantidadoc =
                total_quantity - approved_quantity - pending_quantity;
              updates.totalOC = total_quantity;
              updates.OCusada = approved_quantity + pending_quantity;
            } else {
              updates.cantidadoc =
                total_quantity -
                (approved_quantity + pending_quantity) +
                billedQty;
              updates.totalOC = total_quantity;
              updates.OCusada =
                approved_quantity + pending_quantity - billedQty;
            }

            if (realcurrency === "COP") {
              const trm = await getExchangeRate("trm_usd");
              updates.preciouni = unit_price / trm;
            } else if (realcurrency === "EUR") {
              const trm = await getExchangeRate("trm_eur");
              updates.preciouni = unit_price * trm;
            } else {
              updates.preciouni = unit_price;
            }
            updates.moneda = currency;

            const factorPrice =
              selectedCurrency === "COP" && realcurrency !== "COP"
                ? unit_price * sharedState.valorTRM
                : unit_price;
            updates.factunit = factorPrice;
            updates.facttotal = factorPrice * quanti || 0;

            const columnSum = sharedState.columnSum || 1;
            const percentage = ((data[coords.row]?.[2] || 0) / columnSum) * 100;
            updates.cantidadespor = percentage.toFixed(2);

            const pesoTotal = sharedState.pesototal || 0;
            updates.pesopor = isNaN((percentage * pesoTotal) / 100)
              ? 0
              : ((percentage * pesoTotal) / 100).toFixed(2);
            updates.factor = (
              (percentage * pesoTotal) /
              100 /
              (data[coords.row]?.[2] || 1)
            ).toFixed(8);
            updates.bulto = (
              (percentage * (sharedState.bultos || 0)) /
              100
            ).toFixed(3);

            updates.SelectedCellValue = cellValue;
          }
        }

        // total factura
        const totalSum = data.reduce((sum, row) => {
          const unip = parseFloat(String(row[3]).replace(/[$,]/g, "")) || 0;
          const can = parseFloat(row[2]) || 0;
          return unip > 0 && can > 0 ? sum + unip * can : sum;
        }, 0);
        updates.totalfactura = formatMoney(totalSum.toFixed(2));

        Object.entries(updates).forEach(([key, val]) => {
          updateSharedState(key, val);
        });
        setLastClickTime(currentTime);
      } catch (err) {
        console.error("Error en handleCellDoubleClick:", err);
      } finally {

        setTimeout(() => {
          processingRef.current = false;
        }, 0);
      }
    }, 0);
  }

  useEffect(() => {
    if (debounceTimeoutRef2.current) {
      clearTimeout(debounceTimeoutRef2.current);
    }

    debounceTimeoutRef2.current = setTimeout(() => {
      const totalSum = data.reduce((sum, row) => {
        const unip = parseFloat(String(row[3]).replace(/[$,]/g, "")) || 0;
        const can = parseFloat(row[2]) || 0;
        return unip > 0 && can > 0 ? sum + unip * can : sum;
      }, 0);
      updateSharedState("totalfactura", formatMoney(totalSum.toFixed(2)));
    }, 2000);

    return () => {
      if (debounceTimeoutRef2.current) {
        clearTimeout(debounceTimeoutRef2.current);
      }
    };
  }, [sharedState.TRM, sharedState.TRMCOP]);

  useEffect(() => {
    if (sharedState.TRM) {
      updateSharedState("TRMCOP");
    }
  }, [sharedState.TRM]);

  const handleAfterSelection = (row, column, row2, column2) => {
    const coords = { row, col: column };
    handleCellDoubleClick(null, coords);
  };

  async function getExchangeRate(currency) {
    try {
      const data = await getData(currency);
      if (data[0].value !== null && data[0].value !== undefined) {
        return data[0].value.toString();
      }
    } catch { }
    return "0";
  }

  const handleSubmit = async () => {
    const userConfirmed = window.confirm(
      "Estimado usuario, compare que el subtotal de su factura concuerde con el subtotal registrado en el sistema.\n \n ¿Estás seguro de que deseas realizar la siguiente asociación de factura?",
    );

    if (!userConfirmed) {
      return;
    }

    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) {
      console.error(
        "Handsontable instance has been destruido o no está disponible.",
      );
      return;
    }

    if (
      !sharedState.pesototal ||
      !sharedState.bultos ||
      !sharedState.nofactura ||
      (realcurrency !== selectedCurrency &&
        (!sharedState.TRMCOP || sharedState.TRMCOP <= 0))
    ) {
      window.alert("Error, debe llenar todos los campos requeridos.");
      return;
    }

    setIsLoading2(true);
    const tableData = hotInstance.getData();
    const records = [];
    const update = [];
    const seenPositions = new Set();
    const duplicatePositions = new Map();
    const incompleteRows = [];
    let id;
    let copia = 0;
    let suname = "";
    let email = "";
    let hasCompleteRow = false;
    let subheading = [];
    let currency = "";
    let total = 0;
    let unit = 0;
    let fileList = {};
    const updatematerials = [];
    const insertmaterials = [];

    for (const [index, row] of tableData.entries()) {
      const isEmptyRow = row.every(
        (cell) => cell === null || cell === "" || cell === undefined,
      );
      if (isEmptyRow) continue;

      const [
        record_position,
        material_code,
        billed_quantity,
        bill_number,
        ,
        subheading,
      ] = row;

      if (
        record_position &&
        material_code &&
        bill_number &&
        billed_quantity &&
        subheading
      ) {
        const prue = await checkSubheadingExists(subheading);
        if (
          String(subheading) !== "**********" &&
          (String(subheading).length !== 10 || prue !== true)
        ) {
          setIsLoading2(false);
          window.alert(
            "Error, una subpartida ingresada no es valida, por favor revise y vuelva a intentar",
          );
          return;
        }

        hasCompleteRow = true;
        const pos = hotInstance.getDataAtCell(index, 0);
        const matchedRecord = await getRecord(orderNumber, pos);

        if (!matchedRecord) {
          console.error(`No se encontró el registro para la posición ${pos}`);
          continue;
        }

        if (currency === "") {
          currency = matchedRecord.currency;
        }

        unit = matchedRecord.unit_price / 100;
        total =
          (matchedRecord.unit_price / 100) *
          parseFloat(hotInstance.getDataAtCell(index, 2));

        const {
          base_bill_id,
          unit_price,
          material_code,
          total_quantity,
          supplier_id,
        } = matchedRecord;

        if (id === undefined || id === null) {
          const role = await getRole();
          const user = await userData();
          email = user.data.user.email;
          if (selectedFile === null && role !== "administrator") {
            window.alert(
              "Factura no subida, Introduzca su factura atravez de opciones de factura",
            );
            setIsLoading2(false);
            return;
          }
          const sup = await selectSingleSupplier(supplier_id);
          suname = sup.name;

          if (selectedFile !== null) {
            try {
              const newInvoice = await insertInvoice(
                { supplier_id: supplier_id, state: "pending" },
                selectedFile,
              );
              console.log(
                "se creooooo: ",
                newInvoice.invoiceData[0].invoice_id,
              );
              id = newInvoice.invoiceData[0].invoice_id;
              copia = 1;
            } catch (error) {
              console.error("Error completo:", error);
              if (error.message) {
                console.error("Mensaje de error:", error.message);
              }
              if (error.details) {
                console.error("Detalles del error:", error.details);
              }
            }
          } else {
            const newInvoice = await insertInvoice({
              supplier_id: supplier_id,
              state: "pending",
            });
            console.log("se creooooo: ", newInvoice.invoiceData[0].invoice_id);
            id = newInvoice.invoiceData[0].invoice_id;
            copia = 1;
          }
        }

        if (subheading !== "**********") {
          const exists = updatematerials.some(
            (item) => item.target === material_code,
          );
          const exists2 = insertmaterials.some(
            (item) => item.material_code === material_code,
          );
          if (!exists && !exists2) {
            const valida = await getMaterial(material_code);
            if (valida?.material_code === material_code) {
              const material = {
                target: material_code,
                data: {
                  subheading: subheading,
                },
              };
              updatematerials.push(material);
            } else {
              const material = {
                material_code: material_code,
                subheading: subheading,
              };
              insertmaterials.push(material);
            }
          }
        }

        const factunitprice =
          currency === selectedCurrency ? unit : (
            parseFloat(
              String(hotInstance.getDataAtCell(index, 3)).replace(/[$,]/g, ""),
            )
          );

        const totalprice =
          currency === selectedCurrency ? total : (
            (
              factunitprice * parseFloat(hotInstance.getDataAtCell(index, 2))
            ).toFixed(2)
          );

        const gross = (
          (hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) *
          sharedState.pesototal
        ).toFixed(9);
        const packag = (
          (hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) *
          sharedState.bultos
        ).toFixed(9);
        let conver = 0;
        let trm = 0;

        if (sharedState.TRM) {
          trm =
            selectedCurrency === "USD" ?
              await getExchangeRate("trm_usd")
              : await getExchangeRate("trm_eur");
          conver = selectedCurrency === "USD" ? "USD" : "EUR";
        } else {
          trm = await getExchangeRate("trm_usd");
          conver = "COP";
        }

        if (seenPositions.has(record_position)) {
          if (!duplicatePositions.has(record_position)) {
            duplicatePositions.set(record_position, []);
          }
          duplicatePositions.get(record_position).push(index + 1);
        } else {
          seenPositions.add(record_position);

          const record = {
            base_bill_id: base_bill_id,
            bill_number: String(sharedState.nofactura),
            trm: parseFloat(trm),
            billed_quantity: parseFloat(billed_quantity),
            billed_unit_price: Math.round(factunitprice * 100),
            billed_total_price: Math.round(totalprice * 100),
            gross_weight: parseFloat(gross),
            packages: parseFloat(packag),
            billed_currency: conver,
            invoice_id: id,
          };

          records.push(record);

          const purchase_order = orderNumber;
          const item = pos;
          const new_data = {
            pendong_quantity: total_quantity - billed_quantity,
          };

          update.push({ purchase_order, item, new_data });
        }
      } else {
        incompleteRows.push(index + 1);
      }
    }

    if (incompleteRows.length > 0) {
      setIsLoading2(false);
      alert(`ERROR: revise las siguientes filas: ${incompleteRows.join(", ")}`);
      if (copia === 1) {
        await deleteInvoice(id);
      }
      return;
    }

    if (!hasCompleteRow) {
      setIsLoading2(false);
      alert("Debe haber al menos una fila completa.");
      return;
    }

    if (duplicatePositions.size > 0) {
      setIsLoading2(false);
      const duplicatesMsg = Array.from(duplicatePositions.entries())
        .map(
          ([pos, indices]) => `Posición ${pos}: Fila(s) ${indices.join(", ")}`,
        )
        .join("\n");
      alert(`Hay posiciones duplicadas:\n${duplicatesMsg}`);
      if (copia === 1) {
        await deleteInvoice(id);
      }
      return;
    }

    try {
      await updateMaterial(updatematerials);
      await insertMaterial(insertmaterials);
      await insertSupplierData(records);
      const date = transformDateTime(new Date());
      sendEmail(id);
      setIsLoading2(false);
      alert("Registros enviados correctamente.");
      setisTable(false);
    } catch (error) {
      console.error("Error completo:", error);
      if (error.message) {
        console.error("Mensaje de error:", error.message);
      }
      if (error.details) {
        console.error("Detalles del error:", error.details);
      }
      if (copia === 1) {
        await deleteInvoice(id);
      }
      alert("Error al enviar los registros.  ");

      setIsLoading2(false);
    }
  };

  function transformDateTime(inputDate) {
    const date = new Date(inputDate);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedMinutes = minutes < 10 ? "00" : minutes;

    const formattedDate = `${year}-${month}-${day} ${hours}:${formattedMinutes} ${ampm}`;

    return formattedDate;
  }

  const sendEmail = async (invoice) => {
    const data = {
      invoice_id: invoice,
      type: "Ingreso",
      header: "Tu solicitud ha sido recibida para revisión",
      subject: "Ingreso de solicitud: " + invoice,
    };

    const res = await fetch("/api/mail/supplier-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (result.error) {
      console.error(result.error);
    }
  };

  const [subheadingValidity, setSubheadingValidity] = useState(new Map());

  const [isUploaded, setIsUploaded] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(event.target.files);
      setIsUploaded(true);
    } else {
      alert("Por favor, selecciona un archivo PDF.");
      setSelectedFile(null);
      setIsUploaded(false);
    }
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const [isDesktop1440] = useMediaQuery("(min-width: 1430px)");

  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl border border-gray-300 bg-gradient-to-tr from-gray-200 to-gray-300 p-4 text-center shadow-md`}>
      {isLoading2 && (
        <Box
          bg="white"
          className="absolute left-0 top-0 z-50 h-full w-full"
          display="flex"
          justifyContent="center"
          alignItems="center">
          <Spinner size="xl" />
          <Text ml={4}>Obteniendo Base de datos...</Text>
        </Box>
      )}

      <>
        <HStack position="relative" width="100%" height="20%">
          <VStack width="25%">
            <HStack
              width="100%"
              height="15px"
              textAlign="start"
              align="start"
              justify="start">
              <Tooltip fontSize="md" placement="top" label="Regresar">
                <Button
                  onClick={() => setisTable(false)}
                  width="30%"
                  height="100%"
                  colorScheme="teal"
                  backgroundColor="#F1D803">
                  <ArrowBackIcon w={3} h={3} color="black" />
                </Button>
              </Tooltip>
              {isButton && !isActive && (
                <Tooltip
                  placement="top"
                  label="Habilitar Edicion"
                  fontSize="md">
                  <Button
                    onClick={toggleActive}
                    width="30%"
                    height="100%"
                    colorScheme="teal"
                    backgroundColor="#F1D803">
                    <Icon as={EditIcon} w={3} h={3} color="black" />
                  </Button>
                </Tooltip>
              )}
            </HStack>

            <HStack width="100%" align="start" justify="start">
              <Input
                border="1px"
                backgroundColor="white"
                isDisabled={isTable !== "Create"}
                type="text"
                value={showorder}
                onChange={handleOrderNumberChange}
                placeholder="Orden de Compra"
              />
              <Tooltip
                label={
                  suggestions.length > 0 ?
                    suggestions.join(", ") +
                    (remainingCount > 0 ? ` y ${remainingCount} más` : "")
                    : "No hay coincidencias"
                }
                isOpen={isHovered && suggestions.length > 0}
                placement="bottom"
                hasArrow
                bg="gray.300"
                color="black"
                isDisabled={isLoading}>
                <Button
                  isDisabled={suggestions.length === 0 || showorder === ""}
                  ref={buttonRef}
                  isLoading={
                    isLoading ||
                    (!isLoading && !edittable && sharedState.proveedor !== "")
                  }
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  colorScheme="teal"
                  backgroundColor="#F1D803">
                  <SearchIcon w={5} h={5} color="black" />
                </Button>
              </Tooltip>
            </HStack>
            <HStack width="100%" align="start" justify="start">
              <Popover placement="bottom-start">
                <PopoverTrigger align="start" justify="start">
                  <Button
                    isDisabled={!isActive}
                    colorScheme="teal"
                    h="5"
                    bgColor="#F1D803">
                    <Text textColor="black" fontSize="60%">
                      Opciones
                    </Text>
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  w="auto"
                  maxW="250px"
                  p={2}
                  boxShadow="lg"
                  borderRadius="md">
                  <PopoverCloseButton />
                  <PopoverHeader fontWeight="bold">
                    Opciones de Factura
                  </PopoverHeader>
                  <PopoverBody>
                    <VStack spacing="4" justify="start" align="start">
                      <HStack width="100%" spacing={3}>
                        <Text className="font-bold" fontSize="80%">
                          Factura en:
                        </Text>
                        <HStack>
                          <Text className="font-semibold" fontSize="70%">
                            COP
                          </Text>
                          <Switch
                            sx={{
                              "&[data-checked] .chakra-switch__track": {
                                bg: "#F1D803", 
                              },
                            }}
                            isDisabled={!isActive}
                            isChecked={sharedState.TRM}
                            onChange={handleSwitchChange}
                          />
                          <Text className="font-semibold" fontSize="70%">
                            {selectedCurrency === "USD" ?
                              "USD"
                              : selectedCurrency === "EUR" ?
                                "EUR"
                                : "USD"}
                          </Text>
                        </HStack>
                        {realcurrency !== "" && (
                          <Tooltip
                            label={
                              "Orden de compra registrada en: " +
                              (realcurrency === "USD" ? "Dólares"
                                : realcurrency === "EUR" ? "Euros"
                                  : "Pesos Colombianos")
                            }>
                            <InfoOutlineIcon w={3} h={3} color="black" />
                          </Tooltip>
                        )}
                      </HStack>

                      <HStack>
                        <Text className="font-bold" fontSize="80%">
                          Subir Factura:{" "}
                        </Text>
                        <HStack
                          justify="center"
                          alignItems="center"
                          spacing={3}>
                          {/* Subir PDF */}
                          <Tooltip label="Subir archivo PDF">
                            <label className="flex cursor-pointer items-center">
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                              <Icon
                                as={GrDocumentPdf}
                                w={6}
                                h={6}
                                className="rounded bg-[#F1D803] p-1"
                              />
                            </label>
                          </Tooltip>
                          {isUploaded ?
                            <CheckIcon color="green.500" w={4} h={4} />
                            : <CloseIcon color="red.500" w={4} h={4} />}
                        </HStack>
                      </HStack>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </HStack>
          </VStack>
          <HStack width="2.5%"></HStack>
          <VStack width="40%" spacing={0}>
            <HStack
              className="rounded-2xl bg-white"
              paddingY="2"
              paddingX="3"
              position="relative"
              width="100%"
              spacing={0}>
              <VStack spacing={0} align="start" justify="start" width="30%">
                <Text
                  h="20%"
                  className="font-semibold"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  Descripcion:
                </Text>
                <Text
                  h="20%"
                  className="font-semibold"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  Cantidad en OC:
                </Text>
                <Text
                  h="20%"
                  className="font-semibold"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  Unidad de Medida:
                </Text>
                <Text
                  h="20%"
                  className="font-semibold"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  Valor en Dolares
                </Text>
              </VStack>
              <VStack spacing={0} align="end" justify="end" width="70%">
                <Text
                  h="20%"
                  className="w-full justify-end overflow-hidden truncate overflow-ellipsis text-end"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  {sharedState.descripcion}
                </Text>
                <HStack rounded="2xl" backgroundColor="#F1D803" paddingX={2} >
                  {(sharedState.cantidadoc > 0 ||
                    sharedState.OCusada === sharedState.totalOC) && (
                      <Popover placement="top">
                        <PopoverTrigger>
                          <InfoOutlineIcon
                            w={3}
                            h={3}
                            color="black"
                            cursor="pointer"
                          />
                        </PopoverTrigger>
                        <Portal>
                          <PopoverContent
                            border="1px"
                            borderColor="black"
                            className="items-center">
                            <HStack spacing={3}>
                              <VStack spacing={0}>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  className="font-bold">
                                  Cant. total
                                </Text>
                                <Text fontSize={iMediumScreen ? "60%" : "70%"}>
                                  {sharedState.totalOC}
                                </Text>
                              </VStack>
                              <VStack spacing={0}>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  visibility="hidden">
                                  a
                                </Text>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  className="font-bold">
                                  =
                                </Text>
                              </VStack>
                              <VStack spacing={0}>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  className="font-bold">
                                  Cant. usada
                                </Text>
                                <Text fontSize={iMediumScreen ? "60%" : "70%"}>
                                  {sharedState.OCusada}
                                </Text>
                              </VStack>
                              <VStack spacing={0}>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  visibility="hidden">
                                  a
                                </Text>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  className="font-bold">
                                  +
                                </Text>
                              </VStack>
                              <VStack spacing={0}>
                                <Text
                                  fontSize={iMediumScreen ? "60%" : "70%"}
                                  className="font-bold">
                                  Cant. disponible
                                </Text>
                                <Text fontSize={iMediumScreen ? "60%" : "70%"}>
                                  {sharedState.cantidadoc}
                                </Text>
                              </VStack>
                            </HStack>
                          </PopoverContent>
                        </Portal>
                      </Popover>
                    )}
                  <Text
                    h="20%"
                    className="truncate font-bold"
                    fontSize={iMediumScreen ? "60%" : "70%"}>
                    {sharedState.cantidadoc}
                  </Text>
                </HStack>
                <Text
                  h="20%"
                  className="truncate"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  {sharedState.unidad}
                </Text>
                <Text
                  h="20%"
                  className="truncate"
                  fontSize={iMediumScreen ? "60%" : "70%"}>
                  {formatMoney(parseFloat(sharedState.preciouni / 100))}
                </Text>
              </VStack>
            </HStack>
            <VStack position="relative" spacing={0}>
              {selectedCurrency.trim().toLowerCase() !==
                realcurrency.trim().toLowerCase() &&
                sharedState.proveedor !== "" && (
                  <HStack
                    ml={iMediumScreen ? 40 : 20}
                    top={isDesktop1440 ? 2 : 0}
                    height="30px"
                    width="300px"
                    position="absolute">
                    <Text fontSize={iMediumScreen ? "50%" : "70%"}>
                      TRM Factura
                    </Text>
                    <Tooltip
                      placement="top"
                      label="Introduzca la trm con la que facturo">
                      <Input
                        fontSize={iMediumScreen ? "70%" : "90%"}
                        onClick={() => updateSharedState("TRMCOP")}
                        className="placeholder:text-center"
                        placeholder={realcurrency + " --> " + selectedCurrency}
                        isDisabled={!isActive}
                        type="number"
                        min="1"
                        step="0.0000000001"
                        value={
                          isTable !== "Create" ? sharedState.TRMCOP : undefined
                        }
                        onBlur={handleTRMCOP}
                        h="25px"
                        width={iMediumScreen ? "40%" : "190px"}
                        bg="white"></Input>
                    </Tooltip>
                    <Tooltip
                      fontSize="xs"
                      label={
                        realcurrency !== "" ?
                          "Orden de compra registrada en " +
                          (realcurrency === "USD" ? "Dolares"
                            : realcurrency === "EUR" ? "Euros"
                              : "Pesos Colombianos") +
                          " y se facturara en " +
                          (selectedCurrency === "USD" ? "Dolares"
                            : selectedCurrency === "EUR" ? "Euros"
                              : "Pesos Colombianos")
                          : ""
                      }>
                      <InfoOutlineIcon w={3} h={3} color="black" />
                    </Tooltip>
                  </HStack>
                )}
            </VStack>
          </VStack>
          <HStack width="2.5%"></HStack>
          <VStack
            className="rounded-2xl bg-white"
            padding="3"
            width="25%"
            spacing="3px">
            <HStack width="100%" height="20%">
              <VStack
                className="truncate"
                width="40%"
                align="start"
                justify="start">
                <Text
                  fontSize={iMediumScreen ? "55%" : "80%"}
                  className="font-semibold">
                  Peso Total
                </Text>
              </VStack>
              <VStack width="60%" align="end" justify="end">
                <Input
                  isDisabled={!isActive}
                  fontSize={iMediumScreen ? "55%" : "80%"}
                  width="100%"
                  height="20%"
                  type="number"
                  min="1"
                  step="0.01"
                  onChange={handlepesototal}
                  value={isTable !== "Create" ? sharedState.pesototal : undefined}
                  backgroundColor="white"
                  border="1px"
                />
              </VStack>
            </HStack>
            <HStack width="100%" height="20%">
              <VStack
                className="truncate"
                width="40%"
                align="start"
                justify="start">
                <Text
                  fontSize={iMediumScreen ? "55%" : "80%"}
                  type="numeric"
                  className="font-semibold">
                  Bultos
                </Text>
              </VStack>
              <VStack width="60%" align="end" justify="end">
                <Input
                  isDisabled={!isActive}
                  fontSize={iMediumScreen ? "55%" : "80%"}
                  width="100%"
                  height="20%"
                  type="number"
                  min="1"
                  step="1"
                  onChange={handlebulto}
                  value={isTable !== "Create" ? sharedState.bultos : undefined}
                  backgroundColor="white"
                  border="1px"
                />
              </VStack>
            </HStack>
            <HStack width="100%" height="20%">
              <VStack
                className="truncate"
                width="40%"
                align="start"
                justify="start">
                <Text
                  fontSize={iMediumScreen ? "55%" : "80%"}
                  className="font-semibold">
                  No. Factura
                </Text>
              </VStack>
              <VStack width="60%" align="end" justify="end">
                <Input
                  isDisabled={!isActive}
                  fontSize={iMediumScreen ? "55%" : "80%"}
                  width="100%"
                  height="20%"
                  onChange={handleNoFactura}
                  value={isTable !== "Create" ? sharedState.nofactura : undefined}
                  backgroundColor="white"
                  border="1px"
                />
              </VStack>
            </HStack>
          </VStack>
        </HStack>
        <HStack
          className="[@media(max-width:1439px)]:pt-1.5 [@media(min-width:1440px)]:pt-0"
          height="7%"
          spacing={3}>
          <HStack padding="1" spacing={3} width="60%">
            <Text
              className="font-bold"
              fontSize={iMediumScreen ? "60%" : "90%"}>
              Proveedor
            </Text>
            <Text fontSize={iMediumScreen ? "60%" : "80%"}>
              {String(sharedState.proveedor).slice(0.25)}
            </Text>
          </HStack>

          <HStack width="40%" align="end" justify="end">
            <Text
              fontSize={iMediumScreen ? "60%" : "90%"}
              className="font-bold">
              Subtotal de la factura
            </Text>
            <HStack backgroundColor="#F1D803" paddingX={2} rounded="2xl">
              <Text fontSize={iMediumScreen ? "60%" : "90%"}>
                {formatMoney(parseFloat(sharedState.totalfactura))}
              </Text>
            </HStack>
          </HStack>
        </HStack>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Selecciona la Moneda de Facturación</ModalHeader>
            <ModalBody>
              <p className="mb-7">
                Porfavor seleccione la moneda en la que facturo:{" "}
              </p>

              <RadioGroup
                mb="10px"
                defaultValue="USD"
                colorScheme="yellow"
                onChange={setSelectedCurrency}
                value={selectedCurrency}>
                <Radio mr="10px" value="USD">
                  Dólares (USD)
                </Radio>
                <Radio value="COP">Pesos (COP)</Radio>
                <Radio ml="10px" value="EUR">
                  Euros (EUR)
                </Radio>
              </RadioGroup>
              <p className="font-bold">
                Moneda seleccionada:
                {selectedCurrency === "USD" ?
                  " Dólares (USD)"
                  : selectedCurrency === "EUR" ?
                    " Euros (EUR)"
                    : " Pesos (COP)"}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="teal"
                backgroundColor="#F1D803"
                textColor="black"
                onClick={handleAccept}>
                Aceptar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <div className=" h-[68%] w-full overflow-x-auto overflow-y-clip">
          <CustomHotTable
            hotTableRef={hotTableRef}
            data={data}
            columns={columns}
            subheadingValidity={subheadingValidity}
            setSubheadingValidity={setSubheadingValidity}
            orderNumber={orderNumber}
            position={position}
            records={records}
            materialResults={materialResults}
            selectedCurrency={selectedCurrency}
            realcurrency={realcurrency}
            sharedState={sharedState}
            isTable={isTable}
            invoi={invoi}
            isLoading2={isLoading2}
            getCounter={getCounter}
            updateGlobalCounter={updateGlobalCounter}
            checkSubheadingExists={checkSubheadingExists}
            selectByPurchaseOrder={selectByPurchaseOrder}
            selectSupplierData={selectSupplierData}
            calculateColumnSum={calculateColumnSum}
            updateSharedState={updateSharedState}
            handleAfterSelection={handleAfterSelection}
            handleCellDoubleClick={handleCellDoubleClick}
          />
        </div>
        {(isTable === "Create" || isActive === true) && (
          <Button
            mt={1}
            bgColor="#F1D803"
            colorScheme="steal"
            textColor="black"
            height="5%"
            onClick={isTable !== "Create" ? UpdateData : handleSubmit}>
            {isTable !== "Create" ? "Reenviar" : "Asociar"}
          </Button>
        )}
      </>
    </div>
  );
};
