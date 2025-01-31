'use client'
import ExcelJS from 'exceljs';
import { useState, useCallback, useEffect, useRef } from "react";
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import Handsontable from 'handsontable';
import {
  List,
  ListItem,
  ListIcon, Menu, MenuButton, MenuList, MenuItem,
  GridItem, Grid, Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure, Tooltip, Box, Input, Flex, HStack, Button, Icon, Select, useToast, Switch, VStack, Text, Alert, Progress, Spinner, useMediaQuery
} from '@chakra-ui/react';
import { FaCloudArrowUp } from "react-icons/fa6";
import { getMaterial, getRecords, getMaterials, getSuppliers, getSupplier, getRecord } from '@/app/_lib/database/service';
import { selectByPurchaseOrder } from '../_lib/database/base_bills';
import { AddIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { insertBills, selectBills } from '../_lib/database/base_bills';
import { insertMaterial, selectMaterials, selectSingleMaterial, updateMaterial } from '../_lib/database/materials';
import { insertSupplier, selectSingleSupplier, selectSuppliers } from '../_lib/database/suppliers';
import { FaEdit } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import { SiGoogleforms } from "react-icons/si";
import { FaWpforms } from "react-icons/fa6";


// Simulamos una función para obtener datos de una base de datos
async function fetchDataFromDatabase() {
  // Esta sería la llamada a tu API o base de datos real
  const response = await selectSuppliers({ limit: 1000, page: 1 });

  return response.map(item => ({
    id: item.supplier_id,
    name: item.name // Asume que el campo 'name' es uno de los elementos
  }));
}

const initialData = {
  Materiales: Array(20).fill().map(() => ['', '', '', '']),
  Proveedores: Array(20).fill().map(() => ['', '', '']),
  Registros: Array(20).fill().map(() => ['', '', '', '', '', '', '', '', '', '']),
};

const headers = {
  Materiales: ["Codigo de Material", "Subpartida", "Tipo de Material", "Unidad de Medidad"],
  Proveedores: ["Dominio", "Nombre"],
  Registros: ["Documento compras", "Posición", "Material", "Texto breve", "Cantidad de pedido", "Unidad medida pedido", "Precio neto", "Valor neto de pedido", "Nombre del proveedor", "Moneda"],
};

export const ImportDataBase = () => {


  function normalizeNumber(input) {
    // Remover cualquier símbolo de moneda como $ o €
    const sanitizedInput = input.replace(/[$€]/g, '');
  
    // Remover separadores de miles (puntos o comas antes de grupos de tres dígitos)
    const removeThousandsSeparators = sanitizedInput.replace(/(?<=\d)[.,](?=\d{3})/g, '');
  
    // Reemplazar la última coma por un punto para normalizar los decimales
    const normalizedNumber = removeThousandsSeparators.replace(/,/, '.');
  
    // Convertir a número flotante
    let parsedNumber = parseFloat(normalizedNumber);
  
    // Verificar si es un número válido
    if (!isNaN(parsedNumber)) {
      // Redondear a dos decimales si tiene parte decimal, o dejarlo como entero si no tiene decimales
      parsedNumber = parsedNumber.toFixed(parsedNumber % 1 === 0 ? 0 : 2);
    }
  
    return parsedNumber;
  }
  

  const [isLoading, setisloading] = useState(false);
  const [data, setData] = useState(initialData.records);
  const [excelData, setExcelData] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(headers.Registros);
  const [selectedTable, setSelectedTable] = useState('Registros');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workbook, setWorkbook] = useState(null);
  const [showDatabaseData, setShowDatabaseData] = useState(true);
  const toast = useToast();
  const [Buttons, setButtons] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpen2, onOpen: onOpen2, onClose: onClose2 } = useDisclosure();
  const [originalData, setOriginalData] = useState({});
  const [formData, setFormData] = useState({});
  const [iSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [iMediumScreen] = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
  const [iLargeScreen] = useMediaQuery("(min-width: 1024px)");

  const handleChange = (e) => {
    const { name, value } = e.target;

  // Actualizamos el estado con el nuevo valor del input
  setFormData((prevData) => ({
    ...prevData,
    [name]: value,
  }));

  // Si los inputs de Cantidad de Pedido y Precio Neto son números válidos, calculamos el resultado
  if (name === 'input5' || name === 'input7') {
    const cantidad = parseFloat(name === 'input5' ? value : formData.input5);
    const precio = parseFloat(name === 'input7' ? value : formData.input7);

    if (!isNaN(cantidad) && !isNaN(precio)) {
      setFormData((prevData) => ({
        ...prevData,
        input8: (cantidad * precio).toFixed(2), // Calcula y actualiza el valor neto
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        input8: '', // Borra el valor si no son números válidos
      }));
    }
  }
  };


  useEffect(() => {
    if (isOpen2) {
      // Restablecer los campos del formulario cuando se abra el modal
      setFormDataa({
        input1: '',
        input2: '',
        select2: '',
        input3: '',
      });
      setOriginalData({});
    }
  }, [isOpen2]);
  const handleChangee = (e) => {
    setFormDataa({
      ...formDataa,
      [e.target.name]: e.target.value,
    });
  };

  const [formDataa, setFormDataa] = useState({
    input1: '',
    input2: '',
    select2: '',
    input3: '',
  });


  const fetchMaterialData = async () => {
    try {
      // Simulación de búsqueda de datos con el primer input (Código de Material)
      const data = await selectSingleMaterial(formDataa.input1); // Implementa esta función para traer los datos
      if (data) {
        setOriginalData(data);
        setFormDataa({
          input1: data.material_code,
          input2: data.subheading,
          select2: data.type,
          input3: data.measurement_unit,
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se encontraron datos para este código de material',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const handleSubmitt = async () => {
    // Validación
    if (!formDataa.input1 || !formDataa.input2 || !formDataa.select2 || !formDataa.input3) {
      return toast({
        title: 'Error',
        description: 'Todos los campos deben estar completos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    if (formDataa.input2.length !== 10) {
      return toast({
        title: 'Error',
        description: 'La subpartida debe tener exactamente 10 caracteres.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    // Compara datos originales y actualizados
    const updatedData = {};

    // Solo agrega los campos que hayan cambiado
    if (formDataa.select2 !== originalData.type) {
      updatedData.type = formDataa.select2;
    }
    if (formDataa.input2 !== originalData.subheading) {
      updatedData.subheading = formDataa.input2;
    }
    if (formDataa.input3 !== originalData.measurement_unit) {
      updatedData.measurement_unit = formDataa.input3;
    }

    try {
      const response = await updateMaterial({target: formDataa.input1, data: updatedData}); // Implementa esta función
      if (!response) {
        toast({
          title: 'Éxito',
          description: 'Datos actualizados correctamente.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose2();
        fetchData()
      } else {
        toast({
          title: 'Error',
          description: 'Hubo un problema al actualizar los datos.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error updating data", error);
    }
  };



  const validateFields = () => {
    let requiredFields = [];

    if (selectedTable === "Registros") {
      requiredFields = [
        "input1", "input2", "input3", "input4", "input5", "input6", "input7", "input8", "select1"
      ];

      // Validar que el input del proveedor tenga algún valor
      if (!inputValue.trim() && !selectedId) {
        requiredFields.push("inputProvider"); 
      }
    } else if (selectedTable === "Materiales") {
      requiredFields = ["input1", "input2", "select2", "input3"];
    } else if (selectedTable === "Proveedores") {
      requiredFields = ["inputObligatorio"];
    }

    return requiredFields.every(field => formData[field] && formData[field].trim() !== "");
  };



  const handleSubmit = () => {
    if (!validateFields()) {
      toast({
        title: "Error",
        description: "Por favor llena todos los campos obligatorios antes de enviar.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if(selectedTable === "Materiales"){
      if(formData.input2.length !== 10){
        toast({
          title: "Error",
          description: "La subpartida debe tener 10 caracteres",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    setIsConfirming(true);
  };

  const confirmSubmit = async () => {
    let dataToSubmit = {};

    if (selectedTable === "Registros") {
      let supplier
      if(selectedId !== 0){
        supplier = selectedId
      }else{
        const insert = await insertSupplier({name: inputValue})
        supplier = insert[0].supplier_id
        
      }
      dataToSubmit = {
        purchase_order: formData.input1, // Orden de Compra
        item: formData.input2,           // Item
        material_code: formData.input3,   // Codigo de Material
        description: formData.input4,
        approved_quantity: 0, 
        pending_quantity: 0,     
        total_quantity: formData.input5,   // Cantidad de Pedido
        measurement_unit: formData.input6, // Unidad de Medida
        unit_price: (formData.input7*100),        // Precio Neto
        net_price: (formData.input8*100),   // Valor Neto de pedido
        currency: formData.select1,       // Moneda
        supplier_id: supplier , // Proveedor: usar uno u otro
      };
      const data = await getRecord(dataToSubmit.purchase_order,dataToSubmit.item)
      if(data.base_bill_id !== undefined){
        toast({
          title: "Error",
          description: "Este Registro ya existe, intente con otro diferente",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return
      }else{
        await handleDatabaseInsert(insertBills, dataToSubmit, "Registros");
      }

    } else if (selectedTable === "Materiales") {
      dataToSubmit = {
        material_code: formData.input1,       // Codigo de Material
        subheading: formData.input2,         // Subpartida
        type: formData.select2,      // Tipo de Material
        measurement_unit: formData.input3,    // Unidad de Medida
      };
      const data = await getMaterial(dataToSubmit.material_code)
      if(data.material_code !== undefined){
        toast({
          title: "Error",
          description: "Este Material ya existe, intente con otro diferente",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return
      }else{
        await handleDatabaseInsert(insertMaterial, dataToSubmit, "Materiales");
      }

    } else if (selectedTable === "Proveedores") {
      dataToSubmit = {
        name: formData.inputObligatorio,  // Nombre de Proveedor
        domain: formData.inputOpcional || "",      // Dominio 
      };

      const data = await getSupplier("","",dataToSubmit.name)
      if(data.name !== undefined){
        toast({
          title: "Error",
          description: "Este Proveedor ya existe, intente con otro diferente",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return
      }else{
        await handleDatabaseInsert(insertSupplier, dataToSubmit, "Proveedores");
      }

      
    }

    setIsConfirming(false);
    onClose();
  };


  const handleDatabaseInsert = async (insertFunction, data, modalName) => {
    try {
      await insertFunction(data);
      toast({
        title: "Formulario enviado",
        description: `El formulario del ${modalName} se ha enviado correctamente.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar los datos. Inténtalo de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Guardar el id seleccionado
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [dataa, setDataa] = useState([]); // Almacena los datos cargados desde la base de datos
  const dropdownRef = useRef(); // Referencia para el dropdown


  useEffect(() => {
      setInputValue("") 
  },[onOpen])
  // Cargar datos desde la base de datos
  useEffect(() => {
    async function loadData() {
      const loadedData = await fetchDataFromDatabase(); // Llama a la función que carga los datos
      setDataa(loadedData); // Guardamos solo los 'id' y 'name'
      setFilteredOptions(loadedData); // Inicialmente todas las opciones son visibles
    }
    loadData();
  }, []); // Se ejecuta solo cuando el componente se monta

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value) {
      // Filtrar las opciones por el nombre según el texto escrito
      const filtered = dataa.filter(option =>
        option.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setDropdownVisible(true);

      // Verificar si hay coincidencias y actualizar selectedId
      if (filtered.length === 0) {
        setSelectedId(0); // No hay coincidencias, establecer selectedId a 0
      } else {
        setSelectedId(null); // Hay coincidencias, no establecer selectedId
      }
    } else {
      setDropdownVisible(false);
      setSelectedId(0); // Si el input está vacío, establecer selectedId a 0
    }
  };

  const handleSelectOption = (option) => {
    setInputValue(option.name); // Muestra el nombre en el input
    setSelectedId(option.id); // Guarda el id del nombre seleccionado
    setDropdownVisible(false); // Oculta el dropdown al seleccionar
  };

  const handleBlur = (e) => {
    // Cerrar el dropdown solo si se hace clic fuera de la lista
    setTimeout(() => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
        setDropdownVisible(false);
      }
    }, 100); // Retraso para asegurar que el clic se procese
  };

  const renderModalContent = () => {
    switch (selectedTable) {
      case "Registros":
        return (
          <>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Orden de Compra</FormLabel>
                  <Input bgColor="white" name="input1" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Item</FormLabel>
                  <Input bgColor="white" name="input2" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Codigo de Material</FormLabel>
                  <Input bgColor="white" name="input3" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Texto Breve</FormLabel>
                  <Input bgColor="white" name="input4" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Cantidad de Pedido</FormLabel>
                  
                  <Input bgColor="white" name="input5" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Unidad de Medida</FormLabel>
                  <Input bgColor="white" name="input6" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Precio Neto</FormLabel>
                  <Input bgColor="white" name="input7" onChange={handleChange} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Valor Neto de pedido</FormLabel>
                  <Input bgColor="white" name="input8" value={formData.input8} readOnly />
                </FormControl>
              </GridItem>
            </Grid>
            <FormControl isRequired mt={4}>
              <FormLabel>Proveedor</FormLabel>
              <Input
                name="inputProvider" // Añadir un nombre al input
                value={inputValue}
                onChange={(e) => {
                  handleInputChange(e); // Actualiza inputValue en el estado
                  setFormData({
                    ...formData,
                    inputProvider: e.target.value, // Actualiza formData con el valor del input
                  });
                }}
                onBlur={handleBlur} // Llama a handleBlur cuando se pierde el foco
                placeholder=""
                bgColor="white"
              />
              {isDropdownVisible && filteredOptions.length > 0 && (
                <List
                  ref={dropdownRef} // Añadimos la referencia aquí
                  position="absolute"
                  zIndex="1000"
                  bg="white"
                  border="1px solid gray"
                  borderRadius="md"
                  mt="2"
                  width="100%"
                  maxHeight="120px" // Máxima altura para mostrar 3 opciones
                  overflowY="auto" // Habilitar scroll si hay más de 3 opciones
                >
                  {filteredOptions.slice(0, 3).map((option) => ( // Mostrar solo 3
                    <ListItem
                      key={option.id} // Cambia a usar el id como clave única
                      padding="8px"
                      _hover={{ bg: "gray.100", cursor: "pointer" }}
                      onClick={() => handleSelectOption(option)} // Al hacer clic, selecciona la opción
                    >
                      {option.name}
                    </ListItem>
                  ))}
                </List>
              )}
            </FormControl>
            <FormControl isRequired mt={4}>
              <FormLabel>Moneda</FormLabel>
              <Select bgColor="white" name="select1" placeholder='Selecciones un tipo de moneda' onChange={handleChange} >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </FormControl>
          </>
        );

      case "Materiales":
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Codigo de Material</FormLabel>
              <Input bgColor="white" name="input1" onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Subpartida</FormLabel>
              <Input bgColor="white" name="input2" onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tipo de Material</FormLabel>
              <Select bgColor="white" name="select2" onChange={handleChange} placeholder="Selecciona una opción">
                <option value="national">NACIONAL</option>
                <option value="foreign">EXTRANJERO</option>
                <option value="nationaliced">NACIONALIZADO</option>
                <option value="other">OTRO</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Unidad de Medidad</FormLabel>
              <Input bgColor="white" name="input3" onChange={handleChange} />
            </FormControl>
          </>
        );

      case "Proveedores":
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Nombre de Proveedor</FormLabel>
              <Input bgColor="white" name="inputObligatorio" onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Dominio (opcional)</FormLabel>
              <Input bgColor="white" name="inputOpcional" onChange={handleChange} />
            </FormControl>
          </>
        );

      default:
        return null;
    }
  };



  const handleTableChange = useCallback((event) => {
    setFile(null);
    const table = event.target.value;
    setSelectedTable(table);
    setData(initialData[table]);
    setTableHeaders(headers[table]);

    setWorkbook(null);
    setData(initialData[table]);
    setShowDatabaseData(true);
  }, []);


 

  const handleDownload = () => {

    let fileUrl = "";
    let fileName = "";

    if (selectedTable === "Registros") {
      fileUrl = "https://dl.dropboxusercontent.com/scl/fi/w5c6av2x637mgo2uoaqg8/Plantilla-Records.XLSX?rlkey=v5v4vdfdclppqh7pv1bati8fj&st=8d4svjqp&dl=0";
      fileName = "Plantilla Records.xlsx";
    } else if (selectedTable === "Proveedores") {
      fileUrl = "https://dl.dropboxusercontent.com/scl/fi/zlzt3l4jy43c28rqiqpkd/Plantilla-Proveedores.XLSX?rlkey=m6nty56oebtt5w8ps84gdyis0&st=bhnikt5v&dl=0";

    } else if (selectedTable === "Materiales") {
      fileUrl = "https://dl.dropboxusercontent.com/scl/fi/bfsa5jc7xtz6r3jclkqrv/Plantilla-Material.XLSX?rlkey=2d81cpqez3bszqxjubatk5q71&st=h2w75xnf&dl=0";
      fileName = "Plantilla Materiales.xlsx";
    }



    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        saveAs(blob, fileName);
      })
      .catch((error) => console.error("Error al descargar el archivo:", error));
  };

  const [file, setFile] = useState(null);


  const handleFileUpload = async (event) => {
    setFile(event.target.files[0] || null);
    let file = event.target.files[0];
    if (!file) return

    
    if (file) {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file);
        setWorkbook(workbook);

        const worksheet = workbook.worksheets[0];

        const firstRow = worksheet.getRow(1); // Obtiene la fila de encabezados

        // Verifica que todos los encabezados esperados estén presentes
        const expectedHeaders = headers[selectedTable]; // Encabezados esperados
        const fileHeaders = firstRow.values.slice(1); // Valores de la primera fila (ignorando el índice 0)
    
        const headersValid = expectedHeaders.every(header => fileHeaders.includes(header));
    
        if (!headersValid) {
          // Limpia el input
          event.target.value = ''; 
          toast({
            title: "Error",
            description: "Formato de archvio incorrecto, porfavor reviselo y vuelva a intentar",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        const columnIndexes = {};

        worksheet.getRow(1).eachCell((cell, colNumber) => {
          if (headers[selectedTable].includes(cell.value)) {
            columnIndexes[cell.value] = colNumber;
          }
        });

        const rows = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1) {
            const rowData = headers[selectedTable].map(header => row.getCell(columnIndexes[header])?.value || '');
            rows.push(rowData);
          }
        });

        setExcelData(rows);
        setData(rows);
        setShowDatabaseData(false);
      } catch (error) {
        console.error('Error reading Excel file:', error);
      }
    }
  };

  const [groupedBillsArray1, IsgroupedBillsArray1] = useState([])
  const [showModal, setShowModal] = useState(false); 
  const [Cancelar, setCancelar] = useState(false);
  const cancelarRef = useRef(Cancelar);
  
  useEffect(() => {
    cancelarRef.current = Cancelar; 
  }, [Cancelar]);
  const validateAndInsertData = async () => {
    setIsProcessing(true);
    setProgress(0)
    let totalTasks = data.length;
    let completedTasks = 0;
    const updateThreshold = Math.ceil(totalTasks / 10);
    let existingRecords = [];
    let existingMaterials = [];
    let existingSuppliers = [];
    let invalidmaterials = []
    let invalidbills = []
    let invalidsuppliers = []
    let cont1 = 0;
    let cont2 = 0;

    try {
      switch (selectedTable) {
        case 'Registros':
          existingRecords = await getRecords(1, 30000);
          break;
        case 'Materiales':
          existingMaterials = await getMaterials(1, 40000);
          break;
        case 'Proveedores':
          existingSuppliers = await getSuppliers(1, 1000);
          break;
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }

    const invalidMaterialEntries = [];
    const invalidSupplierEntries = [];
    const recordsToInsert = [];
    const materialsToInsert = [];
    const suppliersToInsert = [];

    for (const row of data) {
      const args = {};
      if (cancelarRef.current) { 
        const userConfirmed = window.confirm('¿Estás seguro que quieres cancelar el proceso?');
        if (userConfirmed) {
          setCancelar(false);  
          toast({
            title: "Proceso cancelado",
            description: `Subida de datos cancelada con éxito`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          setIsProcessing(false);
          return; 
        } else {
          setCancelar(false);  
        }
      }
      if (selectedTable === "Registros") {

        const [
          purchase_order,
          position,
          material_code,
          description,
          quantity,
          measurement_unit,
          unit_price,
          net_price,
          supplier_name,
          currency
        ] = row;


        if (
          !purchase_order ||
          !position ||
          !material_code ||
          !description ||
          !quantity ||
          !measurement_unit ||
          !unit_price ||
          !net_price ||
          !supplier_name ||
          !currency
        ) {
          invalidbills.push({
            purchase_order: purchase_order,
            item: position
          })
          completedTasks += 1;
          continue
        }

        const existingRecord = existingRecords.find(record => record.purchase_order === purchase_order && record.item === position);
        let supplierId;

        if (!existingRecord) {
          const domainExists = await getSupplier("", "", supplier_name);
          if (domainExists.name !== supplier_name) {
            const newSupplier = await insertSupplier({ name: supplier_name });
            const domain = await getSupplier("", "", supplier_name);
            supplierId = domain.supplier_id;
          } else {
            supplierId = domainExists.supplier_id;
          }
          
          const unitPriceParsed = parseFloat((parseFloat(parseFloat(normalizeNumber(String(unit_price)))).toFixed(2) * 100).toFixed(0));
          
          if (unitPriceParsed && !isNaN(unitPriceParsed)) {
            recordsToInsert.push({
              item: parseInt(normalizeNumber(String(position))),
              approved_quantity: 0,
              total_quantity: parseFloat(normalizeNumber(String(quantity))),
              pending_quantity: 0,
              material_code: String(material_code),
              purchase_order: String(purchase_order),
              measurement_unit: measurement_unit,
              unit_price: parseInt((unitPriceParsed)),
              currency: String(currency),
              created_at: new Date().toISOString(),
              supplier_id: parseInt(supplierId),
              description: String(description),
              net_price: parseInt(parseFloat((parseFloat(parseFloat(normalizeNumber(String(net_price))) * 100).toFixed(0)))),
            });
          } else {
            
          }
        }
        completedTasks += 1;


        if (completedTasks % updateThreshold === 0 || completedTasks === totalTasks) {
          const progress = (completedTasks / totalTasks) * 100;
          setProgress(progress);
        }
      } else if (selectedTable === "Materiales") {

       
        const [material_code, subheading, type, measurement_unit] = row;
        if(!material_code){
          invalidmaterials.push({
            material_code: "VACIO",
            subheading: subheading,
            types: (type  ? String(type) : "VACIO"),
            measurement_unit: (measurement_unit ? measurement_unit : "VACIO")
          })
          completedTasks += 1;
          continue;
        }

        const normalizedMaterialCode = String(material_code).trim().toLowerCase();

const existingmaterial = materialsToInsert.find(
  record => String(record.material_code).trim().toLowerCase() === normalizedMaterialCode
);


if (existingmaterial) {
  cont1 = cont1 + 1;
  completedTasks += 1;
  continue;
}

        const materialArgs = { material_code: material_code };

        if (subheading) {
          if (String(subheading).length === 10) {
            materialArgs.subheading = String(subheading);
          } 
        }

        const typeMapping = {
          "national": "national",
          "NATIONAL": "national",
          "foreign": "foreign",
          "FOREIGN": "foreign",
          "nationalized": "nationalized",
          "NATIONALIZED": "nationalized",
          "other": "other",
          "OTHER": "other",
          "NACIONAL": "national",
          "nacional": "national",
          "EXTRANJERO": "foreign",
          "extranjero": "foreign",
          "NACIONALIZADO": "nationalized",
          "nacionalizado": "nationalized",
          "OTRO": "other",
          "otro": "other",
        };
        

        if (typeMapping[type]) {
          materialArgs.type = typeMapping[type]
        }

        if (measurement_unit) materialArgs.measurement_unit = measurement_unit;

        const revisar = await getMaterial(material_code)
        if (revisar.material_code === material_code) {
          const updateNeeded = revisar.type !== materialArgs.type || revisar.measurement_unit !== materialArgs.measurement_unit;
          if (updateNeeded) {
            //poner que suscede al actualizar
          }
         
        } else {
          materialsToInsert.push(materialArgs);
        }
        completedTasks += 1;


        if (completedTasks % updateThreshold === 0 || completedTasks === totalTasks) {
          const progress = (completedTasks / totalTasks) * 100;
          setProgress(progress);
        }
      } else if (selectedTable === "Proveedores") {

        const [domain, name] = row;
        if(!name){
          invalidsuppliers.push({
            domain: (domain ? domain : "VACIO"),
            name: "VACIO"
          })
        }
        const exist = await getSupplier("","",name)
        if(exist.name !== undefined){
          //si se reptite
          completedTasks += 1;
          continue
        }

        suppliersToInsert.push({ domain, name });
        completedTasks += 1;


        if (completedTasks % updateThreshold === 0 || completedTasks === totalTasks) {
          const progress = (completedTasks / totalTasks) * 100;
          setProgress(progress);
        }
      }
    }

    if(selectedTable === "Registros"){
      const chunkArray = (array, chunkSize) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      };
      
   
      const MAX_BATCH_SIZE = 10000;
      
  
      const recordsChunks = chunkArray(recordsToInsert, MAX_BATCH_SIZE);
      
      for (const chunk of recordsChunks) {
        try {
          // Insertar cada bloque de registros
          await insertBills(chunk);
      
          console.log(`Se insertaron ${chunk.length} registros correctamente.`);
        } catch (error) {
          console.error('Error al insertar el bloque de registros:', error);
        }
      }
    }else if(selectedTable === "Materiales"){
      const chunkArray = (array, chunkSize) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      };
      
   
      const MAX_BATCH_SIZE = 10000;
      

      const recordsChunks = chunkArray(materialsToInsert, MAX_BATCH_SIZE);
      
      for (const chunk of recordsChunks) {
        try {
    
          await insertMaterial(chunk);
      
          console.log(`Se insertaron ${chunk.length} registros correctamente.`);
        } catch (error) {
          console.error('Error al insertar el bloque de registros:', error);
        }
      }
    }

    await Promise.all([
      insertSupplier(suppliersToInsert),
    ]);


    /*if (invalidMaterialEntries.length > 0) {
      const groupedErrors = groupConsecutiveNumbers(invalidMaterialEntries);
      const errorMessage = `Material code not found at rows ${groupedErrors.join(', ')}`;
      toast({ title: 'Validation Errors', description: errorMessage, status: 'error', position: 'top', isClosable: true, duration: 10000 });
    }*/

      if (invalidbills.length > 0 || invalidmaterials.length > 0 || invalidsuppliers.length > 0) {
        const groupInvalid = (invalid) => {
          return invalid.reduce((acc, data) => {
 
            if (invalidbills.length > 0) {
              acc.push([data.purchase_order, data.item, "Bills"]);
            }
  
            else if (invalidmaterials.length > 0) {
              acc.push([data.material_code, data.subheading, data.type, data.measurement_unit, "Material"]);
            }

            else if (invalidsuppliers.length > 0) {
              acc.push([data.domain, data.name, "Suppliers"]);
            }
            return acc;
          }, []);
        };
      
 
        const groupedArray = groupInvalid(
          invalidbills.length > 0 ? invalidbills :
          invalidmaterials.length > 0 ? invalidmaterials :
          invalidsuppliers
        );
      

        IsgroupedBillsArray1(groupedArray);
        setShowModal(true);
      }

     

      
      

    setIsProcessing(false);
    toast({ title: "Formulario enviado", description: `El formulario del ${selectedTable} se ha enviado correctamente.`, status: "success", duration: 3000, isClosable: true });
  };


 

 




  const fetchData = async () => {
    setisloading(true)
    try {
      if (selectedTable === 'Registros') {
        let filter = {};
        if(Datafilter){
          filter = {limit: 200, page: 1, equals: {purchase_order: Datafilter}, orderBy: {column: "item" }}
        }else{
          filter = {limit: 200, page: 1}
        }
        const records = await selectBills(filter);
        console.log(records)
        if (records) {
          const supplierIds = [...new Set(records.map(record => record.supplier_id))];


          const suppliers = await Promise.all(supplierIds.map(id => selectSingleSupplier(id)));


          const supplierMap = suppliers.reduce((acc, supplier) => {
            acc[supplier.supplier_id] = supplier.name;
            return acc;
          }, {});

          const formattedRecords = records.map(record => [


            record.purchase_order,
            record.item,
            record.material_code,
            record.description,
            record.total_quantity,
            record.measurement_unit,
            (record.unit_price/100),
            (record.net_price/100),
            supplierMap[record.supplier_id] || '',
            record.currency
          ]);

          setData(formattedRecords);
        }
      } else if (selectedTable === 'Materiales') {
        let filter = {};
        if(Datafilter){
          filter = {limit: 50, page: 1, equals: {material_code: Datafilter}}
        }else{
          filter = {limit: 50, page: 1}
        }
        const materials = await selectMaterials(filter);

        if (materials) {
          setData(materials.map(material => [
            material.material_code,
            material.subheading,
            material.type,
            material.measurement_unit
          ]));
        }
      } else if (selectedTable === 'Proveedores') {
        let filter = {};
        if(Datafilter){
          filter = {page: 1, limit: 50, search: Datafilter}
        }else{
          filter = {page: 1, limit: 50}
        }
        
        const suppliers = await selectSuppliers(filter);
        if (suppliers) {
          setData(suppliers.map(suppliers => [
            suppliers.domain,
            suppliers.name
          ]));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setisloading(false)
    }
  };


  useEffect(() => {
    if(Datafilter){
      setDatafilter("")
    }
    fetchData();
  }, [selectedTable]);

  const handleSwitchChange = (event) => {
    const checked = event.target.checked;
    setShowDatabaseData(!checked);
    setEnabled(checked)
    if (!checked && workbook) {
      fetchData();
    } else if (checked) {
      setData(excelData);
    }
  };
  const [Enabled, setEnabled] = useState(true)
  useEffect(() => {
    setEnabled(!Enabled)
  }, [file])

const [Datafilter,setDatafilter] = useState()
  useEffect(() => {


          if(Datafilter){
            fetchData()
          }else if(Datafilter === ""){
            fetchData()
          }

  },[Datafilter])

  const SearchFilter = (e) => {
    setDatafilter(e.target.value)
  }

const vamosaver = () => {
  console.log("Detectamos cambio")
  setCancelar(true)
}
 
  return (
    <>
      <Box >
        <HStack whiteSpace="100%"  >
          <Select isDisabled={isProcessing} width={iSmallScreen ? "50%" : iMediumScreen ? "40%" : "30%"} onChange={handleTableChange} defaultValue="Registros">
            <option onClick={() => setButtons(true)} value="Registros">Registros</option>
            <option onClick={() => setButtons(false)} value="Materiales">Materiales</option>
            <option onClick={() => setButtons(false)} value="Proveedores">Proveedores</option>
          </Select>
          <VStack width={iSmallScreen ? "10%" : iMediumScreen ? "20%" : "30%"}></VStack>
          {!iSmallScreen && (
            <>
            {Buttons && <Input isDisabled={isProcessing} width="50%" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />}
            <Tooltip label="Subir archivo" fontSize="md">
            <Button
              isDisabled={!Enabled}
              colorScheme='teal'
              backgroundColor='#F1D803'
              onClick={validateAndInsertData}
              isLoading={isProcessing}
            >
              <Icon as={FaCloudArrowUp} w={5} h={5} color="black" />
            </Button>
          </Tooltip>
          {isProcessing && (
            <Tooltip label="Cancelar" fontSize="md">
            <Button
              colorScheme='teal'
              backgroundColor="red"
              onClick={vamosaver}
            >
              <CloseIcon color="white" w={5} h={5}/>
            </Button>
          </Tooltip>
          )}
          <Tooltip label="Descargar plantilla" fontSize="md">
            <Button

              colorScheme='teal'
              backgroundColor='#F1D803'
              onClick={handleDownload}

            >
              <Icon as={FaWpforms} w={5} h={5} color="black" />
            </Button>
          </Tooltip>
            </>
          )}
          
          <Tooltip label="Agregar " fontSize="md">
            <Button

              colorScheme='teal'
              backgroundColor='#F1D803'
              onClick={onOpen}

            >
              <Icon as={AddIcon} w={5} h={5} color="black" />
            </Button>
          </Tooltip>
          {(selectedTable === "Materiales") && (
            <Tooltip label="Editar" fontSize="md">
            <Button

              colorScheme='teal'
              backgroundColor='#F1D803'
              onClick={onOpen2}

            >
              <Icon as={EditIcon} w={5} h={5} color="black" />
            </Button>
          </Tooltip>
          )}
          {!iSmallScreen && (
            <>
            <VStack width="35%"></VStack>
            {Buttons && <Text>Preview</Text>}
            <Switch
              isChecked={!showDatabaseData}
              onChange={handleSwitchChange}
              isDisabled={!workbook || isProcessing}
            >
            </Switch>
            </>
          )}
        </HStack>
        {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
    <div className="bg-white p-4 w-5/6 max-w-md border text-center border-gray-300 rounded-3xl shadow-md relative z-20">
      <h2 className="text-xl font-bold mb-4">Solicitudes que fallaron</h2>
      
      {/* Mostrar el título dependiendo del tipo de datos */}
      {groupedBillsArray1.length > 0 && groupedBillsArray1[0][2] === "Bills" && (
        <>
          <p className="font-bold mb-2">Registros</p>
          <Box maxH="230px" overflowY="auto" p="2" border="1px solid #ddd" borderRadius="md">
            <VStack spacing={3} align="stretch">
              {groupedBillsArray1.map(([purchase_order, item], index) => (
                <Box key={index} border="1px solid #ccc" borderRadius="md" padding="2" backgroundColor="gray.100">
                  <HStack spacing={5}>
                    <p><strong>OC:</strong> {purchase_order}</p>
                    <p><strong>ITEM:</strong> {item}</p>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        </>
      )}

      {/* Mostrar el título y registros para "Material" */}
      {groupedBillsArray1.length > 0 && groupedBillsArray1[0][4] === "Material" && (
        <>
          <p className="font-bold mb-2">Materiales</p>
          <Box maxH="230px" overflowY="auto" p="2" border="1px solid #ddd" borderRadius="md">
            <VStack spacing={3} align="stretch">
              {groupedBillsArray1.map(([material_code, subheading, type, measurement_unit], index) => (
                <Box key={index} border="1px solid #ccc" borderRadius="md" padding="2" backgroundColor="gray.100">
                  <HStack spacing={5}>
                    <p><strong>CODIGO:</strong> {material_code}</p>
                    <p><strong>PA:</strong> {subheading}</p>
                    <p><strong>TIPO:</strong> {type}</p>
                    <p><strong>UC:</strong> {measurement_unit}</p>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        </>
      )}

      {/* Mostrar el título y registros para "Suppliers" */}
      {groupedBillsArray1.length > 0 && groupedBillsArray1[0][2] === "Suppliers" && (
        <>
          <p className="font-bold mb-2">Proveedores</p>
          <Box maxH="230px" overflowY="auto" p="2" border="1px solid #ddd" borderRadius="md">
            <VStack spacing={3} align="stretch">
              {groupedBillsArray1.map(([domain, name], index) => (
                <Box key={index} border="1px solid #ccc" borderRadius="md" padding="2" backgroundColor="gray.100">
                  <HStack spacing={5}>
                    <p><strong>Dominio:</strong> {domain}</p>
                    <p><strong>Proveedor:</strong> {name}</p>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        </>
      )}

      <p className="mt-4 font-bold">Registros fallidos: {groupedBillsArray1.length}</p>
      <HStack mt={4} justify="center" align="center" spacing={4}>
        <Button onClick={() => setShowModal(false)} textColor="black" bgColor="#F1D803" colorScheme="teal" className="px-4 py-2 rounded">
          Aceptar
        </Button>
      </HStack>
    </div>
  </div>
)}
        <Modal isOpen={isOpen2} onClose={onClose2}>
      <ModalOverlay />
      <ModalContent bgColor="gray.200">
        <ModalHeader>Actualizar Material</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Código de Material</FormLabel>
            <HStack>
            <Input
              bgColor="white"
              name="input1"
              value={formDataa.input1}
              onChange={handleChangee}
            />
            <Button onClick={fetchMaterialData}>Buscar</Button>
            </HStack>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Subpartida</FormLabel>
            <Input
              bgColor="white"
              name="input2"
              value={formDataa.input2}
              onChange={handleChangee}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Tipo de Material</FormLabel>
            <Select
              bgColor="white"
              name="select2"
              value={formDataa.select2}
              onChange={handleChangee}
              placeholder="Selecciona una opción"
            >
              <option value="national">NACIONAL</option>
              <option value="foreign">EXTRANJERO</option>
              <option value="nationalized">NACIONALIZADO</option>
              <option value="other">OTRO</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Unidad de Medida</FormLabel>
            <Input
              bgColor="white"
              name="input3"
              value={formDataa.input3}
              onChange={handleChangee}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSubmitt}>
            Actualizar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bgColor="gray.200">
            <ModalHeader>{selectedTable}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {renderModalContent()}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={handleSubmit}>
                Enviar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirmar envío de Modal {selectedTable}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              ¿Estás seguro de que deseas enviar este formulario?
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={confirmSubmit}>
                Confirmar
              </Button>
              <Button onClick={() => setIsConfirming(false)}>Cancelar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
       
        <HStack position="relative" align="start" justify="flex-start" textAlign="start">
    
        <Input value={Datafilter} onClick={() => setDatafilter()} onBlur={(e) => SearchFilter(e)} mt={2} width={iSmallScreen ? "60%" : "30%"} border="1px" borderColor="gray.500" height="80%" isDisabled={!showDatabaseData} placeholder={selectedTable === "Registros" ? "Orden de Compra" : selectedTable === "Materiales" ? "Codigo de Material" : "Nombre Proveedor"} ></Input>
       
       
      
        {isProcessing && (
          <>
          <HStack paddingRight={1} paddingLeft={1} bg="gray.300" height="5" width="69%" mt={2.5}>
        <Progress value={progress} colorScheme='blue' width="100%" size="lg" />
        </HStack>
        <HStack width="1%">

        </HStack>
          </>
        )}
       
        
      
        </HStack>
      </Box>
      <Box width="100%" height="390" >
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" height="400">
            <Spinner size="xl" />
            <Text ml={4}>Obteniendo Base de datos...</Text>
          </Box>
        )}
        {!isLoading && (
          <HotTable
            data={data}
            className="relative z-0"
            colHeaders={tableHeaders}
            rowHeaders={true}
            readOnly={true}
            width="100%"
            height="390"
            stretchH="all"
            licenseKey="non-commercial-and-evaluation"
            contextMenu={{
              items: {
                'row_above': { name: 'Insert row above' },
                'row_below': { name: 'Insert row below' },
                'remove_row': { name: 'Remove row' },
                'undo': { name: 'Undo' },
                'redo': { name: 'Redo' },
                'separator': Handsontable.plugins.ContextMenu.SEPARATOR,
                'clear_custom': {
                  name: 'Clear all cells',
                  callback: function () {
                    this.clear();
                  }
                }
              }
            }}
            columns={
              selectedTable === 'Materiales'
                ? [
                  { type: 'text' },
                  { type: 'text' },
                  { type: 'dropdown', source: ['national', 'foreign'] },
                  { type: 'text' }
                ]
                : selectedTable === 'Proveedores'
                  ? [
                    { type: 'text' },
                    { type: 'text' }
                  ]
                  : selectedTable === 'Registros'
                    ? [
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' },
                      { type: 'text' }
                    ]
                    : undefined
            }
          />
        )}
      </Box>
    </>
  );
};

