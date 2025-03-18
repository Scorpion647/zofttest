'use client'
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery, Radio, RadioGroup, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, Alert, Switch, Tooltip, Box, VStack, HStack, Button, Text, Input, useDisclosure, Icon, Spinner, Grid, Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  Portal, } from "@chakra-ui/react";
import { SearchIcon, ArrowBackIcon, EditIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { getRecords, getSupplier, insertRecordInfo, getRecord, updateRecord, checkSubheadingExists, getInvo, getSuplierInvoice, getRecordInfo, getMaterial } from '@/app/_lib/database/service';
import debounce from "lodash/debounce";
import { deleteSupplierData, insertSupplierData, selectSingleSupplierData, selectSupplierData, selectSupplierDataByInvoiceID, updateSupplierData } from "../_lib/database/supplier_data";

import { getRole } from "../_lib/supabase/client";
import { userData } from "@/app/_lib/database/currentUser"
import { selectSingleSupplier } from "../_lib/database/suppliers";
import { selectSingleSupplierEmployee } from "../_lib/database/supplier_employee";
import { getData } from "../_lib/database/app_data";
import { selectBills, selectByPurchaseOrder, selectSingleBill } from "../_lib/database/base_bills";
import { deleteInvoiceDocs, insertInvoice, insertInvoiceDoc, selectInvoice_data, selectSingleInvoice, updateInvoice } from "../_lib/database/invoice_data";
import { match } from "assert";
import { updateMaterial, insertMaterial, selectMaterials } from "../_lib/database/materials";
import { GrDocumentPdf } from "react-icons/gr";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import useSWR from 'swr';




function formatMoney(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export const Associate_invoice = ({ setisTable, isTable, sharedState, updateSharedState, invoi }) => {
  const [Curren, setCurren] = useState(false)
  const [Table, setTable] = useState("Associate")
  const [isActive, setisActive] = useState(false)
  const [isButton, setButton] = useState(false)
  const [orderNumber, setOrderNumber] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const [hola, sethola] = useState(false);
  const hotTableRef = useRef(null);
  const [factunitprice, setfactunitprice] = useState(0);
  const [facttotalvalue, setfacttotalvalue] = useState(0);
  const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [iMediumScreen] = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
  const [iLargeScreen] = useMediaQuery("(min-width: 1024px)");
  const { isOpen: opening, onToggle, onClose: closer } = useDisclosure();

  const [position, setposition] = useState(0);
  const router = useRouter();
  const [lastClickTime, setLastClickTime] = useState(0);
  const [columnSum2, setColumnSum2] = useState(0);

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [copia, setcopia] = useState([])
  const debounceTimeoutRef4 = useRef(null);


  const [data, setData] = useState(Array(200).fill().map(() => Array(6).fill('')));

  const { isOpen, onOpen, onClose } = useDisclosure();









  const pruebas = async () => {
    let tfactura = 0;
    let Copia = [];
    let cantidad = 0;
    let trmcop = 0;
    let result = []; // Aquí se almacenará el arreglo final de filas para la tabla
    try {
      const hot = hotTableRef.current.hotInstance;
      if (!hot || hot.isDestroyed) return;
      setIsLoading2(true);
  
      const invoice = await selectSingleInvoice(invoi);
      // Manejo de estados inicial
      setisActive(invoice.state === "approved" ? false : (invoice.state === "pending" ? false : true));
      setButton(invoice.state === "approved" ? false : (invoice.state === "pending" ? true : false));
  
      // Obtén los datos una sola vez
      const Data = await getSuplierInvoice(1, 200, invoi);
      setcopia(Data);
  
      let total = 0;
      let bultos = 0;
      let purchase = "";
      let proveedor = "";
      let cont = 0;
      const changes = [];
  
      // Procesar las facturas en paralelo
      const billPromises = Data.map(async (datas) => {
        if (datas && datas.base_bill_id) {
          try {
            const bill = await selectSingleBill(datas.base_bill_id);
            // Procesar la primera factura y evitar llamadas repetitivas
            if (!purchase) {
              purchase = bill[0]?.purchase_order || "";
              const pro = await selectSingleSupplier(bill[0]?.supplier_id);
              setrealcurrency(bill[0]?.currency);
              updateSharedState(
                'TRMCOP',
                datas.billed_currency !== bill[0]?.currency
                  ? parseFloat((datas.billed_unit_price / bill[0]?.unit_price).toFixed(10))
                  : undefined
              );
              trmcop = datas.billed_currency !== bill[0]?.currency
                ? parseFloat((datas.billed_unit_price / bill[0]?.unit_price).toFixed(10))
                : undefined;
              const cachebills = await selectBills({ limit: 300, page: 1, equals: { purchase_order: purchase } });
              setshoworder(purchase);
              setOrderNumber(purchase);
              setInitialRecords(cachebills);
              // Actualizar la data mediante mutate
              mutate(cachebills, false);
              proveedor = pro?.name || "";
              updateSharedState('proveedor', proveedor);
  
              updateSharedState('TRM', (datas.billed_currency === "COP" ? false : true));
              setSelectedCurrency(datas.billed_currency);
            }
  
            // Actualización de campos
            updateSharedState('nofactura', datas.bill_number);
            total += datas.gross_weight || 0;
            bultos += datas.packages || 0;
  
            // Se guarda la información del registro: el primer cambio (columna 0, ítem) y el segundo (columna 2, cantidad)
            changes.push({
              row: cont,
              item: bill[0].item,
              quantity: datas.billed_quantity
            });
            cont++;
          } catch (err) {
            console.error('Error fetching bill for base_bill_id:', datas.base_bill_id, err);
          }
        }
      });
  
      await Promise.all(billPromises);
  
      cantidad = Math.ceil(cont / 10);
  
      // Agrupar y ordenar la información según el ítem (o según lo que necesites)
      const grouped = changes.sort((a, b) => {
        if (a.item < b.item) return -1;
        if (a.item > b.item) return 1;
        return 0;
      });
  
      // Crear un arreglo de filas combinando cada objeto en una única fila.
      // Se asume que la columna 0 es para el ítem, la columna 1 se deja vacía y la columna 2 es para la cantidad.
      result = grouped.map((entry) => {
        return [
          entry.item,    // Columna 0: el ítem
          "",            // Columna 1: vacío (puedes ajustar si necesitas otro dato)
          entry.quantity // Columna 2: la cantidad
        ];
      });
  
      // Rellenar con filas vacías hasta que haya 200 filas en total
      while (result.length < 200) {
        result.push(["", "", ""]);
      }
  
      // Actualizar la tabla de Handsontable de forma eficiente
      if (hot && !hot.isDestroyed) {
        hot.batch(() => {
          hot.loadData(result);
        });
        // Actualizar el estado que se utiliza en la propiedad data de la tabla para conservar la data
        setData(result);
        await new Promise((resolve) => {
          hot.addHookOnce('afterLoadData', () => {
            console.log("Datos cargados en la tabla.");
            resolve();
          });
        });
      } else {
        console.log("No hay cambios para aplicar o la instancia de Handsontable no está disponible.");
      }
  
      // Actualización intermedia de estados
      updateSharedState('pesototal', parseFloat(total.toFixed(2)));
      updateSharedState('bultos', parseFloat(bultos.toFixed(0)));
    } catch (error) {
      console.error('Error in pruebas function:', error);
    } finally {
      // Usar la data actual (result o state data) para calcular totales finales
      const currentData = result.length > 0 ? result : data;
      updateSharedState('TRMCOP', trmcop);
      const totalSum = currentData.reduce((sum, row) => {
        const unip = parseFloat(String(row[3]).replace(/[$,]/g, '')) || 0;
        const can = parseFloat(row[2]) || 0;
        return unip > 0 && can > 0 ? sum + (unip * can) : sum;
      }, 0);
      updateSharedState('totalfactura', formatMoney(totalSum.toFixed(2)));
    }
  };
  
  
  
  
  
  
  
















  useEffect(() => {
    const config = async () => {
      if (isTable === "Create") {
        updateSharedState('nofactura', "");
        updateSharedState('proveedor', "")
        updateSharedState('descripcion', "NaN")
        updateSharedState('cantidadoc', 0)
        updateSharedState('preciouni', 0);
        updateSharedState('pesopor', 0)
        updateSharedState('totalfactura', 0)
        updateSharedState('TRM', false)
        updateSharedState('bultos',);
        updateSharedState('pesototal',)
        updateSharedState('TRMCOP',)
        setisActive(true)
        setButton(false)
        onOpen()
      } else {
        updateSharedState('proveedor', "")
        updateSharedState('descripcion', "NaN")
        updateSharedState('cantidadoc', 0)
        updateSharedState('preciouni', 0);
        updateSharedState('pesopor', 0)
        updateSharedState('totalfactura', 0)
        updateSharedState('TRM', false)
        updateSharedState('pesototal', 0)
        updateSharedState('TRMCOP',)

        pruebas()



      }
    }
    config()
  }, [])











  function convertCommaToDot(input) {
    let str = input.toString().trim();


    str = str.replace(/\./g, ',');

    str = str.replace(/,/g, '.');
    return parseFloat(str);
  }


















  const updateAutoSequence = async (row, subheading) => {
    const hot = hotTableRef.current.hotInstance;
    const data = hot.getData();

    if (subheading) {
      // Agregar al conjunto solo si el subheading es válido
      setRowsWithAutoSequence((prevSet) => new Set(prevSet).add(row));
    } else {
      // Eliminar del conjunto si el subheading es inválido
      setRowsWithAutoSequence((prevSet) => {
        const newSet = new Set(prevSet);
        newSet.delete(row);
        return newSet;
      });
    }
  };









  const globalCounterRef = useRef({});


  function updateGlobalCounter(rowIndex, value) {
    if (value === '**********') {
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

        if (typeof valueStr === 'string') {
          valueStr = valueStr.replace(/,/g, '.');
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
      if (conditionValue !== 0 && conditionValue !== null && conditionValue != "") {
        const value = parseFloat(row[columnIndexToSum2]);
        return !isNaN(value) ? total + value : total;
      }
      return total;
    }, 0);
    updateSharedState('columnSum', sum);
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
        setSelectedCurrency("USD")
      } else {
        setSelectedCurrency("EUR")
      }
      updateSharedState('TRM', true)
    } else {
      setSelectedCurrency("COP")
      updateSharedState('TRM', false)
    }
    onClose();
  };

  const [realcurrency, setrealcurrency] = useState("")
  const [trmactive, settrmactive] = useState(false)



  const [initialRecords, setInitialRecords] = useState([]);
  const [materialResults, setMaterialResults] = useState([]);
  const [showorder,setshoworder] = useState("")
  const [edittable,setedittable] = useState(false)

  const hasFetchedMaterials = useRef(false);

  // SWR usa como key `purchaseOrderRecords-${orderNumber}` y el fetcher devuelve initialRecords
  const { data: records, error, mutate } = useSWR(
    orderNumber ? `purchaseOrderRecords-${orderNumber}` : null,
    () => Promise.resolve(initialRecords),
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    // Si no hay registros o ya se procesó, salimos
    if (!records || records.length === 0) {
      setMaterialResults([]);
      console.log("No hay registros, materialResults limpiado.");
      setedittable(false);
      return;
    }
    if (hasFetchedMaterials.current) return;

    hasFetchedMaterials.current = true; // Evitamos volver a ejecutar este bloque

    // Procesamos cada registro de forma secuencial para evitar saturar el sistema
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
            data: result || "", // Si existe, guarda el dato; de lo contrario, cadena vacía.
          });
        } catch (error) {
          results.push({ material_code: record.material_code, data: undefined });
        }
      }
      setMaterialResults(results);
      console.log("Resultados de Material:", results);
      setedittable(true);
    })();
  }, [records]);
  

  const handleOrderNumberChange = async (e) => {
    const order = e.target.value;
    setshoworder(order)
    hasFetchedMaterials.current = false;

    try {
      // Obtén los registros asociados al purchase_order
      const record = await selectBills({ limit: 300, page: 1, equals: { purchase_order: order } });
      console.log("Orden: ",order)
      console.log("Orden traida: ",record[0]?.purchase_order)
      if (record[0]?.purchase_order === order) {
        setOrderNumber(order);
        
        const supplier = await getSupplier(record[0].supplier_id);
        if (supplier && supplier.name) {
          console.log("Realcurrency: ",record[0].currency)
          setrealcurrency(record[0].currency);
        console.log("RealCurrency: ", record[0].currency);
          // Actualiza el estado local (opcional) y la caché de SWR
          setInitialRecords(record);
          // Usa la función mutate del hook sin key, para actualizar la data
          mutate(record, false);
          updateSharedState('proveedor', supplier.name);
        } else {
          updateSharedState('proveedor', "");
          setrealcurrency("");
        }
      }else{
        updateSharedState('proveedor', "");
      }
    } catch (error) {
      console.error("Error fetching records", error);
      updateSharedState('proveedor', "");
      
    }
  };



  const handlebulto = (e) => {
    updateSharedState('bultos', (e.target.value));
  };
  const handleTRMCOP = (e) => {
    updateSharedState('TRMCOP', (e.target.value));
  };
  const handlepesototal = (e) => {
    updateSharedState('pesototal', (e.target.value));
  };
  const handleTRM = (e) => {
    updateSharedState('valorTRM', (e.target.value));
  };
  const handleNoFactura = (e) => {
    updateSharedState('nofactura', (e.target.value));
  };
  const handleSwitchChange = (e) => {
    const currentValue = sharedState.TRM;

    updateSharedState('TRM', !currentValue);
    setSelectedCurrency(selectedCurrency === "USD" ? (!currentValue === true ? "USD" : "COP") : (selectedCurrency === "EUR" ? (!currentValue === true ? "EUR" : "COP") : (!currentValue === true ? "USD" : "COP")))
    console.log("Esto es despues del switch: ", selectedCurrency === "USD" ? (!currentValue === true ? "USD" : "COP") : (selectedCurrency === "EUR" ? (!currentValue === true ? "EUR" : "COP") : (!currentValue === true ? "USD" : "COP")))


  };
  const toggleActive = () => {
    setisActive(prevState => !prevState); // Cambia entre true y false
  };





  const debounceTimeoutRef = useRef(null);
  const debounceTimeoutRef1 = useRef(null);
  const debounceTimeoutRef2 = useRef(null);
  const [pruebass, setpruebass] = useState(0)



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

        if (showorder.trim() !== '') {
          setIsLoading(true);

          getRecords(1, 40000)
            .then((data) => {
              if (Array.isArray(data)) {
                const matchingRecords = data
                  .map(record => record.purchase_order)
                  .filter((value, index, self) =>
                    self.indexOf(value) === index && value.includes(showorder)
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
    if (!hotTableRef.current) return
    const hot = hotTableRef.current.hotInstance;
    const data = hot.getData();

    await sleep(1500)
    const changes = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const pos = row[0];

      if (!orderNumber || pos === null || pos === undefined || pos === "" || isNaN(pos)) {
        continue;
      }

      try {
        const [records, revi] = await Promise.all([getRecord(orderNumber, pos), getRecord(orderNumber, 1)]);

        if (records && !("message" in records)) {
          const hola = Number(records.item);
          const hola1 = Number(revi.item);

          if (row[0]) {
            if (hola === Number(row[0])) {
              const { material_code, unit_price, total_quantity, pending_quantity, approved_quantity } = records;

              if (parseFloat(approved_quantity) < parseFloat(total_quantity) || isLoading2) {
                const materialDetails = await selectMaterials({limit: 1, page: 1, equals: {material_code: material_code}});
                const subheading = materialDetails[0]?.subheading || "";


                changes.push([rowIndex, 1, material_code]);

                console.log(realcurrency)
                console.log(selectedCurrency)
                if (((realcurrency === "USD" || realcurrency === "EUR") && selectedCurrency === "COP") || ((selectedCurrency === "USD" && realcurrency === "EUR") || (selectedCurrency === "EUR" && realcurrency === "USD"))) {
                  console.log("1")
                  changes.push([rowIndex, 3, String(formatMoney((unit_price / 100) * sharedState.TRMCOP))]);
                  changes.push([rowIndex, 4, String((formatMoney((((unit_price / 100) * sharedState.TRMCOP * data[rowIndex][2])))))]);
                } else if (realcurrency === "COP" && selectedCurrency !== "COP") {
                  console.log("2")
                  changes.push([rowIndex, 3, String(formatMoney((unit_price / 100) * sharedState.TRMCOP))]);
                  changes.push([rowIndex, 4, String((formatMoney((((unit_price / 100) * sharedState.TRMCOP * data[rowIndex][2])))))]);
                } else if (realcurrency === selectedCurrency) {
                  console.log("2")
                  changes.push([rowIndex, 3, String(formatMoney(unit_price / 100))]);
                  changes.push([rowIndex, 4, String(formatMoney((unit_price / 100) * data[rowIndex][2]))]);
                } else {
                  console.log("4")
                  changes.push([rowIndex, 3, ""]);
                  changes.push([rowIndex, 4, ""]);
                }


                /*if (sharedState.TRM) {

                    changes.push([rowIndex, 3, String(formatMoney(unit_price/100))]);
                    changes.push([rowIndex, 4, String(formatMoney((unit_price/100)* data[rowIndex][2]))]);
                } else if (!sharedState.TRM && parseFloat(sharedState.TRMCOP) !== 0) {

                  changes.push([rowIndex, 3, String(formatMoney((unit_price/100) * sharedState.TRMCOP))]);
                  changes.push([rowIndex, 4, String((formatMoney((((unit_price/100) * sharedState.TRMCOP* data[rowIndex][2])))))]);
                } else {

                  changes.push([rowIndex, 3, ""]);
                  changes.push([rowIndex, 4, ""]);
                }*/

                if (subheading) {
                  changes.push([rowIndex, 5, String("**********")]);
                }else{
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

    if(isTable !== "Create" && isLoading2 === true){
      setIsLoading2(false);
    }
  }, 300);









































  const UpdateData = async () => {
    const userConfirmed = window.confirm('¿Estás seguro de que deseas realizar la siguiente asociación de factura?');
    if (!userConfirmed) return;
  
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return console.error('No hay instancia de Handsontable disponible.');
  
    // Validaciones necesarias
    if (
      !sharedState.pesototal ||
      !sharedState.bultos ||
      !sharedState.nofactura ||
      (realcurrency !== selectedCurrency && (!sharedState.TRMCOP || sharedState.TRMCOP <= 0))
    ) {
      window.alert('Error, debe llenar todos los campos requeridos.');
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
  
    // Bandera para actualizar el documento solo una vez
    let invoiceDocUpdated = false;
  
    for (const [index, row] of tableData.entries()) {
      const isEmptyRow = row.every(cell => cell === null || cell === '' || cell === undefined);
      if (isEmptyRow) continue;
  
      const [record_position, material_code, billed_quantity, bill_number, , subheading] = row;
  
      if (record_position && material_code && bill_number && billed_quantity && subheading) {
        const prue = await checkSubheadingExists(subheading);
        if (String(subheading) !== "**********" && (String(subheading).length !== 10 || prue !== true)) {
          window.alert('Error, una subpartida ingresada no es valida, por favor revise y vuelva a intentar');
          return;
        }
  
        hasCompleteRow = true;
        const pos = hotInstance.getDataAtCell(index, 0);
  
        const matchedRecord = await selectBills({ limit: 1, page: 1, equals: { purchase_order: orderNumber, item: pos } });
        if (!matchedRecord[0]?.base_bill_id) {
          console.error(`No se encontró el registro para la posición ${pos}`);
          continue;
        }
  
        if (currency === "") {
          currency = matchedRecord[0]?.currency;
        }
  
        unit = matchedRecord[0]?.unit_price / 100;
        total = (matchedRecord[0]?.unit_price / 100) * parseFloat(hotInstance.getDataAtCell(index, 2));
  
        const { base_bill_id, supplier_id } = matchedRecord[0];
  
        // Actualizar la factura (documento) solo una vez, fuera de la repetición
        if (selectedFile !== null && !invoiceDocUpdated) {
          try {
            const invoices = await selectInvoice_data({ limit: 1, page: 1, equals: { invoice_id: id } });
            console.log("HOLA1");
            const deletedoc = await deleteInvoiceDocs(invoices[0]?.invoice_docs[0], supplier_id);
            console.log("HOLA2");
            const doc = await insertInvoiceDoc(supplier_id, id, selectedFile);
            console.log("HOLA3");
            invoiceDocUpdated = true;
          } catch (error) {
            console.error('Error completo:', error);
            if (error.message) console.error('Mensaje de error:', error.message);
            if (error.details) console.error('Detalles del error:', error.details);
          }
        }
  
        // Crear o actualizar materiales si se encuentra una subpartida
        if (subheading !== "**********") {
          const valida = await selectMaterials({ limit: 1, page: 1, equals: { material_code } });
          if (valida[0]?.material_code === material_code) {
            await updateMaterial({ material_code, subheading });
          } else {
            await insertMaterial({ material_code, subheading });
          }
        }
  
        const factunitprice =
          currency === selectedCurrency
            ? unit
            : parseFloat(String(hotInstance.getDataAtCell(index, 3)).replace(/[$,]/g, ''));
        const totalprice =
          currency === selectedCurrency
            ? total
            : (factunitprice * parseFloat(hotInstance.getDataAtCell(index, 2))).toFixed(2);
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
            selectedCurrency === "USD"
              ? await getExchangeRate("trm_usd")
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
  
          const objeto = copia.find(objeto => objeto.base_bill_id === base_bill_id);
  
          // Filtrar eliminaciones
          const nuevoArray = copiaa.filter(objeto => objeto.base_bill_id !== base_bill_id);
          if (nuevoArray.length !== copiaa.length) {
            copiaa = nuevoArray;
          }
  
          // Construir el registro
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
            modified_at: new Date().toISOString()
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
              modified_at: new Date().toISOString()
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
      alert(`ERROR: revise las siguientes filas: ${incompleteRows.join(', ')}`);
      return;
    }
  
    if (!hasCompleteRow) {
      alert('Debe haber al menos una fila completa.');
      return;
    }
  
    if (duplicatePositions.size > 0) {
      const duplicatesMsg = Array.from(duplicatePositions.entries())
        .map(([pos, indices]) => `Posición ${pos}: Fila(s) ${indices.join(', ')}`)
        .join('\n');
      alert(`Hay posiciones duplicadas:\n${duplicatesMsg}`);
      return;
    }

    if (copiaa.length > 0) {
      for (const objeto of copiaa) {
        if (Object.keys(objeto).length > 0) {
          try {
            console.log("eliminamos uno sesupone, este es su supplier_data: ", objeto.supplier_data_id)
            await deleteSupplierData(objeto.supplier_data_id);
          } catch (error) {
            console.error('Error en la eliminación:', error);
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
      await updateInvoice({ invoice_id: id, state: "pending", feedback: "" , updated_at: now.toISOString().replace('T', ' ').replace('Z', '+00')});
      alert('Registros enviados correctamente.');
      setisTable(false);
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al enviar los registros.');
    }
  };
  












  const columns = [
    { data: 0, readOnly: (!isActive ? true : (edittable === true ? false : true)), title: 'Posicion' },
    { data: 1, readOnly: true, title: 'Codigo de Material' },
    { data: 2, readOnly: (!isActive ? true : (edittable === true ? false : true)), title: 'Cantidad' },
    { data: 3, readOnly: true, title: 'Precio Unitario' },
    { data: 4, readOnly: true, title: 'Valor Neto' },
    { data: 5, readOnly: (!isActive ? true : (edittable === true ? false : true)), title: 'Subpartida ' },
  ];

  const handleCellDoubleClick = async (event, coords, TD) => {
    const currentTime = new Date().getTime();
    const cellValue = data[coords.row]?.[coords.col]?.toString().trim();
    const pos = data[coords.row]?.[0]?.toString().trim();
    const quanti = parseInt(data[coords.row]?.[2]?.toString().trim(), 10);

    if (!orderNumber || !pos){
      updateSharedState('descripcion', "NaN");
      updateSharedState('cantidadoc', 0);
      updateSharedState('preciouni', 0);
      updateSharedState('facttotal', 0);
      updateSharedState('pesopor', 0);
      return
    }
    if (orderNumber === "" || pos === ""){
      updateSharedState('descripcion', "NaN");
      updateSharedState('cantidadoc', 0);
      updateSharedState('preciouni', 0);
      updateSharedState('facttotal', 0);
      updateSharedState('pesopor', 0);
      return
    }

    if (isNaN(orderNumber) || isNaN(pos)) {
      updateSharedState('descripcion', "NaN");
      updateSharedState('cantidadoc', 0);
      updateSharedState('preciouni', 0);
      updateSharedState('facttotal', 0);
      updateSharedState('pesopor', 0);
      return; // Salir de la función si alguno no es un número
    }

    
    const record = records.find(r => Number(r.item) === Number(pos) && (r.purchase_order) === orderNumber);

    



    const matchedRecord = record

    if ((record.item !== 0 && record.item !== "" && record.item !== null && record.item !== undefined && record.item !== NaN) && (pos !== 0 && pos !== "" && pos !== undefined && pos !== NaN && pos !== null)) {
      const { unit_price, material_code, currency, description, supplier_id, total_quantity, approved_quantity, pending_quantity } = matchedRecord;
      if (parseFloat(approved_quantity) < parseFloat(total_quantity) || (isTable !== "Create" && !isActive)) {


        let cantidad = 0
        updateSharedState('descripcion', description);
        let prueba = 0
        if(isTable !== "Create"){
          const supplierdata = await selectSupplierData({page: 1, limit: 1, equals: { invoice_id: invoi, base_bill_id: matchedRecord.base_bill_id}}) 
          cantidad = supplierdata[0]?.billed_quantity || 0
          prueba = supplierdata[0]?.billed_quantity
        }


        if(isTable === "Create" || (prueba !== 0 && isTable === "Create" || cantidad === 0 )){
          updateSharedState('cantidadoc', (total_quantity - approved_quantity - pending_quantity));
          updateSharedState('totalOC', (total_quantity));
          updateSharedState('OCusada', (approved_quantity + pending_quantity));
        }else{

          
          const supplierdata = await selectSupplierData({page: 1, limit: 1, equals: { invoice_id: invoi, base_bill_id: matchedRecord.base_bill_id}}) 
          updateSharedState('cantidadoc', ((total_quantity - (approved_quantity + pending_quantity))  + supplierdata[0]?.billed_quantity));
          updateSharedState('totalOC', (total_quantity));
          updateSharedState('OCusada', ((approved_quantity + pending_quantity ) - supplierdata[0]?.billed_quantity));
        }
        if (realcurrency === "COP") {
          let valor = await getExchangeRate("trm_usd")
          updateSharedState('preciouni', (unit_price / valor));
        } else if (realcurrency === "EUR") {
          let valor = await getExchangeRate("trm_eur")
          updateSharedState('preciouni', (unit_price * valor));
        } else {
          updateSharedState('preciouni', unit_price);
        }
        updateSharedState('moneda', currency);
        let factorPrice = 0

        if (selectedCurrency === "COP" && realcurrency !== "COP") {
          factorPrice = unit_price * sharedState.valorTRM
        } else if (selectedCurrency !== "COP" && (realcurrency !== selectedCurrency)) {
          factorPrice = unit_price * sharedState.valorTRM
        } else {
          factorPrice = unit_price
        }

        const totalPrice = factorPrice * quanti;

        updateSharedState('factunit', factorPrice);
        updateSharedState('facttotal', totalPrice || 0);

        const columnSum = sharedState.columnSum || 1;
        const percentage = ((data[coords.row]?.[2] || 0) / columnSum) * 100;

        updateSharedState('cantidadespor', percentage.toFixed(2));

        const pesoTotal = sharedState.pesototal || 0;
        const pesoPor = (percentage * pesoTotal / 100).toFixed(2);
        updateSharedState('pesopor', isNaN(pesoPor) ? 0 : pesoPor);

        const factor = (percentage * pesoTotal / 100 / (data[coords.row]?.[2] || 1)).toFixed(8);
        updateSharedState('factor', factor);

        const bulto = (percentage * (sharedState.bultos || 0) / 100).toFixed(3);
        updateSharedState('bulto', bulto);
      } else {
        updateSharedState('descripcion', "NaN");
        updateSharedState('cantidadoc', 0);
        updateSharedState('preciouni', 0);
        updateSharedState('facttotal', 0);
        updateSharedState('pesopor', 0);
      }
    } else {
      updateSharedState('descripcion', "NaN");
      updateSharedState('cantidadoc', 0);
      updateSharedState('preciouni', 0);
      updateSharedState('facttotal', 0);
      updateSharedState('pesopor', 0);
    }

    const totalSum = data.reduce((sum, row) => {
      const unip = parseFloat(String(row[3]).replace(/[$,]/g, '')) || 0;
      const can = parseFloat(row[2]) || 0;
      return unip > 0 && can > 0 ? sum + (unip * can) : sum;
    }, 0);

    updateSharedState('totalfactura', formatMoney(totalSum.toFixed(2)));

    updateSharedState('SelectedCellValue', cellValue);
    setLastClickTime(currentTime);

  };

  useEffect(() => {
    if (debounceTimeoutRef2.current) {
      clearTimeout(debounceTimeoutRef2.current);
    }

    debounceTimeoutRef2.current = setTimeout(() => {
      const totalSum = data.reduce((sum, row) => {
        const unip = parseFloat(String(row[3]).replace(/[$,]/g, '')) || 0;
        const can = parseFloat(row[2]) || 0;
        return unip > 0 && can > 0 ? sum + (unip * can) : sum;
      }, 0);
      updateSharedState('totalfactura', formatMoney(totalSum.toFixed(2)));
    }, 2000);

    return () => {
      if (debounceTimeoutRef2.current) {
        clearTimeout(debounceTimeoutRef2.current);
      }
    };

  }, [sharedState.TRM, sharedState.TRMCOP])

  useEffect(() => {
    if (sharedState.TRM) {
      updateSharedState('TRMCOP',);
    }
  }, [sharedState.TRM])



  const handleAfterSelection = (row, column, row2, column2) => {
    const coords = { row, col: column };
    handleCellDoubleClick(null, coords);
  };



  const [Invoice, setInvoice] = useState()


  async function getExchangeRate(currency) {
    try {
      const data = await getData(currency);
      if (data[0].value !== null && data[0].value !== undefined) {
        return data[0].value.toString();
      }
    } catch {

    }
    return "0";
  }



  const handleSubmit = async () => {

    const userConfirmed = window.confirm('Estimado usuario, compare que el subtotal de su factura concuerde con el subtotal registrado en el sistema.\n \n ¿Estás seguro de que deseas realizar la siguiente asociación de factura?');

    if (!userConfirmed) {
      return;
    }

    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) {
      console.error('Handsontable instance has been destruido o no está disponible.');
      return;
    }

    if (!sharedState.pesototal || !sharedState.bultos || !sharedState.nofactura || (realcurrency !== selectedCurrency && (!sharedState.TRMCOP || sharedState.TRMCOP <= 0))) {
      window.alert('Error, debe llenar todos los campos requeridos.');
      return;
    }

    setIsLoading2(true)
    const tableData = hotInstance.getData();
    const records = [];
    const update = [];
    const seenPositions = new Set();
    const duplicatePositions = new Map();
    const incompleteRows = [];
    let id;
    let suname = "";
    let email = "";
    let hasCompleteRow = false;
    let subheading = []
    let currency = ""
    let total = 0
    let unit = 0
    let fileList = {}
    const updatematerials = []
    const insertmaterials = []

    for (const [index, row] of tableData.entries()) {
      const isEmptyRow = row.every(cell => cell === null || cell === '' || cell === undefined);
      if (isEmptyRow) continue;

      const [record_position, material_code, billed_quantity, bill_number, , subheading] = row;

      if (record_position && material_code && bill_number && billed_quantity && subheading) {
        const prue = await checkSubheadingExists(subheading);
        if (String(subheading) !== "**********" && (String(subheading).length !== 10 || prue !== true)) {
          setIsLoading2(false)
          window.alert('Error, una subpartida ingresada no es valida, por favor revise y vuelva a intentar');
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
          currency = matchedRecord.currency
        }

        unit = matchedRecord.unit_price / 100
        total = (matchedRecord.unit_price / 100) * parseFloat(hotInstance.getDataAtCell(index, 2))

        const { base_bill_id, unit_price, material_code, total_quantity, supplier_id, } = matchedRecord;


        if (id === undefined || id === null) {
          const role = await getRole()
          const user = await userData()
          email = user.data.user.email
          if(selectedFile === null && role !== "administrator"){
            window.alert('Factura no subida, Introduzca su factura atravez de opciones de factura');
            setIsLoading2(false)
            return
          }
          const sup = await selectSingleSupplier(supplier_id)
          suname = sup.name
          
          
      
          if(selectedFile !== null){
            try{
              const newInvoice = await insertInvoice({ supplier_id: supplier_id, state: "pending"},selectedFile);
            console.log("se creooooo: ", newInvoice.invoiceData[0].invoice_id)
            id = newInvoice.invoiceData[0].invoice_id;
            }catch (error) {
              console.error('Error completo:', error);
              if (error.message) {
                console.error('Mensaje de error:', error.message);
              }
              if (error.details) {
                console.error('Detalles del error:', error.details);
              }
            }
          }else{
            const newInvoice = await insertInvoice({ supplier_id: supplier_id, state: "pending"});
            console.log("se creooooo: ", newInvoice.invoiceData[0].invoice_id)
            id = newInvoice.invoiceData[0].invoice_id;
          }
        }

        if (subheading !== "**********") {


            const exists = updatematerials.some(item => item.target === material_code);
            const exists2 = insertmaterials.some(item => item.material_code === material_code);
          if (!exists && !exists2) {
            const valida = await getMaterial(material_code);
            if (valida?.material_code=== material_code) {

              const material = {
                target: material_code,
                data: {
                  subheading: subheading
                }
              }
              updatematerials.push(material)


            } else {
              const material = {
                material_code: material_code,
                subheading: subheading
              }
              insertmaterials.push(material)
            }
          }
          
        }

        const factunitprice = (currency === selectedCurrency ? unit : parseFloat(String(hotInstance.getDataAtCell(index, 3)).replace(/[$,]/g, '')));

        const totalprice = (currency === selectedCurrency ? total : (factunitprice * parseFloat(hotInstance.getDataAtCell(index, 2))).toFixed(2));

        const gross = ((((hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) * sharedState.pesototal))).toFixed(9);
        const packag = ((((hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) * sharedState.bultos))).toFixed(9);
        let conver = 0
        let trm = 0

        if (sharedState.TRM) {
          trm = selectedCurrency === "USD" ? await getExchangeRate("trm_usd") : await getExchangeRate("trm_eur");
          conver = selectedCurrency === "USD" ? "USD" : "EUR";
        } else {
          trm = await getExchangeRate("trm_usd")
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
            invoice_id: id
          };


          records.push(record);

          const purchase_order = orderNumber;
          const item = pos;
          const new_data = { pendong_quantity: total_quantity - billed_quantity };

          update.push({ purchase_order, item, new_data });
        }
      } else {
        incompleteRows.push(index + 1);
      }
    }

    if (incompleteRows.length > 0) {
      setIsLoading2(false)
      alert(`ERROR: revise las siguientes filas: ${incompleteRows.join(', ')}`);
      return;
    }

    if (!hasCompleteRow) {
      setIsLoading2(false)
      alert('Debe haber al menos una fila completa.');
      return;
    }

    if (duplicatePositions.size > 0) {
      setIsLoading2(false)
      const duplicatesMsg = Array.from(duplicatePositions.entries())
        .map(([pos, indices]) => `Posición ${pos}: Fila(s) ${indices.join(', ')}`)
        .join('\n');
      alert(`Hay posiciones duplicadas:\n${duplicatesMsg}`);
      return;
    }

    try {
      await updateMaterial(updatematerials)
      await insertMaterial(insertmaterials)
      await insertSupplierData(records);
      const date = transformDateTime(new Date())
      sendEmail(id)
      setIsLoading2(false)
      alert('Registros enviados correctamente.');
      setisTable(false);

    } catch (error) {
      console.error('Error completo:', error);
      if (error.message) {
        console.error('Mensaje de error:', error.message);
      }
      if (error.details) {
        console.error('Detalles del error:', error.details);
      }
      alert('Error al enviar los registros.  ');

      setIsLoading2(false)
    }

  };

  function transformDateTime(inputDate) {

    const date = new Date(inputDate);


    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');


    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';


    hours = hours % 12;
    hours = hours ? hours : 12;


    const formattedMinutes = minutes < 10 ? '00' : minutes;


    const formattedDate = `${year}-${month}-${day} ${hours}:${formattedMinutes} ${ampm}`;

    return formattedDate;
  }





  const sendEmail = async (invoice) => {
    const data = {
      invoice_id: invoice,
      type: "Ingreso",
      header: "Tu solicitud ha sido recibida para revisión",
      subject: ("Ingreso de solicitud: " + invoice)
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
      console.error(result.error)
    }

  };






  const [subheadingValidity, setSubheadingValidity] = useState(new Map());

  const [rowsWithAutoSequence, setRowsWithAutoSequence] = useState(new Set());

  const [isUploaded, setIsUploaded] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      // event.target.files ya es un FileList, se lo pasamos directamente
      console.log("Se guardo algo")
      console.log("Primer Estado: ", selectedFile)
      setSelectedFile(event.target.files);
      console.log("Segundo Estado: ", selectedFile)
      setIsUploaded(true);
    } else {
      alert("Por favor, selecciona un archivo PDF.");
      setSelectedFile(null);
      setIsUploaded(false);
    }
  };



  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }




  return (
    <div className={`relative p-4 bg-gradient-to-tr from-gray-200 to-gray-300 border h-full border-gray-300 text-center rounded-3xl shadow-md flex flex-col`}>
      {isLoading2 && (
        <Box bg="white" className=" left-0 top-0 absolute h-full w-full  z-50" display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" />
          <Text ml={4}>Obteniendo Base de datos...</Text>
        </Box>
      )}


      <>
        <HStack position="relative" width="100%" height="20%" >

          <VStack width="25%">
            <HStack width="100%" height="20px" textAlign="start" align="start" justify="start">
              <Button onClick={() => setisTable(false)} width="30%" height="100%" colorScheme='teal' backgroundColor='#F1D803'>
                <ArrowBackIcon w={3} h={3} color='black' />
              </Button>
              {(isButton && !isActive) && (
                <Tooltip label="Habilitar Edicion" fontSize="md">
                  <Button onClick={toggleActive} width="30%" height="100%" colorScheme='teal' backgroundColor='#F1D803'>
                    <Icon as={EditIcon} w={3} h={3} color="black" />
                  </Button>
                </Tooltip>
              )}

            </HStack>

            <HStack width="100%" align="start" justify="start">
              <Input
                border='1px'
                backgroundColor='white'
                isDisabled={isTable !== "Create"}
                type="text"
                value={showorder}
                onChange={handleOrderNumberChange}
                placeholder="Orden de Compra"
              />
              <Tooltip
                label={
                  suggestions.length > 0
                    ? suggestions.join(', ') + (remainingCount > 0 ? ` y ${remainingCount} más` : '')
                    : "No hay coincidencias"
                }
                isOpen={isHovered && suggestions.length > 0}
                placement="bottom"
                hasArrow
                bg="gray.300"
                color="black"
                isDisabled={isLoading}
              >
                <Button ref={buttonRef} isLoading={isLoading || (!isLoading && !edittable && sharedState.proveedor !== "")} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} colorScheme='teal' backgroundColor='#F1D803'>
                  <SearchIcon w={5} h={5} color='black' />
                </Button>
              </Tooltip>
            </HStack>
            <HStack width="100%" align="start" justify="start">
            <Popover placement="bottom-start">
      <PopoverTrigger align="start" justify="start">
        <Button isDisabled={!isActive} colorScheme='teal'  h="5" bgColor="#F1D803">
          <Text textColor="black" fontSize="60%">Opciones</Text>
        </Button>
      </PopoverTrigger>

      <PopoverContent w="auto" maxW="250px" p={2} boxShadow="lg" borderRadius="md">
        <PopoverCloseButton />
        <PopoverHeader fontWeight="bold">Opciones de Factura</PopoverHeader>
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
              <Switch sx={{
    "&[data-checked] .chakra-switch__track": {
      bg: "#F1D803", // Color de fondo cuando está encendido
    },
  }} isDisabled={!isActive} isChecked={sharedState.TRM} onChange={handleSwitchChange} />
              <Text className="font-semibold" fontSize="70%">
                {selectedCurrency === "USD" ? "USD" : selectedCurrency === "EUR" ? "EUR" : "USD"}
              </Text>
            </HStack>
            {realcurrency !== "" && (
            <Tooltip
              label={
                "Factura registrada en: " +
                (realcurrency === "USD" ? "Dólares" : realcurrency === "EUR" ? "Euros" : "Pesos Colombianos")
              }
            >
              <InfoOutlineIcon w={3} h={3} color="black" />
            </Tooltip>
          )}
          </HStack>

          

          <HStack>
            <Text className="font-bold" fontSize="80%">Subir Factura: </Text>
            <HStack justify="center" alignItems="center" spacing={3}>
  {/* Subir PDF */}
  <Tooltip label="Subir archivo PDF">
    <label className="cursor-pointer flex items-center">
      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
      <Icon as={GrDocumentPdf} w={6} h={6} className="bg-[#F1D803] p-1 rounded" />
    </label>
  </Tooltip>

  {/* Estado de carga del archivo */}
  {isUploaded ? (
    <CheckIcon color="green.500" w={4} h={4} />
  ) : (
    <CloseIcon color="red.500" w={4} h={4} />
  )}
</HStack>
          </HStack>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>

            </HStack>
          </VStack>
          <HStack width="2.5%">

          </HStack>
          <VStack width="40%" spacing={0}>
            <HStack className=" bg-white rounded-2xl" padding="3" position="relative" width="100%" spacing={0}>
              <VStack spacing={0} align="start" justify="start" width="30%" >
                <Text h="20%" className=" font-semibold" fontSize={iMediumScreen ? "60%" : "70%"}>Descripcion:</Text>
                <Text h="20%" className=" font-semibold" fontSize={iMediumScreen ? "60%" : "70%"}>Cantidad OC:</Text>
                <Text h="20%" className=" font-semibold" fontSize={iMediumScreen ? "60%" : "70%"}>Valor en Dolares</Text>

              </VStack>
              <VStack spacing={0} align="end" justify="end" width="70%"  >
                <Text h="20%"  className=" truncate overflow-ellipsis overflow-hidden w-full justify-end text-end"  fontSize={iMediumScreen ? "60%" : "70%"}>{sharedState.descripcion}</Text>
                <HStack>
                {((sharedState.cantidadoc > 0) || (sharedState.OCusada === sharedState.totalOC)) && (
                  <Popover placement="top">
                  <PopoverTrigger>
                  <InfoOutlineIcon w={3} h={3} color="orange" cursor="pointer" />
                  </PopoverTrigger>
                  <Portal>
                  <PopoverContent  border="1px" borderColor="black" className="  items-center " >
                    
                    <HStack spacing={3}>
                      <VStack spacing={0}>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"} className=" font-bold">OC total</Text>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"}>{sharedState.totalOC}</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"}  visibility="hidden">a</Text>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"} className=" font-bold">=</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"} className=" font-bold" >OC usada</Text>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"}>{sharedState.OCusada}</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"}  visibility="hidden">a</Text>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"} className=" font-bold">+</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"}  className=" font-bold" >OC disponible</Text>
                        <Text fontSize={iMediumScreen ? "60%" : "70%"}>{sharedState.cantidadoc}</Text>
                      </VStack>
                    </HStack>
                  </PopoverContent>
                  </Portal>
                </Popover>
                )}
                <Text h="20%"  className=" truncate" fontSize={iMediumScreen ? "60%" : "70%"}>{sharedState.cantidadoc}</Text>
                </HStack>
                <Text h="20%"  className=" truncate " fontSize={iMediumScreen ? "60%" : "70%"}>{formatMoney(parseFloat(sharedState.preciouni / 100))}</Text>


              </VStack>
            </HStack>
            <VStack position="relative" spacing={0}>

              {(selectedCurrency.trim().toLowerCase() !== realcurrency.trim().toLowerCase() && sharedState.proveedor !== "") && (
                <HStack ml={iMediumScreen ? 40 : 20} top={2} height="30px" width="300px" position="absolute">
                  <Text fontSize={iMediumScreen ? "50%" : "70%"}>TRM Factura</Text>
                  <Tooltip placement="top" label="Introduzca la trm con la que facturo">
                    <Input fontSize={iMediumScreen ? "70%" : "90%"} onClick={() => updateSharedState("TRMCOP",)} className=" placeholder:text-center" placeholder={realcurrency + " --> " + selectedCurrency} isDisabled={!isActive} type="number" min="1" step="0.0000000001" value={(isTable !== "Create") ? sharedState.TRMCOP : undefined} onBlur={handleTRMCOP} h="25px" width={iMediumScreen ? "40%" : "190px"} bg="white"></Input>
                  </Tooltip>
                  <Tooltip fontSize="xs" label={realcurrency !== "" ? "Factura registrada en " + (realcurrency === "USD" ? "Dolares" : (realcurrency === "EUR" ? "Euros" : "Pesos Colombianos")) + " y se facturara en " + (selectedCurrency === "USD" ? "Dolares" : (selectedCurrency === "EUR" ? "Euros" : "Pesos Colombianos")) : ""}>
                    <InfoOutlineIcon w={3} h={3} color="black" />
                  </Tooltip>
                </HStack>
              )}
            </VStack>
          </VStack>
          <HStack width="2.5%">

          </HStack>
          <VStack className=" bg-white rounded-2xl" padding="3" width="25%" spacing="3px" >


            <HStack width="100%" height="20%" >
              <VStack  className=" truncate"  width="40%" align="start" justify="start"><Text fontSize={iMediumScreen ? "55%" : "80%"} className=" font-semibold">Peso Total</Text></VStack>
              <VStack width="60%" align="end" justify="end"><Input isDisabled={!isActive} fontSize={iMediumScreen ? "55%" : "80%"} width="100%" height="20%" type="number" min="1" step="0.01" onChange={handlepesototal} value={(isTable !== "Create") ? sharedState.pesototal : undefined} backgroundColor='white' border='1px' /></VStack>

            </HStack>
            <HStack width="100%"  height="20%" >
              <VStack  className=" truncate"  width="40%" align="start" justify="start"><Text fontSize={iMediumScreen ? "55%" : "80%"} type="numeric" className=" font-semibold">Bultos</Text></VStack>
              <VStack width="60%" align="end" justify="end"><Input isDisabled={!isActive} fontSize={iMediumScreen ? "55%" : "80%"} width="100%" height="20%" type="number" min="1" step="1" onChange={handlebulto} value={(isTable !== "Create") ? sharedState.bultos : undefined} backgroundColor='white' border='1px' /></VStack>
            </HStack>
            <HStack width="100%"  height="20%" >
              <VStack className=" truncate"  width="40%" align="start" justify="start"><Text fontSize={iMediumScreen ? "55%" : "80%"} className=" font-semibold">No. Factura</Text></VStack>
              <VStack width="60%" align="end" justify="end"><Input isDisabled={!isActive} fontSize={iMediumScreen ? "55%" : "80%"} width="100%" height="20%" onChange={handleNoFactura} value={(isTable !== "Create") ? sharedState.nofactura : undefined} backgroundColor='white' border='1px' /></VStack>
            </HStack>



          </VStack>
        </HStack>
        <HStack height="7%" spacing={3}>
          <HStack padding="1" spacing={3} width="60%"><Text className=" font-bold  " fontSize={iMediumScreen ? "60%" : "90%"}>Proveedor</Text><Text fontSize={iMediumScreen ? "60%" : "80%"}>{String(sharedState.proveedor).slice(0.25)}</Text>
          </HStack>

          <HStack width="40%" align="end" justify="end">
            <Text fontSize={iMediumScreen ? "60%" : "90%"} className=" font-bold">Subtotal de la factura</Text>
            <Text fontSize={iMediumScreen ? "60%" : "90%"}>{formatMoney(parseFloat(sharedState.totalfactura))}</Text>
          </HStack>
        </HStack>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Selecciona la Moneda de Facturación</ModalHeader>
            <ModalBody>
              <p className=" mb-7">Porfavor seleccione la moneda en la que facturo: </p>

              <RadioGroup mb="10px" defaultValue="USD" colorScheme="yellow" onChange={setSelectedCurrency} value={selectedCurrency}>
                <Radio mr="10px" value="USD">Dólares (USD)</Radio>
                <Radio value="COP">Pesos (COP)</Radio>
                <Radio ml="10px" value="EUR">Euros (EUR)</Radio>
              </RadioGroup>
              <p className="font-bold">
                Moneda seleccionada:
                {selectedCurrency === 'USD'
                  ? ' Dólares (USD)'
                  : selectedCurrency === 'EUR'
                    ? ' Euros (EUR)'
                    : ' Pesos (COP)'}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme='teal' backgroundColor='#F1D803' textColor="black" onClick={handleAccept}>Aceptar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Box height="68%" width="100%" overflow="auto" >
          <HotTable
            ref={hotTableRef}
            className="relative z-0"
            data={data}
            colWidths={[50, 150, 50, 110, 110, 100]}

            licenseKey="non-commercial-and-evaluation"
            columns={columns}
            stretchH='all'
            manualColumnResize={true}
            rowHeaders={true}
            manualRowResize={true}
            hiddenColumns={false}
            afterSelection={handleAfterSelection}
            afterOnCellMouseDown={handleCellDoubleClick}
            copyPaste={true}
            outsideClickDeselects={false}


            beforeChange={(changes, source) => {
              const hot = hotTableRef.current.hotInstance;

              if (changes) {
                hot.batch(() => {
                  for (const change of changes) {
                    const [row, col, oldValue, newValue] = change;

                    calculateColumnSum();

                    if (col === 3) {
                      /*if (Array.isArray(change) && change.length > 3) {
                        change[3] = parseFloat(parseFloat(newValue).toFixed(2));
                      } else {
                        console.error("Formato de `change` inesperado o inválido", change);
                      }*/

                    }

                    if (col === 0) {
                      if (newValue === undefined || newValue === "" || newValue === NaN || newValue === null) {
                        hot.setDataAtRowProp(row, 1, "");
                        hot.setDataAtRowProp(row, 2, "");
                        hot.setDataAtRowProp(row, 3, "");
                        hot.setDataAtRowProp(row, 4, "");
                        hot.setDataAtRowProp(row, 5, "");
                      }
                    }
                  }
                });
              }

              return true;
            }}


            cells={(row, col, prop) => {
              const cellProperties = {};
              const editableStyle = { backgroundColor: '#FFFF00' };
              const readonlyStyle = { backgroundColor: '#f5c6c6' };
              const reset = { backgroundColor: '' };


              if (col === 5) {
                const exists = subheadingValidity.get(`${row}-${col}`);


                let length = 0;

                if (data[row][5] === null || data[row][5] === "" || data[row][5] === undefined) {
                  length = 0
                } else {
                  length = data[row][5].length
                }


                if (data[row][5] !== "**********") {
                  if (data[row][0] !== "" && (data[row][1] !== undefined && data[row][1] !== "" && data[row][1] !== NaN) && length === 10) {

                    if (exists === false) {
                      cellProperties.renderer = (hotInstance, td, row, col, prop, value, cellProperties) => {
                        Handsontable.renderers.TextRenderer(hotInstance, td, row, col, prop, value, cellProperties);
                        td.style.backgroundColor = reset.backgroundColor;
                        td.setAttribute('title', 'Subpartida no existe');
                        td.innerHTML = '';

                        const container = document.createElement('div');
                        container.style.display = 'flex';
                        container.style.alignItems = 'center';
                        container.style.position = 'relative';
                        container.style.width = '100%';

                        const icon = document.createElement('span');
                        icon.style.position = 'absolute';
                        icon.style.left = '8px';
                        icon.style.top = '50%';
                        icon.style.transform = 'translateY(-50%)';
                        icon.style.marginRight = '1px';
                        icon.style.display = 'flex';
                        icon.style.alignItems = 'center';

                        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 26"><g fill="none"><defs><mask id="IconifyId191e329751e7bba44112"><path fill="#fff" d="M0 0h26v26H0z"/><g fill="#000"><path fill-rule="evenodd" d="M13.25 5.25A.75.75 0 0 1 14 6v9a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75" clip-rule="evenodd"/><path d="M14.5 19.25a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0"/></g></mask></defs><circle cx="13" cy="13" r="13" fill="#eab308" mask="url(#IconifyId191e329751e7bba44112)"/></g></svg>`;

                        container.appendChild(icon);

                        const content = document.createElement('div');
                        content.textContent = hotInstance.getDataAtCell(row, col) || '';
                        content.style.marginLeft = '2px';
                        content.style.flexGrow = 1;
                        content.style.textAlign = 'center';
                        content.style.whiteSpace = 'nowrap';

                        container.appendChild(content);


                        td.appendChild(container);


                        cellProperties.readOnly = false


                      };
                    } else {
                      cellProperties.renderer = (hotInstance, td, row, col, prop, value, cellProperties) => {
                        Handsontable.renderers.TextRenderer(hotInstance, td, row, col, prop, value, cellProperties);
                        td.style.backgroundColor = reset.backgroundColor;
                        td.setAttribute('title', 'Subpartida existe');

                        td.innerHTML = '';


                        const container = document.createElement('div');
                        container.style.display = 'flex';
                        container.style.alignItems = 'center';
                        container.style.position = 'relative';
                        container.style.width = '100%';


                        const icon = document.createElement('span');
                        icon.style.position = 'absolute';
                        icon.style.left = '8px';
                        icon.style.top = '50%';
                        icon.style.transform = 'translateY(-50%)';
                        icon.style.marginRight = '1px';
                        icon.style.display = 'flex';
                        icon.style.alignItems = 'center';


                        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 26"><g fill="none"><defs><mask id="IconifyId191e329751e7bba4469"><path fill="#fff" d="M0 0h26v26H0z"/><g fill="#000"><path d="m17.937 8.743l-5 9c-.324.583-1.198.097-.874-.486l5-9c.324-.583 1.198-.097.874.486"/><path d="m7.812 13.11l5 4c.52.416-.104 1.197-.624.78l-5-4c-.52-.416.104-1.197.624-.78"/></g></mask></defs><circle cx="13" cy="13" r="13" fill="#65a30d" mask="url(#IconifyId191e329751e7bba4469)"/></g></svg>`;

                        container.appendChild(icon);

                        const content = document.createElement('div');
                        content.textContent = hotInstance.getDataAtCell(row, col) || '';
                        content.style.marginLeft = '2px';
                        content.style.flexGrow = 1;
                        content.style.textAlign = 'center';
                        content.style.whiteSpace = 'nowrap';

                        container.appendChild(content);

                        td.appendChild(container);
                        cellProperties.readOnly = false
                      };
                    }
                  } else if (data[row][0] !== "" && (data[row][1] !== undefined && data[row][1] !== "" && data[row][1] !== NaN) && length !== 10) {
                    cellProperties.renderer = (hotInstance, td, row, col, prop, value, cellProperties) => {
                      Handsontable.renderers.TextRenderer(hotInstance, td, row, col, prop, value, cellProperties);

                      td.setAttribute('title', 'Registre subpartida, parámetro de 10 digitos obligatorio');
                      if (length > 0 && length < 10) {
                        td.style.backgroundColor = reset.backgroundColor;
                        td.innerHTML = '';

                        const container = document.createElement('div');
                        container.style.display = 'flex';
                        container.style.alignItems = 'center';
                        container.style.position = 'relative';
                        container.style.width = '100%';

                        const icon = document.createElement('span');
                        icon.style.position = 'absolute';
                        icon.style.left = '8px';
                        icon.style.top = '50%';
                        icon.style.transform = 'translateY(-50%)';
                        icon.style.marginRight = '1px';
                        icon.style.display = 'flex';
                        icon.style.alignItems = 'center';


                        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 26"><g fill="none"><defs><mask id="IconifyId191e329751e7bba44263"><path fill="#fff" d="M0 0h26v26H0z"/><g fill="#000" fill-rule="evenodd" clip-rule="evenodd"><path d="M13 6.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13M5.5 13a7.5 7.5 0 1 1 15 0a7.5 7.5 0 0 1-15 0"/><path d="M18.304 7.697a.5.5 0 0 1 0 .707l-9.9 9.9a.5.5 0 1 1-.707-.707l9.9-9.9a.5.5 0 0 1 .707 0"/></g></mask></defs><circle cx="13" cy="13" r="13" fill="#dc2626" mask="url(#IconifyId191e329751e7bba44263)"/></g></svg>`;


                        container.appendChild(icon);


                        const content = document.createElement('div');
                        content.textContent = hotInstance.getDataAtCell(row, col) || '';
                        content.style.marginLeft = '2px';
                        content.style.flexGrow = 1;
                        content.style.textAlign = 'center';
                        content.style.whiteSpace = 'nowrap';

                        container.appendChild(content);


                        td.appendChild(container);
                      } else {
                        td.style.backgroundColor = readonlyStyle.backgroundColor;
                      }


                      cellProperties.readOnly = false
                    };
                  }
                } else {
                  cellProperties.renderer = (hotInstance, td, row, col, prop, value, cellProperties) => {
                    Handsontable.renderers.TextRenderer(hotInstance, td, row, col, prop, value, cellProperties);
                    td.style.backgroundColor = reset.backgroundColor;
                    td.setAttribute('title', '');
                    cellProperties.readOnly = true
                  }
                }
              }
              if (col === 0) {
                if (data[row][0] !== "" && (data[row][1] === undefined || data[row][1] === NaN || data[row][1] === "" || data[row][1] === null) && data[row][0] !== undefined && data[row][0] !== NaN && data[row][0] !== null) {
                  cellProperties.renderer = (hotInstance, td, row, col, prop, value, cellProperties) => {
                    Handsontable.renderers.TextRenderer(hotInstance, td, row, col, prop, value, cellProperties);
                    td.style.backgroundColor = readonlyStyle.backgroundColor;
                    td.title = 'Posicion no registrada';
                  };
                } else {
                  cellProperties.renderer = (hotInstance, td, row, col, prop, value, cellProperties) => {
                    Handsontable.renderers.TextRenderer(hotInstance, td, row, col, prop, value, cellProperties);
                    td.style.backgroundColor = reset.backgroundColor;
                    td.title = '';
                  };
                }
              }
              if (col === 3) {

              }


              return cellProperties;
            }}


            afterChange={async (changes, source) => {

              if(source === 'edit'){
                if (!hotTableRef.current) return;
  
  const hot = hotTableRef.current.hotInstance;
  
  // Recorrer cada cambio detectado.
  for (const [rowIndex, colIndex, oldValue, newValue] of changes) {

    // Procesamiento para la columna 5.
    if (colIndex === 5) {
      await sleep(1500)

      if (newValue === '**********' && oldValue !== '**********') {
        // Verificamos si la fila tiene contador global.
        if (!getCounter(rowIndex)) {
          if (!isLoading2) {
            // Si no está cargando, revertir el cambio.
            hot.setDataAtCell(rowIndex, colIndex, "");
            console.log("Valor revertido después de la verificación.");
          } else {
            // Si se está cargando, actualizamos el contador global.
            updateGlobalCounter(rowIndex, "**********");
            console.log("Evitamos una pérdida");
          }
        } else {
          console.log("La fila tiene secuencia automática, no se revertirá el valor.");
        }
        // Actualizar el contador global para la fila.
        updateGlobalCounter(rowIndex, newValue);
      }
      // Verificar asíncronamente si el nuevo valor (subheading) existe.
      try {
        const exists = await checkSubheadingExists(newValue);
        setSubheadingValidity(prev => {
          const newMap = new Map(prev);
          newMap.set(`${rowIndex}-${colIndex}`, exists);
          return newMap;
        });
      } catch (error) {
        console.error("Error checking subheading:", error);
      }
    }


    // Procesamiento para la columna 2.
    if (colIndex === 2) {
      const valueX = parseFloat(newValue);
      const value1 = parseFloat(hot.getDataAtCell(rowIndex, 0));
      const record = await selectByPurchaseOrder(orderNumber, value1);

      if (isTable === "Create") {
        if (parseFloat(record[0]?.total_quantity) === (parseFloat(record[0]?.approved_quantity) + parseFloat(record[0]?.pending_quantity))) {
          // Revertir valores en varias columnas.
          hot.setDataAtCell(rowIndex, colIndex, "");
          hot.setDataAtCell(rowIndex, 1, "");
          hot.setDataAtCell(rowIndex, 3, "");
          hot.setDataAtCell(rowIndex, 4, "");
          hot.setDataAtCell(rowIndex, 5, "");
        } else if (valueX > parseFloat(record[0]?.total_quantity) || valueX < 1) {
          hot.setDataAtCell(rowIndex, colIndex, "");
        }
      } else {
        const supplierdata = await selectSupplierData({
          page: 1,
          limit: 1,
          equals: { invoice_id: invoi, base_bill_id: record[0]?.base_bill_id }
        });
        let cantidad = 0
        cantidad = supplierdata[0]?.billed_quantity || 0
        if ((valueX > ((record[0]?.total_quantity - (record[0]?.approved_quantity + record[0]?.pending_quantity) ) + supplierdata[0]?.billed_quantity) || valueX < 1) && cantidad > 0) {
          hot.setDataAtCell(rowIndex, colIndex, "");
        }else if(cantidad === 0){
          if(valueX > record[0]?.total_quantity || valueX + (record[0]?.pending_quantity + record[0]?.approved_quantity) > record[0]?.total_quantity){
            hot.setDataAtCell(rowIndex, colIndex, "");
          }
        }
      }
    }

    if(colIndex === 4){
      const totalSum = data.reduce((sum, row) => {
        const unip = parseFloat(String(row[3]).replace(/[$,]/g, '')) || 0;
        const can = parseFloat(row[2]) || 0;
        return unip > 0 && can > 0 ? sum + (unip * can) : sum;
      }, 0);
      updateSharedState('totalfactura', formatMoney(totalSum.toFixed(2)));
    }

    // Si el cambio ocurre en la columna 2 o 3, recalcular y actualizar la columna 4.
    if (colIndex === 2 || colIndex === 3) {
      // Solo se procesa si las celdas de las columnas 0 y 1 tienen contenido (no vacío)
      if (hot.getDataAtCell(rowIndex, 0) && hot.getDataAtCell(rowIndex, 1)) {
        try {
          const cellValueRaw = hot.getDataAtCell(rowIndex, 2);
          const value3Raw = hot.getDataAtCell(rowIndex, 3);
    
          // Convertir a números
          const cellValue = parseFloat(cellValueRaw);
          const value3 = parseFloat(String(value3Raw).replace(/[$,]/g, ''));
    
          // Si ambos son números válidos, se realiza el cálculo
          if (!isNaN(cellValue) && !isNaN(value3)) {
            const result = cellValue * value3;
            hot.setDataAtCell(rowIndex, 4, String(formatMoney(result)));
          } else {
            // Si alguno no es numérico, limpiamos la celda para evitar errores
            hot.setDataAtCell(rowIndex, 4, "");
          }
        } catch (error) {
          console.error("Error calculando el valor para la fila", rowIndex, error);
          hot.setDataAtCell(rowIndex, 4, "");
        }
      }
    }

    // Procesamiento para la columna 0 (si aplica):
    if (colIndex === 0 && position != null && orderNumber.trim() !== "") {
      const pos = hot.getDataAtCell(rowIndex, 0);
      if (!orderNumber || !pos || orderNumber === "" || pos === "" || isNaN(orderNumber) || isNaN(pos)) {
        continue;
      }
      const record = records.find(r => Number(r.item) === Number(pos) && (r.purchase_order) === orderNumber);

      if (Number(record.item) === Number(pos)) {
        const { material_code, unit_price, total_quantity, pending_quantity, approved_quantity } = record;
        if (((parseFloat(approved_quantity) + parseFloat(pending_quantity)) < parseFloat(total_quantity)) || (isTable !== "Create" && (parseFloat(approved_quantity) < parseFloat(total_quantity)))) {
          try {
            const materialDetails = materialResults.find(
                              m => String(m.material_code) === String(record.material_code)
                            );
            const subheading = materialDetails.data[0].subheading || undefined
            // Actualizamos la columna 1 con el material code.
            hot.setDataAtCell(rowIndex, 1, material_code);
            if (subheading) {
              // Si hay subheading, establecemos "**********" y actualizamos el contador global.
              updateGlobalCounter(rowIndex, "**********");
              hot.setDataAtCell(rowIndex, 5, "**********");
            } else {
              // De lo contrario, se establece el subheading obtenido.
              updateGlobalCounter(rowIndex, subheading);
              hot.setDataAtCell(rowIndex, 5, subheading);
            }
          } catch (error) {
            console.error("El Material no existe", error);
          }
          // Actualización según conversión de moneda.
          if (((realcurrency === "USD" || realcurrency === "EUR") && selectedCurrency === "COP") ||
              ((selectedCurrency === "USD" && realcurrency === "EUR") || (selectedCurrency === "EUR" && realcurrency === "USD"))) {
            hot.setDataAtCell(rowIndex, 3, String(formatMoney((unit_price / 100) * sharedState.TRMCOP)));
          } else if (realcurrency === "COP" && selectedCurrency !== "COP") {
            hot.setDataAtCell(rowIndex, 3, String(formatMoney((unit_price / 100) * sharedState.TRMCOP)));
          } else if (realcurrency === selectedCurrency) {
            hot.setDataAtCell(rowIndex, 3, String(formatMoney(unit_price / 100)));
          } else {
            hot.setDataAtCell(rowIndex, 3, "");
            hot.setDataAtCell(rowIndex, 4, "");
          }
          setfactunitprice(unit_price);
          setfacttotalvalue(newValue * unit_price);
        }
      } else {
        console.log(`No matching record found for row ${rowIndex}`);
      }
    }
  }
  
  // Renderizar la tabla para reflejar los cambios.
  hot.render();
              }


              if (source === 'CopyPaste.paste') {
                const paste = debounce(async () => {
                  if (!hotTableRef.current) return;
                  const hot = hotTableRef.current.hotInstance;
                  const data = hot.getData();
                  console.log("Tamaño guardado en cache: ",records.length)
                  const changesByRow = new Map();
                  const promises = [];
                  const batchChanges = [];
              
                  // Procesa cada cambio de manera concurrente (sin sleep)
                  const changePromises = changes.map(async ([rowIndex, colIndex, oldValue, newValue]) => {
                    // Caso para la columna 5: validación de subheading y contador global
                    if (colIndex === 5) {
                      if (newValue === '**********' && oldValue !== '**********') {
                        if (!getCounter(rowIndex)) {
                          if (!isLoading2) {
                            batchChanges.push([rowIndex, colIndex, ""]); // Revertir valor
                            console.log("Valor revertido después de la verificación.");
                          } else {
                            updateGlobalCounter(rowIndex, "**********"); // Actualiza contador global
                            console.log("Evitamos una pérdida");
                          }
                        } else {
                          console.log("La fila tiene secuencia automática, no se revertirá el valor.");
                        }
                        updateGlobalCounter(rowIndex, newValue);
                      }
                      try {
                        const exists = await checkSubheadingExists(newValue);
                        setSubheadingValidity(prev => {
                          const newMap = new Map(prev);
                          newMap.set(`${rowIndex}-${colIndex}`, exists);
                          return newMap;
                        });
                        // Se evita renderizar aquí para optimizar, se hace al final
                      } catch (error) {
                        console.error('Error checking subheading:', error);
                      }
                    }
              
                    // Caso para la columna 2: validación de cantidades según orden de compra
                    if (colIndex === 2) {
                      const valueX = parseFloat(newValue);
                      const value1 = parseFloat(hot.getDataAtCell(rowIndex, 0));
                      const record = records.find(r => Number(r.item) === Number(value1) && (r.purchase_order) === orderNumber);

              
                      if (isTable === "Create") {
                        if (parseFloat(record.total_quantity) === (parseFloat(record.approved_quantity) + parseFloat(record.pending_quantity))) {
                          batchChanges.push([rowIndex, colIndex, ""]);
                          batchChanges.push([rowIndex, 1, ""]);
                          batchChanges.push([rowIndex, 3, ""]);
                          batchChanges.push([rowIndex, 4, ""]);
                          batchChanges.push([rowIndex, 5, ""]);
                        } else {
                          if (valueX > parseFloat(record.total_quantity) || valueX < 1) {
                            batchChanges.push([rowIndex, colIndex, ""]);
                          }
                        }
                      } else {
                        const supplierdata = await selectSupplierData({ 
                          page: 1, 
                          limit: 1, 
                          equals: { invoice_id: invoi, base_bill_id: record.base_bill_id }
                        });
                        if (valueX > ((record[0]?.total_quantity - (record[0]?.approved_quantity + record[0]?.pending_quantity) ) + supplierdata[0]?.billed_quantity) || valueX < 1) {
                          batchChanges.push([rowIndex, colIndex, ""]);
                        }
                      }
                    }
                    
                    if(colIndex === 4){
                      const totalSum = data.reduce((sum, row) => {
                        const unip = parseFloat(String(row[3]).replace(/[$,]/g, '')) || 0;
                        const can = parseFloat(row[2]) || 0;
                        return unip > 0 && can > 0 ? sum + (unip * can) : sum;
                      }, 0);
                      updateSharedState('totalfactura', formatMoney(totalSum.toFixed(2)));
                    }

                    // Actualiza la columna 4 en función de las columnas 2 y 3
                    if (colIndex === 2 || colIndex === 3) {
                      const result = data[rowIndex][2] * parseFloat(String(data[rowIndex][3]).replace(/[$,]/g, ''));
                      batchChanges.push([rowIndex, 4, String(formatMoney(result))]);
                    }
              
                    // Caso para la columna 0: se guarda el valor modificado
                    if (colIndex === 0 && position != null && orderNumber.trim() !== '') {
                      changesByRow.set(rowIndex, newValue?.toString().trim());
                    }
                  });
              
                  // Espera a que se completen todas las validaciones de los cambios
                  await Promise.all(changePromises);
              
                  // Procesa cambios por fila que requieren más validaciones y actualización de otros campos
                  for (const [row, cellValue] of changesByRow.entries()) {
                    promises.push((async () => {
                      try {
                        const pos = data[row][0];
                        if (!orderNumber || !pos || orderNumber.trim() === "" || pos.trim() === "" || isNaN(orderNumber) || isNaN(pos)) return;
                        const record = records.find(r => Number(r.item) === Number(pos) && (r.purchase_order) === orderNumber);
                        console.log("Records de la posicion ",pos," : ",record)
                        if (Number(record.item) === Number(pos)) {
                          const { material_code, unit_price, total_quantity, pending_quantity, approved_quantity } = record;
              
                          if (((parseFloat(approved_quantity) + parseFloat(pending_quantity)) < parseFloat(total_quantity)) || (isTable !== "Create" && (parseFloat(approved_quantity) < parseFloat(total_quantity)))) {
                            const materialDetails = materialResults.find(
                              m => String(m.material_code) === String(record.material_code)
                            );
                            batchChanges.push([row, 1, material_code]);
                            let subheading = ""
                            try {

                              subheading = materialDetails.data[0].subheading || undefined

                              
                              if (subheading) {
                                batchChanges.push([row, 5, "**********"]);
                                updateGlobalCounter(row, "**********");
                              } else {
                                batchChanges.push([row, 5, subheading]);
                                updateGlobalCounter(row, subheading);
                              }
                            } catch {
                              console.error("El Material no existe");
                              batchChanges.push([row, 5, subheading]);
                                updateGlobalCounter(row, subheading);
                            }
              
                            if (((realcurrency === "USD" || realcurrency === "EUR") && selectedCurrency === "COP") ||
                                ((selectedCurrency === "USD" && realcurrency === "EUR") || (selectedCurrency === "EUR" && realcurrency === "USD"))) {
                              batchChanges.push([row, 3, String(formatMoney((unit_price / 100) * sharedState.TRMCOP))]);
                            } else if (realcurrency === "COP" && selectedCurrency !== "COP") {
                              batchChanges.push([row, 3, String(formatMoney((unit_price / 100) * sharedState.TRMCOP))]);
                            } else if (realcurrency === selectedCurrency) {
                              batchChanges.push([row, 3, String(formatMoney(unit_price / 100))]);
                            } else {
                              batchChanges.push([row, 3, ""]);
                              batchChanges.push([row, 4, ""]);
                            }
                            setfactunitprice(unit_price);
                            setfacttotalvalue(cellValue * unit_price);
                          }
                        } else {
                          console.log(`No se encontró registro coincidente para la fila ${row}`);
                        }
                      } catch (error) {
                        console.error(`Error procesando registros para la fila ${row}:`, error);
                      }
                    })());
                  }
              
                  // Espera a que se completen las validaciones por fila
                  await Promise.all(promises);
              
                  // Aplica todos los cambios en lote y renderiza una sola vez
                  if (batchChanges.length > 0) {
                    hot.batch(() => {
                      batchChanges.forEach(([row, col, value]) => {
                        hot.setDataAtCell(row, col, value);
                      });
                    });
                  }
                  hot.render();
                  console.log("Tabla refrescada después de cambios.");
                }, 300);
              
                paste();
              }
              



            }} 





            contextMenu={{
              callback: (key, options) => {
                setTimeout(() => {
                  console.log(`Se seleccionó: ${key}`);
                }, 100); // 🕐 Espera 100ms antes de ejecutar
              },
              items: {
                'copy': { name: 'Copiar' },
                'cut': { name: 'Cortar' },
                'undo': { name: 'Deshacer' },
              }
            }}
          />
        </Box>
        {(isTable === "Create" || isActive === true) && (
          <Button mt={1} bgColor="#F1D803" colorScheme="steal" textColor="black" height="5%" onClick={(isTable !== "Create") ? UpdateData : handleSubmit} >{(isTable !== "Create") ? "Reenviar" : "Asociar"}</Button>
        )}
      </>


    </div>
  );
}

