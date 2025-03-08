'use client'

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

  import { useState, useCallback, useEffect, useRef } from "react";
  import { deleteBills, insertBills, selectBills, selectSingleBill, updateBills } from '@/app/_lib/database/base_bills';
import { deleteMaterial, insertMaterial, selectMaterials, selectSingleMaterial, updateMaterial } from '@/app/_lib/database/materials';
import { insertSupplier, selectSingleSupplier, selectSuppliers, updateSupplier } from '@/app/_lib/database/suppliers';
















async function fetchDataFromDatabase() {
  // Esta sería la llamada a tu API o base de datos real
  const response = await selectSuppliers({ limit: 1000, page: 1 });

  return response.map(item => ({
    id: item.supplier_id,
    name: item.name // Asume que el campo 'name' es uno de los elementos
  }));
}











export const Modals = ({isOpen2,onOpen2,onClose2,Case}) => {
    const toast = useToast();
    const [originalData, setOriginalData] = useState({});
    const [inputValue, setInputValue] = useState('');
    const [Enabled,setEnabled] = useState(false)



 const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Guardar el id seleccionado
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [dataa, setDataa] = useState([]); // Almacena los datos cargados desde la base de datos
  const dropdownRef = useRef(); // Referencia para el dropdown



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





  useEffect(() => {
    if (isOpen2) {
      // Restablecer los campos del formulario cuando se abra el modal
      setFormDataa({
        // Campos para "material" y "order"
     input1: "",
     input2: "",
     select2: "",
     input3: "",
     // Campos exclusivos de "order"
     inputProvider: "",
     input4: "",
     input5: "",
     input6: "",
     input7: "",
     input8: "",
     input9: "",
     input10: "",
     input11: "",
     select1: "",
     // Campos para "provider"
     inputObligatorio: "",
     inputOpcional: "",
      });
      setOriginalData({});
      setEnabled(false)
    }
  }, [isOpen2]);
  const handleChangee = (e) => {

    const { name, value } = e.target;
    
    setFormDataa({
      ...formDataa,
      [e.target.name]: e.target.value,
    });


    if (name === 'input8' || name === 'input10') {
      console.log("Entramos parece")
      const cantidad = parseFloat(name === 'input8' ? value : formDataa.input8);
      const precio = parseFloat(name === 'input10' ? value : formDataa.input10);
  
      if (!isNaN(cantidad) && !isNaN(precio)) {
        setFormDataa((prevData) => ({
          ...prevData,
          input11: (cantidad * precio).toFixed(2), // Calcula y actualiza el valor neto
        }));
      } else {
        setFormDataa((prevData) => ({
          ...prevData,
          input11: '', // Borra el valor si no son números válidos
        }));
      }
      console.log(formDataa.input8)
      console.log(formDataa.input10)
      console.log((cantidad * precio).toFixed(2))
    }
  };



  const [formDataa, setFormDataa] = useState({
     // Campos para "material" y "order"
     input1: "",
     input2: "",
     select2: "",
     input3: "",
     // Campos exclusivos de "order"
     inputProvider: "",
     input4: "",
     input5: "",
     input6: "",
     input7: "",
     input8: "",
     input9: "",
     input10: "",
     input11: "",
     select1: "",
     // Campos para "provider"
     inputObligatorio: "",
     inputOpcional: "",
  });

  useEffect(() => {
    setEnabled(false)
  },[formDataa.input1,formDataa.input4,formDataa.input5])

  const fetchMaterialData = async () => {
    if(Case === "Materiales"){

      if(!formDataa.input1){
        toast({
          title: 'Error',
          description: 'Introduzca todos los datos necesarios para la busqueda',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setEnabled(false)
          setFormDataa((prevData) => 
            ({
              ...prevData,
              input2: "",
              select2: "",
              input3: "",
            })
          )
        return
      }

      try {
        // Simulación de búsqueda de datos con el primer input (Código de Material)
        const data = await selectSingleMaterial(formDataa.input1); // Implementa esta función para traer los datos
        if (data) {
          setOriginalData(data);
          setFormDataa((prevData) => 
            ({
              ...prevData,
              input2: data.subheading,
              select2: data.type ,
              input3: data.measurement_unit,
            })
          )
          setEnabled(true)
        } else {
          toast({
            title: 'Error',
            description: 'No se encontraron datos para este código de material',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          setEnabled(false)
          setFormDataa((prevData) => 
            ({
              ...prevData,
              input2: "",
              select2: "",
              input3: "",
            })
          )
        }
      } catch (error) {
        console.error("Error fetching data", error);
        toast({
          title: 'Error',
          description: 'No se encontraron datos para este código de material',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setEnabled(false)
        setFormDataa((prevData) => 
          ({
            ...prevData,
            input2: "",
            select2: "",
            input3: "",
          })
        )
      }
    }else if(Case === "Registros"){

      if(!formDataa.input4 || !formDataa.input5){
        toast({
          title: 'Error',
          description: 'Introduzca todos los datos necesarios para la busqueda',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setFormDataa((prevData) => 
          ({
            ...prevData, // 🔴 Mantener datos previos
            inputProvider: "",
            input6: "",
            input7: "",
            input8: "",
            input9: "",
            input10: "",
            input11: "",
            select1: "",
          })
        )
        setInputValue("")
        setEnabled(false)
        return
      }
    
      try {
        const data = await selectBills({page: 1, limit: 1, equals: {purchase_order: formDataa.input4, item: formDataa.input5}}); // Implementa esta función para traer los datos
        if (data[0]?.purchase_order === formDataa.input4) {
          const supplier = await selectSingleSupplier(data[0]?.supplier_id)
          setOriginalData(data);
          setInputValue(supplier.name)
          setFormDataa((prevData) => 
            ({
              ...prevData, // 🔴 Mantener datos previos
              inputProvider: supplier.name,
              input6: data[0]?.material_code,
              input7: data[0]?.description,
              input8: data[0]?.total_quantity,
              input9: data[0]?.measurement_unit,
              input10: (data[0]?.unit_price/100),
              input11: ((data[0]?.unit_price/100) * data[0]?.total_quantity).toFixed(2),
              select1: data[0]?.currency,
            })
          );
          setEnabled(true)
        } else {
          toast({
            title: 'Error',
            description: 'No se encontraron datos para este registro',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });

          setInputValue("")
        setFormDataa((prevData) => 
          ({
            ...prevData, // 🔴 Mantener datos previos
            inputProvider: "",
            input6: "",
            input7: "",
            input8: "",
            input9: "",
            input10: "",
            input11: "",
            select1: "",
          })
        )
        setEnabled(false)
        }
      } catch (error) {
        console.error("Error fetching data", error);


        toast({
          title: 'Error',
          description: 'No se encontraron datos para este registro',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setInputValue("")
        setFormDataa((prevData) => 
          ({
            ...prevData, // 🔴 Mantener datos previos
            inputProvider: "",
            input6: "",
            input7: "",
            input8: "",
            input9: "",
            input10: "",
            input11: "",
            select1: "",
          })
        )
        setEnabled(false)
      }
    }else if(Case === "Proveedores"){
      if(!inputValue){
        toast({
          title: 'Error',
          description: 'Introduzca todos los datos necesarios para la busqueda',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });

        setFormDataa((prevData) => 
          ({
            ...prevData, // 🔴 Mantener datos previos
            inputOpcional: "",
          })
        )
        setEnabled(false)
        return
      }


      try {
        const data = await selectSuppliers({page: 1, limit: 1, equals: {name: inputValue}})
        if (data[0]?.name === inputValue) {

          setFormDataa((prevData) => 
            ({
              ...prevData, // 🔴 Mantener datos previos
              inputOpcional: data[0]?.domain,
            })
          );
          setEnabled(true)
        } else {
          toast({
            title: 'Error',
            description: 'No se encontraron datos para este registro',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });

        setFormDataa((prevData) => 
          ({
            ...prevData, // 🔴 Mantener datos previos
              inputOpcional: "",
          })
        )
        setEnabled(false)
        }
      } catch (error) {
        console.error("Error fetching data", error);


        toast({
          title: 'Error',
          description: 'No se encontraron datos para este registro',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setFormDataa((prevData) => 
          ({
            ...prevData, // 🔴 Mantener datos previos
            inputOpcional: "",
          })
        )
        setEnabled(false)
      }
    }
  };


const DeleteButton = async () => {
  if(Case === "Materiales"){
    const response = await deleteMaterial(formDataa.input1)
  if (!response) {
    toast({
      title: 'Éxito',
      description: 'Dato eliminado correctamente.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    onClose2();
  } else {
    toast({
      title: 'Error',
      description: 'Hubo un problema al eliminar el dato.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }
  }else if(Case === "Registros"){
    const bill = await selectBills({limit: 1, page: 1, equals: {purchase_order: formDataa.input4, item: formDataa.input5}})
    const response = await deleteBills(bill[0]?.base_bill_id)
    if (!response) {
      toast({
        title: 'Éxito',
        description: 'Dato eliminado correctamente.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose2();
    } else {
      toast({
        title: 'Error',
        description: 'Hubo un problema al eliminar el dato.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

}



  const handleSubmitt = async () => {
    if(Case === "Materiales"){
      // Validación
    if (!formDataa.input1 || !formDataa.input2 || !formDataa.select2 || !formDataa.input3) {
      return toast({
        title: 'Error',
        description: 'Todos los campos deben estar completos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return
    }

    if (formDataa.input2.length !== 10) {
      return toast({
        title: 'Error',
        description: 'La subpartida debe tener exactamente 10 caracteres.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return
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
    }else if(Case === "Registros"){
      // Validación
    if (!formDataa.input4 || !formDataa.input5  || !formDataa.input6 || !formDataa.input7 || !formDataa.input8 || !formDataa.input9 || !formDataa.input10 || !formDataa.input11 || !inputValue || !formDataa.select1 || isNaN(Number(formDataa.input8)) || isNaN(Number(formDataa.input10)) || isNaN(Number(formDataa.input11))) {
      return toast({
        title: 'Error',
        description: 'Hay algun dato incompleto o un dato invalido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return
    }



    let sup_id = 0;
    const bill = await selectBills({page: 1, limit: 1, equals: {purchase_order: formDataa.input4, item: formDataa.input5}})
    const supplier = await selectSuppliers({page: 1, limit: 1, equals: {name: inputValue}})
    if(supplier[0]?.name === inputValue){
      sup_id = supplier[0]?.supplier_id
    }else{
      const newsup = await insertSupplier({name: inputValue})

      sup_id = newsup[0]?.supplier_id
    }
    try {
      const response = await updateBills({base_bill_id: bill[0]?.base_bill_id, material_code: formDataa.input6, description: formDataa.input7, total_quantity: formDataa.input8, measurement_unit: formDataa.input9, unit_price: (formDataa.input10 * 100), net_price: (formDataa.input11 * 100).toFixed(0), currency: formDataa.select1, supplier_id: sup_id}); // Implementa esta función
      if (!response) {
        toast({
          title: 'Éxito',
          description: 'Datos actualizados correctamente.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose2();
 
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
    }else if(Case === "Proveedores"){

      if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formDataa.inputOpcional) && formDataa.inputOpcional) {
        return toast({
          title: 'Error',
          description: 'Ingrese un dominio de correo válido (ej. ejemplo.com).',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      const supplier = await selectSuppliers({page: 1, limit: 1, equals: {name: inputValue}})
      try {
        const response = await updateSupplier({supplier_id: supplier[0]?.supplier_id, domain: formDataa.inputOpcional})
        if (!response) {
          toast({
            title: 'Éxito',
            description: 'Datos actualizados correctamente.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          onClose2();
   
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

    }
  };


    return(
      <Modal isOpen={isOpen2} onClose={onClose2}>
      <ModalOverlay />
      <ModalContent bgColor="gray.200">
        <ModalHeader>{Case === "Materiales" ? "Actualizar Material" : (Case === "Registros" ? "Actualizar Registro": "Actualizar Proveedor")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>



          {Case === "Materiales" && (
            <>
            <FormControl isRequired>
            <FormLabel>Código de Material</FormLabel>
            <HStack>
            <Input
              bgColor="white"
              name="input1"
              value={formDataa.input1}
              onChange={handleChangee}
            />
            <Button colorScheme="steal" bg="#F1D803" textColor="black" onClick={fetchMaterialData}>Buscar</Button>
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
            </>
          )}



          {Case === "Registros" && (
            <>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Orden de Compra</FormLabel>
                  <Input bgColor="white" name="input4" onChange={handleChangee} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Item</FormLabel>
                  <HStack>
                  <Input bgColor="white" name="input5" onChange={handleChangee} />
                  <Button colorScheme="steal" bg="#F1D803" textColor="black" onClick={fetchMaterialData}>Buscar</Button>
                  </HStack>
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Codigo de Material</FormLabel>
                  <Input bgColor="white" name="input6" value={formDataa.input6} onChange={handleChangee} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Texto Breve</FormLabel>
                  <Input bgColor="white" name="input7" value={formDataa.input7} onChange={handleChangee} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Cantidad de Pedido</FormLabel>
                  
                  <Input bgColor="white" name="input8" value={formDataa.input8} onChange={handleChangee} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Unidad de Medida</FormLabel>
                  <Input bgColor="white" name="input9" value={formDataa.input9} onChange={handleChangee} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Precio Neto</FormLabel>
                  <Input bgColor="white" name="input10" value={formDataa.input10} onChange={handleChangee} />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Valor Neto de pedido</FormLabel>
                  <Input bgColor="white" name="input11" value={formDataa.input11} readOnly />
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
                  setFormDataa({
                    ...formDataa,
                    inputProvider: e.target.value, // Actualiza formDataa con el valor del input
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
              <Select bgColor="white" name="select1" value={formDataa.select1} placeholder='Selecciones un tipo de moneda' onChange={handleChangee} >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </FormControl>
            </>
          )}






          {Case === "Proveedores" && (
            <>
              <FormControl isRequired>
              <FormLabel>Nombre de Proveedor</FormLabel>
              <HStack>
              <Input bgColor="white" name="inputObligatorio"
              value={inputValue}
              onChange={(e) => {
                handleInputChange(e); // Actualiza inputValue en el estado
                setFormDataa({
                  ...formDataa,
                  inputProvider: e.target.value, // Actualiza formDataa con el valor del input
                });
              }}
              onBlur={handleBlur} // Llama a handleBlur cuando se pierde el foco
              />
              <Button colorScheme="steal" bg="#F1D803" textColor="black" onClick={fetchMaterialData}>Buscar</Button>
              </HStack>
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
            <FormControl>
              <FormLabel>Dominio (opcional)</FormLabel>
              <Input bgColor="white" name="inputOpcional" value={formDataa.inputOpcional} onChange={handleChangee} />
            </FormControl>
            </>
          )}





        </ModalBody>
        <ModalFooter>
        <HStack>
        <Button isDisabled={!Enabled} colorScheme="steal" bg="red" textColor="white"  onClick={DeleteButton}>
            Eliminar
          </Button>
          <Button colorScheme="steal" bg="#F1D803" textColor="black" isDisabled={!Enabled}  onClick={handleSubmitt}>
            Actualizar
          </Button>
        </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>  

    )
}