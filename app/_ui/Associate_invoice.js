'use client'
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery,Radio,RadioGroup,Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,Alert, Switch, Tooltip,  Box, VStack, HStack,  Button, Text, Input, useDisclosure, Icon, Spinner } from "@chakra-ui/react";
import { SearchIcon, ArrowBackIcon, EditIcon } from "@chakra-ui/icons";
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { getRecords, getMaterial, getSupplier, insertRecordInfo, getRecord, updateMaterial, updateRecord, checkSubheadingExists, insertMaterial, insertInvoice, getInvo, getSuplierInvoice, getRecordInfo } from '@/app/_lib/database/service';
import debounce from "lodash/debounce"; 
import { deleteSupplierData, insertSupplierData, selectSingleSupplierData, selectSupplierData, selectSupplierDataByInvoiceID, updateSupplierData } from "../_lib/database/supplier_data";
import { getRole } from "../_lib/supabase/client";
import {userData} from "@/app/_lib/database/currentUser"
import { selectSingleSupplier } from "../_lib/database/suppliers";
import { selectSingleSupplierEmployee } from "../_lib/database/supplier_employee";
import { getData } from "../_lib/database/app_data";
import { selectBills, selectByPurchaseOrder, selectSingleBill } from "../_lib/database/base_bills";
import { selectSingleInvoice, updateInvoice } from "../_lib/database/invoice_data";





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

  
  const [position, setposition] = useState(0);
  const router = useRouter();
  const [lastClickTime, setLastClickTime] = useState(0);
  const [columnSum2, setColumnSum2] = useState(0);

  const [selectedCurrency, setSelectedCurrency] = useState('USD'); 
  const [copia,setcopia] = useState([])
  const debounceTimeoutRef4 = useRef(null);


  const [data, setData] = useState(Array(200).fill().map(() => Array(6).fill('')));

  const { isOpen, onOpen, onClose } = useDisclosure();

  const pruebas = async () => {

    let tfactura = 0;
    let Copia = [];
    const hot = hotTableRef.current.hotInstance;
    try {
      const invoice = await selectSingleInvoice(invoi);
      
      // Manejo de estados inicial
      setisActive(invoice.state !== "approved");
      setButton(invoice.state === "approved" ? false : (invoice.state === "View"? true : false));
  
      // Obtén los datos una sola vez
      const Data = await getSuplierInvoice(1, 200, invoi);
      setcopia(Data);
  
      let total = 0;
      let bultos = 0;
      let purchase = "";
      let proveedor = "";
      let cont = 0;
      let groupedData = {};
  
      
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
              proveedor = pro?.name || "";
              
              const trmCondition = datas.billed_unit_price !== bill[0]?.unit_price;
              updateSharedState('TRM', !trmCondition);
              updateSharedState('TRMCOP', trmCondition ? (parseFloat((datas.billed_unit_price/bill[0]?.unit_price).toFixed(10))) : undefined);
              setSelectedCurrency(datas.billed_currency)
            }

            // Actualización de campos
            updateSharedState('nofactura', datas.bill_number);
            total += datas.gross_weight || 0;
            bultos += datas.packages || 0;
  
            // Guardar cambios en la tabla

              changes.push([cont, 0, bill[0].item]);
              changes.push([cont, 2, datas.billed_quantity]);

  
            cont++;
          } catch (err) {
            console.error('Error fetching bill for base_bill_id:', datas.base_bill_id, err);
          }
        }
      });
  
      await Promise.all(billPromises);

    // Actualización final del estado
    updateSharedState('pesototal', parseFloat(total.toFixed(2)));
    updateSharedState('bultos', parseFloat(bultos.toFixed(0)));
    updateSharedState('proveedor', proveedor);
    setOrderNumber(purchase);

    // Crear pares y mantener la relación
    const grouped = [];
    for (let i = 0; i < changes.length; i += 2) {
        const dominant = changes[i]; // Dominante
        const companion = changes[i + 1]; // Acompañante
        grouped.push({
            dominant: dominant,
            companion: companion
        });
    }

    // Paso 2: Ordenar los dominantes por su valor
    grouped.sort((a, b) => a.dominant[2] - b.dominant[2]);

    // Paso 3: Asignar nuevas filas
    const result = [];
    grouped.forEach((pair, index) => {
        const newRow = index; // Nueva fila basada en el índice
        const newDominant = [newRow, pair.dominant[1], pair.dominant[2]];
        const newCompanion = [newRow, pair.companion[1], pair.companion[2]];
        
        result.push(newDominant);
        result.push(newCompanion);
    });

    // Actualizar la tabla de Handsontable en batch
    if (result.length > 0) {
        console.log("Aplicando cambios de una vez en la tabla...");
        
        hot.batch(() => {
            hot.setDataAtCell(result);
        });
        
        // Esperar a que el batch termine
        await new Promise(resolve => {
            hot.addHookOnce('afterChange', () => {
                console.log("Cambios aplicados en la tabla.");
                resolve();
            });
        });
        
        // Recargar la tabla para asegurar que todos los datos están bien sincronizados
        hot.loadData(hot.getData());
      

        console.log("Tabla recargada.");
    } else {
        console.log("No hay cambios para aplicar.");
    }
    } catch (error) {
      console.error('Error in pruebas function:', error);
    } finally {

     

    }
  };
  





  
  useEffect(() => {
    const config = async () =>{
      if(isTable === "Create"){
        updateSharedState('nofactura', "");
        updateSharedState('proveedor', "")
      updateSharedState('descripcion', "NaN")
      updateSharedState('cantidadoc', 0)
      updateSharedState('preciouni', 0);
      updateSharedState('pesopor', 0)
      updateSharedState('totalfactura', 0)
      updateSharedState('TRM', false)
      updateSharedState('bultos', );
      updateSharedState('pesototal', )
      updateSharedState('TRMCOP', )
      setisActive(true)
      setButton(false)
      onOpen()
      }else{
        updateSharedState('proveedor', "")
      updateSharedState('descripcion', "NaN")
      updateSharedState('cantidadoc', 0)
      updateSharedState('preciouni', 0);
      updateSharedState('pesopor', 0)
      updateSharedState('totalfactura', 0)
      updateSharedState('TRM', false)
      updateSharedState('pesototal', 0)
      updateSharedState('TRMCOP', )
      
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
    if(selectedCurrency === "USD" || selectedCurrency === "EUR"){
      if(selectedCurrency === "USD"){
        setSelectedCurrency("USD")
      }else{
        setSelectedCurrency("EUR")
      }
      updateSharedState('TRM', true)
    }else{
      setSelectedCurrency("USD")
      updateSharedState('TRM', false)
    }
    onClose();
  };




  const handleOrderNumberChange = async (e) => {
    setOrderNumber(e.target.value);
    const record = await getRecord(e.target.value, 1)
    const suplier = await getSupplier(record.supplier_id)
    if (suplier.name !== null && suplier.name !== undefined && suplier !== "") {
      updateSharedState('proveedor', suplier.name);
    } else {
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


  };
  const toggleActive = () => {
    setisActive(prevState => !prevState); // Cambia entre true y false
  };


  
  


  function handleChange(value) {
    if (!value) {
      return '';
    }

 
    let formattedValue = value.replace(/[\$\s]/g, '');


    if (formattedValue.includes('.') && formattedValue.includes(',')) {

      if (formattedValue.indexOf(',') < formattedValue.indexOf('.')) {
        formattedValue = formattedValue.replace(/,/g, ''); 
      } else {

        formattedValue = formattedValue.replace(/\./g, '').replace(/,/g, '.'); 
      }
    } else if (formattedValue.includes(',')) {
 
      formattedValue = formattedValue.replace(/\./g, '').replace(/,/g, '.');
    } else if (formattedValue.includes('.')) {

      formattedValue = formattedValue.replace(/\./g, '');
    }


    const decimalMatch = formattedValue.match(/^(\d+)\.(\d{2})$/);

    if (decimalMatch) {
      if (decimalMatch[2] === '00') {
        return decimalMatch[1];
      }
      return formattedValue;
    }

    const splitValue = formattedValue.split('.');
    let intValue = splitValue[0];
    let decimalValue = splitValue[1] || '';

    if (decimalValue.length > 2) {
      decimalValue = decimalValue.slice(0, 2);
    } else if (decimalValue.length < 2) {
      decimalValue = decimalValue.padEnd(2, '0');
    }

    formattedValue = `${intValue}.${decimalValue}`;

    if (decimalValue === '00') {
      return intValue;
    }

    return formattedValue;
  }
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
      if (orderNumber) {

        if (orderNumber.trim() !== '') {
          setIsLoading(true);

          getRecords(1, 40000)
            .then((data) => {
              if (Array.isArray(data)) {
                const matchingRecords = data
                  .map(record => record.purchase_order)
                  .filter((value, index, self) =>
                    self.indexOf(value) === index && value.includes(orderNumber)
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
  }, [orderNumber]);



  const clearRowsWithValuesInColumn0 = debounce(async () => {
    const hot = hotTableRef.current.hotInstance;
    const data = hot.getData();

   
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

              if (parseFloat(approved_quantity)  < parseFloat(total_quantity) ) {
                const materialDetails = await getMaterial(material_code);
                const subheading = materialDetails?.subheading || "";


                changes.push([rowIndex, 1, material_code]);


 
                if (sharedState.TRM) {

                    changes.push([rowIndex, 3, String(formatMoney(unit_price/100))]);
                    changes.push([rowIndex, 4, String(formatMoney((unit_price/100)* data[rowIndex][2]))]);
                } else if (!sharedState.TRM && parseFloat(sharedState.TRMCOP) !== 0) {

                  changes.push([rowIndex, 3, String(formatMoney((unit_price/100) * sharedState.TRMCOP))]);
                  changes.push([rowIndex, 4, String((formatMoney((((unit_price/100) * sharedState.TRMCOP* data[rowIndex][2])))))]);
                } else {

                  changes.push([rowIndex, 3, ""]);
                  changes.push([rowIndex, 4, ""]);
                }

                if(subheading){
                  changes.push([rowIndex, 5, String("**********")]);
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
  }, 300); 









































  const UpdateData = async () => {
    const userConfirmed = window.confirm('¿Estás seguro de que deseas realizar la siguiente asociación de factura?');
    if (!userConfirmed) return;
  
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return console.error('No hay instancia de Handsontable disponible.');
  
    // Validaciones necesarias
    if (!sharedState.pesototal || !sharedState.bultos || !sharedState.nofactura || (!sharedState.TRM && (!sharedState.TRMCOP || sharedState.TRMCOP <= 0))) {
      window.alert('Error, debe llenar todos los campos requeridos.');
      return;
    }
  
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
        const matchedRecord = await getRecord(orderNumber, pos);
  
        if (!matchedRecord) {
          console.error(`No se encontró el registro para la posición ${pos}`);
          continue;
        }
  
        const { base_bill_id, unit_price, material_code, total_quantity, supplier_id } = matchedRecord;
  
        // Insertar la factura si aún no existe
        if (!id) {
          const user = await userData();
          email = user.data.user.email;
          const sup = await selectSingleSupplier(supplier_id);
          suname = sup.name;
          const newInvoice = await insertInvoice({ supplier_id, state: "pending" });
          id = newInvoice;
        }
  
        // Crear o actualizar materiales si se encuentra una subpartida
        if (subheading !== "**********") {
          const valida = await getMaterial(material_code);
          if (valida.material_code) {
            await updateMaterial({ material_code, subheading });
          } else {
            await insertMaterial({ material_code, subheading });
          }
        }
  
        const factunitprice = parseFloat(String(hotInstance.getDataAtCell(index, 3)).replace(/[$,]/g, ''));
        const totalprice = (factunitprice * parseFloat(hotInstance.getDataAtCell(index, 2))).toFixed(2);
        const gross = ((((hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) * sharedState.pesototal))).toFixed(9);
        const packag = ((((hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) * sharedState.bultos))).toFixed(9);
        let conver = 0;
        let trm = 0;
  
        if (sharedState.TRM) {
          trm = selectedCurrency === "USD" ? await getExchangeRate("trm_usd") : await getExchangeRate("trm_eur");
          conver = selectedCurrency === "USD" ? "USD" : "EUR";
        } else {
          trm =  await getExchangeRate("trm_usd") ;
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
            billed_unit_price: parseInt(factunitprice * 100),
            billed_total_price: parseInt(totalprice * 100),
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
                billed_unit_price: parseInt(factunitprice * 100),
                billed_total_price: parseInt(totalprice * 100),
                gross_weight: parseFloat(gross),
                packages: parseFloat(packag),
                billed_currency: conver,
                modified_at: new Date().toISOString()
              }
              console.log("Este es Up",up)
              update.push(up);
            
          } else {          
            records.push(record);
            console.log("Este es record",record)
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
  
    // Procesar eliminaciones, actualizaciones y creaciones
    try {
      // Eliminar los registros que ya no están presentes

      
      // Si hay elementos que realmente deben eliminarse, entonces realizar la operación
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
  
  
      if (records.length > 0) {
        await insertSupplierData(records);
      }
  
  
      if (update.length > 0) {
        await updateSupplierData(update);
      }
  
     
      await updateInvoice({ invoice_id: id, state: "pending", feedback: "" });
      alert('Registros enviados correctamente.');
      setisTable(false);
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al enviar los registros.');
    }
  };
  












  const columns = [
    { data: 0, readOnly: (!isActive ? true : false ), title: 'Posicion' },
    { data: 1, readOnly: true, title: 'Codigo de Material' },
    { data: 2, readOnly: (!isActive ? true : false ), title: 'Cantidad' },
    { data: 3, readOnly: true, title: 'Precio Unitario' },
    { data: 4, readOnly: true, title: 'Valor Neto' },
    { data: 5, readOnly: (!isActive ? true : false ), title: 'Subpartida ' },
  ];

  const handleCellDoubleClick = async (event, coords, TD) => {
    const currentTime = new Date().getTime();
    const cellValue = data[coords.row]?.[coords.col]?.toString().trim();
    const pos = data[coords.row]?.[0]?.toString().trim();
    const quanti = parseInt(data[coords.row]?.[2]?.toString().trim(), 10);

    const records = await getRecord(orderNumber, pos);



    const matchedRecord = records

    if ((records.item !== 0 && records.item !== "" && records.item !== null && records.item !== undefined && records.item !== NaN) && (pos !== 0 && pos !== "" && pos !== undefined && pos !== NaN && pos !== null)) {
      const { unit_price ,material_code, currency, description, supplier_id, total_quantity, approved_quantity, pending_quantity } = matchedRecord;
      if(parseFloat(approved_quantity) < parseFloat(total_quantity) ){

      const supplier = await getSupplier(supplier_id);

      updateSharedState('descripcion', description);
      updateSharedState('proveedor', supplier.name);
      updateSharedState('cantidadoc', (total_quantity - approved_quantity));
      updateSharedState('preciouni', unit_price);
      updateSharedState('moneda', currency);

      const factorPrice = sharedState.TRM
        ? unit_price * sharedState.valorTRM
        : unit_price;

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
      }else{
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
    
  },[sharedState.TRM,sharedState.TRMCOP])

  useEffect(() => {
    if(sharedState.TRM){
      updateSharedState('TRMCOP', );
    }
  },[sharedState.TRM])

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(2);  
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); 
    const day = now.getDate().toString().padStart(2, '0'); 
    return `${year}${month}${day}`;
  };

  const handleAfterSelection = (row, column, row2, column2) => {
    const coords = { row, col: column };
    handleCellDoubleClick(null, coords);
  };



  const [Invoice,setInvoice] = useState()


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
  
    if (!sharedState.pesototal || !sharedState.bultos || !sharedState.nofactura || (!sharedState.TRM && (!sharedState.TRMCOP || sharedState.TRMCOP <= 0))) {
      window.alert('Error, debe llenar todos los campos requeridos.');
      return;
    }
  
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
        const matchedRecord = await getRecord(orderNumber, pos);
  
        if (!matchedRecord) {
          console.error(`No se encontró el registro para la posición ${pos}`);
          continue;
        }
  
        const { base_bill_id, unit_price, material_code, total_quantity, supplier_id, } = matchedRecord;
  
          
          if(id === undefined || id === null){
            const role = await getRole()
            const user = await userData()
            email = user.data.user.email
            const sup = await selectSingleSupplier(supplier_id)
            suname = sup.name
            const newInvoice = await insertInvoice({ supplier_id: supplier_id, state: "pending" });
            console.log("se creooooo: ",newInvoice)
            id = newInvoice ;
          }

        if (subheading !== "**********") {
          const valida = await getMaterial(material_code);
          if (valida.material_code !== undefined) {
            //en caso de ya tener valor asignado
          } else {
            await insertMaterial({ material_code: material_code, subheading: subheading });
          }
        }
  
        const factunitprice = parseFloat(String(hotInstance.getDataAtCell(index, 3)).replace(/[$,]/g, ''));
        const totalprice = (factunitprice * parseFloat(hotInstance.getDataAtCell(index, 2))).toFixed(2);
        const gross = ((((hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) * sharedState.pesototal))).toFixed(9);
        const packag = ((((hotInstance.getDataAtCell(index, 2) / sharedState.columnSum) * sharedState.bultos))).toFixed(9);
        let conver = 0
        let trm = 0

        if (sharedState.TRM) {
          trm = selectedCurrency === "USD" ? await getExchangeRate("trm_usd") : await getExchangeRate("trm_eur");
          conver = selectedCurrency === "USD" ? "USD" : "EUR";
        } else {
          trm = selectedCurrency === "USD" ? await getExchangeRate("trm_usd") : await getExchangeRate("trm_eur");
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
            billed_quantity: parseInt(billed_quantity),
            billed_unit_price: parseInt(factunitprice * 100),
            billed_total_price: parseInt(totalprice * 100),
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

    try {
      await insertSupplierData(records);
      const date = transformDateTime(new Date())
      sendEmail(id)
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
      alert('Error al enviar los registros.');
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
      if(result.error){
        console.error(result.error)
      }
  
  };
  
  
  
  






  const [subheadingValidity, setSubheadingValidity] = useState(new Map());

  const [rowsWithAutoSequence, setRowsWithAutoSequence] = useState(new Set());




  return (
    <div className={`relative p-4 bg-gradient-to-tr from-gray-200 to-gray-300 border h-full border-gray-300 text-center rounded-3xl shadow-md flex flex-col`}>
    {isLoading2 && (
      <Box display="flex" justifyContent="center" alignItems="center" height="400">
        <Spinner size="xl" />
        <Text ml={4}>Obteniendo Base de datos...</Text>
      </Box>
    )}
     {!isLoading2 && (
       <>
       <HStack position="relative" width="100%" height="20%" >

<VStack width="25%">
  <HStack width="100%" height="20px" textAlign="start" align="start" justify="start">
    <Button onClick={() => setisTable(false)} width="30%" height="100%" colorScheme='teal' backgroundColor='#F1D803'>
      <ArrowBackIcon w={3} h={3} color='black' />
    </Button>
    {isButton && (
      <Tooltip label="Habilitar Edicion" fontSize="md">
        <Button onClick={toggleActive} width="30%" height="100%" colorScheme='teal' backgroundColor='#F1D803'>
      <Icon as={EditIcon} w={3} h={3} color="black" />
      </Button>
      </Tooltip>
    )}
  
  </HStack>
  
  <HStack>
    <Input
      border='1px'
      backgroundColor='white'
      isDisabled={isTable !== "Create"}
      type="text"
      value={orderNumber}
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
      <Button ref={buttonRef} isLoading={isLoading} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} colorScheme='teal' backgroundColor='#F1D803'>
        <SearchIcon w={5} h={5} color='black' />
      </Button>
    </Tooltip>
  </HStack>
  <HStack width="100%" ml="7px" h="30px" spacing={3}>

    <Text className=" font-bold" fontSize="80%">Factura en: </Text>
    <HStack>
      <Text className=" font-semibold" fontSize="70%">COP</Text>
      <Switch
        isDisabled={!isActive}
        isChecked={sharedState.TRM}
        onChange={handleSwitchChange}
      ></Switch>
      <Text className="font-semibold" fontSize="70%">
{selectedCurrency === 'USD' 
? 'USD' 
: selectedCurrency === 'EUR' 
? 'EUR' 
: 'USD'}
</Text>
    </HStack>

  </HStack>
</VStack>
<HStack width="2.5%">

</HStack>
<VStack width="45%" spacing={0}>
  <HStack className=" bg-white rounded-2xl" padding="3" position="relative" width="100%" spacing={0}>
    <VStack spacing={0} align="start" justify="start" width="30%" >
      <Text h="20%" className=" font-semibold" fontSize="70%">Descripcion:</Text>
      <Text h="20%" className=" font-semibold" fontSize="70%">Cantidad OC:</Text>
      <Text h="20%" className=" font-semibold" fontSize="70%">Valor en Dolares</Text>

    </VStack>
    <VStack spacing={0} align="end" justify="end" width="70%"  >
      <Text h="20%" fontSize="70%">{sharedState.descripcion}</Text>
      <Text h="20%" fontSize="70%">{sharedState.cantidadoc}</Text>
      <Text h="20%" fontSize="70%">{formatMoney(parseFloat(sharedState.preciouni/100))}</Text>


    </VStack>
  </HStack>
  <VStack position="relative" spacing={0}>

    {!sharedState.TRM && (
      <HStack ml="40px" top={2} height="30px" width="300px" position="absolute">
        <Text fontSize="70%">TRM Factura</Text>
        <Input onClick={() => updateSharedState("TRMCOP", ) } isDisabled={!isActive} type="number" min="1" step="0.0000000001" value={(isTable !== "Create") ? sharedState.TRMCOP : undefined} onBlur={handleTRMCOP} h="25px" width="190px" bg="white"></Input>
      </HStack>
    )}
  </VStack>
</VStack>
<HStack width="2.5%">

</HStack>
<VStack className=" bg-white rounded-2xl" padding="3" width="20%" spacing="3px" textAlign='center' justifyContent="center" alignItems='center'>


  <HStack align="center" justify="center" height="20%" >
    <VStack width="50%" align="start" justify="start"><Text fontSize="80%" className=" font-semibold">Peso Total</Text></VStack>
    <VStack width="50%" align="end" justify="end"><Input isDisabled={!isActive} fontSize="80%" width="100%" height="20%" type="number" min="1" step="0.01" onChange={handlepesototal} value={(isTable !== "Create") ? sharedState.pesototal : undefined} backgroundColor='white' border='1px' /></VStack>

  </HStack>
  <HStack align="center" justify="center" height="20%" >
    <VStack width="50%" align="start" justify="start"><Text fontSize="80%" type="numeric" className=" font-semibold">Bultos</Text></VStack>
    <VStack width="50%" align="end" justify="end"><Input isDisabled={!isActive} fontSize="80%" width="100%" height="20%" type="number" min="1" step="1" onChange={handlebulto} value={(isTable !== "Create") ? sharedState.bultos : undefined} backgroundColor='white' border='1px' /></VStack>
  </HStack>
  <HStack align="center" justify="center" height="20%" >
    <VStack width="50%" align="start" justify="start"><Text fontSize="80%" className=" font-semibold">No. Factura</Text></VStack>
    <VStack width="50%" align="end" justify="end"><Input isDisabled={!isActive} fontSize="80%" width="100%" height="20%" onChange={handleNoFactura} value={(isTable !== "Create") ? sharedState.nofactura : undefined} backgroundColor='white' border='1px' /></VStack>
  </HStack>



</VStack>
</HStack>
<HStack height="7%" spacing={3}>
<HStack padding="1" spacing={3} width="60%"><Text className=" font-bold  " fontSize="90%">Proveedor</Text><Text fontSize="90%">{String(sharedState.proveedor).slice(0.25)}</Text>
</HStack>

<HStack width="40%" align="end" justify="end">
  <Text fontSize="90%" className=" font-bold">Subtotal de la factura</Text>
  <Text fontSize="90%">{formatMoney(parseFloat(sharedState.totalfactura))}</Text>
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
  copyPaste={true}
  manualColumnResize={true}
  rowHeaders={true}
  manualRowResize={true}
  hiddenColumns={{ indicators: true }}
  afterSelection={handleAfterSelection}
  afterOnCellMouseDown={handleCellDoubleClick}
  afterRenderer={(TD, row, col, prop, value, cellProperties) => {


  }}
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

      if(data[row][5] === null){
        length = 0
      }else{
        length = data[row][5].length
      }


      if (data[row][5] !== "**********" ) {
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

            td.setAttribute('title', 'Campo no cumple el parámetro de 10 digitos');
            if(length > 0 && length < 10){
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
            }else{
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
      }else{
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

  afterChange={debounce(async (changes, source) => {
    if (source === 'edit' || source === 'CopyPaste.paste') {
      const hot = hotTableRef.current.hotInstance;
      const data = hot.getData();

      const changesByRow = new Map();
      const promises = [];
      const batchChanges = [];

      for (const [rowIndex, colIndex, oldValue, newValue] of changes) {
        if (colIndex === 5) {
          if (newValue === '**********') {
            // Si la fila no está en el Set de filas con secuencia automática, no permitimos la edición
          
              // Usamos setTimeout para retrasar la verificación
setTimeout(() => {
  // Verificamos si la fila no está en el conjunto después de un breve retraso
  if (!rowsWithAutoSequence.has(rowIndex)) {
      batchChanges.push([rowIndex, colIndex, oldValue]); // Revertimos al valor anterior
      console.log("Valor revertido después de la verificación.");
      
  } else {
      console.log("La fila tiene secuencia automática, no se revertirá el valor.");
  }
}, 100); // Retraso de 100 ms (puedes ajustarlo según lo necesites)

              

          }
          try {
            const subheading = newValue;
            const exists = await checkSubheadingExists(subheading);

            setSubheadingValidity(prev => {
              const newMap = new Map(prev);
              newMap.set(`${rowIndex}-${colIndex}`, exists);
              return newMap;
            });

            hot.render();

          } catch (error) {
            console.error('Error checking subheading:', error);
          }
        }


        if (colIndex === 2) {
          const valueX = parseFloat(newValue);
          const value1 = parseFloat(hot.getDataAtCell(rowIndex, 0));
          const record = await getRecord(orderNumber, value1);

          if (valueX > parseFloat(record.total_quantity) || valueX < 1) {
            batchChanges.push([rowIndex, colIndex, ""]);
          }
        }

        if ((colIndex === 2 || colIndex === 3)) {

          const result = data[rowIndex][2] * parseFloat(String(data[rowIndex][3]).replace(/[$,]/g, ''));

          batchChanges.push([rowIndex, 4,  String(formatMoney(result))]);
        }

        if (colIndex === 0 && position != null && orderNumber.trim() !== '') {
          changesByRow.set(rowIndex, newValue?.toString().trim());
        }
      }

      if (batchChanges.length > 0) {
        hot.batch(() => {
          batchChanges.forEach(([row, col, value]) => {
            hot.setDataAtCell(row, col, value);
          });
        });
      }

      for (const [row, cellValue] of changesByRow.entries()) {
        promises.push((async () => {
          try {
            const pos = data[row][0];
            const records = await getRecord(orderNumber,pos)


            if (Number(records.item) === Number(pos)) {
              const { material_code, unit_price, total_quantity, pending_quantity, approved_quantity } = records;

              let hola = "";

              if(invoi){
                const invoice = await selectSingleInvoice(invoi);
                hola = invoice.state
              }
              if ((parseFloat(approved_quantity) < parseFloat(total_quantity)) || hola === "approved"  ) {
                const materialDetails = await getMaterial(material_code);
                const subheading = materialDetails?.subheading || '';

                batchChanges.push([row, 1, material_code]);
                if (subheading) {
                  
                  batchChanges.push([row, 5, "**********"]);
                  setRowsWithAutoSequence((prevSet) => new Set(prevSet).add(row));
                } else {
                  
                  batchChanges.push([row, 5, subheading]);

                  // Eliminar la fila del Set si la secuencia se borra
                  setRowsWithAutoSequence((prevSet) => {
                    const newSet = new Set(prevSet);
                    newSet.delete(row);
                    return newSet;
                  });
                }

                if (sharedState.TRM) {
                  batchChanges.push([row, 3, String(formatMoney(unit_price/100))]);
                } else if (!sharedState.TRM && (parseFloat(sharedState.TRMCOP) !== 0 && String(sharedState.TRMCOP) !== "")) {
                  batchChanges.push([row, 3, String(formatMoney((unit_price/100) * sharedState.TRMCOP))]);
                } else {
                  batchChanges.push([row, 3, ""]);
                  batchChanges.push([row, 4, ""]);
                }

                setfactunitprice(unit_price);
                setfacttotalvalue(cellValue * unit_price);
              }
            } else {
              console.warn(`No matching record found for row ${row}`);
            }
          } catch (error) {
            console.error(`Error processing records for row ${row}:`, error);
          }
        })());
      }

      await Promise.all(promises);

      if (batchChanges.length > 0) {
        hot.batch(() => {
          batchChanges.forEach(([row, col, value]) => {
            hot.setDataAtCell(row, col, value);
          });
        });
      }
    }
  }, 300)} 




  contextMenu={{
    items: {
      'copy': { name: 'Copiar' },
      'cut': { name: 'Cortar' },
      'undo': { name: 'Deshacer' },
      'redo': { name: 'Rehacer' },
      'separator': Handsontable.plugins.ContextMenu.SEPARATOR,
    }
  }}
/>
</Box>
{(isTable === "Create" || isActive === true) && (
       <Button mt={1} bgColor="#F1D803" colorScheme="steal" textColor="black" height="5%" onClick={(isTable !== "Create")? UpdateData : handleSubmit} >{(isTable !== "Create")? "Reenviar" : "Asociar"}</Button>
     )}
       </>
     
     )}
    </div>
  );
}