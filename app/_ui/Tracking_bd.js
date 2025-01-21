import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { VStack, HStack, Spinner, Text, Button, Input, Box, Flex, Select } from '@chakra-ui/react';
import { getMaterial, getRecords, getRecordsInfo, getSupplier } from '@/app/_lib/database/service';

function formatMoney(amount) {
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseMoney(amount) {
 
    return parseFloat(amount.replace(/[^0-9.-]+/g, ''));
}

const Material = async (code, number) => {
    const material = await getMaterial(code);
    if (number === 0) return material.subheading;
    if (number === 1) return material.measurement_unit;
    if (number === 2) return material.type;
};

const Typematerial = (type) => {
    if (type === 'national') return 'NACIONAL';
    if (type === 'foreign') return 'EXTRANJERO';
    return 'OTRO';
};

export const Tracking_bd = () => {
    const [data, setData] = useState([]);
    const [groupedData, setGroupedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentOC, setCurrentOC] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const hotTableRef = useRef(null);
    const billNumbers = Array.from(new Set(data.map(item => item[8])));
    const [selectedBill, setSelectedBill] = useState('');
    const [bills, setBills] = useState([]);

    const columns = [
        { data: 0, readOnly: true, title: 'OC' },
        { data: 1, readOnly: true, title: 'ITEMS' },
        { data: 2, readOnly: true, title: 'CODIGO' },
        { data: 3, readOnly: true, title: 'DESCRIPCION' },
        { data: 4, readOnly: true, title: 'CANT' },
        { data: 5, readOnly: true, title: 'UND' },
        { data: 6, readOnly: true, title: 'PROVEEDOR' },
        { data: 7, readOnly: true, title: 'FOB UNIT' },
        { data: 8, readOnly: true, title: 'FACTURA' },
        { data: 9, readOnly: true, title: 'PA' },
        { data: 10, readOnly: true, title: 'UC' },
        { data: 11, readOnly: true, title: 'TRM' },
        { data: 12, readOnly: true, title: 'FOB' },
        { data: 13, readOnly: true, title: 'COP UNIT' },
        { data: 14, readOnly: true, title: 'COP TOTAL' },
        { data: 15, readOnly: true, title: 'TIPO' },
        { data: 16, readOnly: true, title: 'PB' },
        { data: 17, readOnly: true, title: 'PN' },
        { data: 18, readOnly: true, title: 'Bultos' },
        { data: 19, readOnly: true, title: 'Conversion' },
    ];

    useEffect(() => {
        if (currentOC === null) {
            handleFetchData(); 
        }
    }, [currentOC]);

    useEffect(() => {
        handleFetchData();
    }, []);


    const handleFetchData = async () => {
        setIsLoading(true);
        try {
            let allRecords = [];
            let page = 1;
            const limit = 10000; 
            let hasMoreRecords = true;
    
  
            while (hasMoreRecords) {
                const records = await getRecords(page, limit);
                if (Array.isArray(records) && records.length > 0) {
                    allRecords = allRecords.concat(records);
                    page += 1;
                    if (records.length < limit) {
                        hasMoreRecords = false;
                    }
                } else {
                    hasMoreRecords = false;
                }
            }
    
            const recordIds = allRecords.map((record) => record.id);
    
            let allRecordDetails = [];
            page = 1;
            hasMoreRecords = true;
    
   
            while (hasMoreRecords) {
                const recordDetails = await getRecordsInfo(page, limit);
                if (Array.isArray(recordDetails) && recordDetails.length > 0) {
                    allRecordDetails = allRecordDetails.concat(recordDetails);
                    page += 1;
                    if (recordDetails.length < limit) {
                        hasMoreRecords = false;
                    }
                } else {
                    hasMoreRecords = false;
                }
            }
    
            const filteredRelatedData = allRecordDetails
                .filter((detail) =>
                    recordIds.includes(detail.record_id) && detail.status === 'approved'
                );
    
            const sortedData = filteredRelatedData.sort((a, b) =>
                a.bill_number.localeCompare(b.bill_number)
            );
    
            const materialsPromises = sortedData.map(async (record) => {
                try {
                    const relatedRecord = allRecords.find((r) => r.id === record.record_id);
                    if (!relatedRecord) {
                        console.warn(`Related record not found for record ID: ${record.record_id}`);
                        return null;
                    }
    
                    const material = await Material(relatedRecord.material_code, 0);
                    const unit = await Material(relatedRecord.material_code, 1);
                    const type = await Material(relatedRecord.material_code, 2);
                    const supplier = await getSupplier(relatedRecord.supplier_id);
                    const conversion = record.unit === 'U'
                        ? 1
                        : parseFloat((record.gross_weight / record.billed_quantity).toFixed(8));
    
                    return [
                        relatedRecord.purchase_order,
                        relatedRecord.item,
                        relatedRecord.material_code,
                        relatedRecord.description,
                        record.billed_quantity,
                        relatedRecord.measurement_unit,
                        supplier.name,
                        parseFloat(parseFloat((record.billed_unit_price / 100) / record.trm).toFixed(8)),
                        record.bill_number,
                        material,
                        unit,
                        record.trm,
                        formatMoney(parseFloat((record.billed_unit_price / 100) / record.trm) * record.billed_quantity),
                        formatMoney(record.billed_unit_price / 100),
                        formatMoney((record.billed_unit_price / 100) * record.billed_quantity),
                        Typematerial(type),
                        record.gross_weight,
                        record.gross_weight,
                        record.packages,
                        conversion,
                    ];
                } catch (error) {
                    console.error(`Error processing record ${record.record_id}:`, error);
                    return null;
                }
            });
    
            const formattedData = await Promise.all(materialsPromises);
            const validFormattedData = formattedData.filter(item => item !== null);
    
         
            const grouped = validFormattedData.reduce((acc, item) => {
                const existing = acc.find((entry) => entry.oc === item[0]);
                if (existing) {
                    existing.fobUnitTotal += parseMoney(item[12]);
                    existing.items.push(item);
                } else {
                    acc.push({
                        oc: item[0],
                        fobUnitTotal: parseMoney(item[12]),
                        items: [item]
                    });
                }
                return acc;
            }, []);
    
            setData(validFormattedData);
            setGroupedData(grouped);
            setFilteredData(grouped);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    
    
    
    
    

    
    const handleFilterChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = groupedData.filter((item) =>
            item.oc.toLowerCase().startsWith(searchTerm)
        );
        setFilteredData(filtered);
    };

    
    const calculateTotalFOB = (items) => {
        if (!Array.isArray(items)) {
            return 0;
        }
        return items.reduce((total, item) => {
            const fob = parseMoney(item[12]);
            return total + (isNaN(fob) ? 0 : fob);
        }, 0);
    };

    const displayedData =
        currentOC !== null
            ? data.filter((item) => item[0] === currentOC && (selectedBill === '' || item[8] === selectedBill))
            : [];





    const handleExport = async () => {
        if (hotTableRef.current) {
            const hotTableInstance = hotTableRef.current.hotInstance;
            const visibleData = hotTableInstance.getData(); 

            
        }


    };

    const handleFilterChangea = (e) => {
        const billNumber = e.target.value;
        setSelectedBillNumber(billNumber);
    };

    const handleOCClick = (oc) => {
        setCurrentOC(oc);
        const billsForOC = groupedData.find((item) => item.oc === oc)?.items.map((item) => item[8]) || [];
        setBills([...new Set(billsForOC)]); 
        setSelectedBill('');
    };
    return (
        <div>
            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="420">
                    <Spinner size="xl" />
                    <Text ml={4}>Cargando datos...</Text>
                </Box>
            ) : (
                <>

                    {!currentOC && (
                        <>
                            <Input
                                placeholder="Filtrar por OC..."
                                mb={4}
                                onChange={handleFilterChange}
                            />
                            <VStack w="100%">
                                <Box bgColor="gray.200" overflowY='auto' w="100%" h="415">
                                {filteredData.map((item) => (
                                    <VStack w="100%" key={item.oc}>
                                        <Button
                                            onClick={() => handleOCClick(item.oc)}
                                            whiteSpace="nowrap"
                                            paddingRight={2}
                                            paddingLeft={2}
                                            justifyContent="center"
                                            alignItems="center"
                                            className="rounded-2xl"
                                            bg="gray.200"
                                            w="100%"
                                            h="50"
                                        >
                                            <HStack
                                                marginTop="1%"
                                                className="rounded-2xl"
                                                bgColor="white"
                                                align="center"
                                                justify="center"
                                                w="100%"
                                                h="100%"
                                            >
                                                <HStack width="60%" ml="3%" alignItems="center" justify="start" w="40%">
                                                    <Text className="font-bold" fontSize="100%">
                                                        {item.oc}
                                                    </Text>
                                                </HStack>
                                                <HStack  width="20%">

                                                </HStack>
                                                <VStack width="20%">
                                                <HStack spacing={4} alignItems="center" justify="center" w="30%">
                                                    <Text className=' font-semibold' fontSize="60%">
                                                        Total FOB:
                                                    </Text>
                                                    <Text fontSize="60%">
                                                    {formatMoney(calculateTotalFOB(item.items))}
                                                    </Text>
                                                </HStack>
                                                <HStack  spacing={4} alignItems="center" justify="center" w="30%">
                                                    <Text className=' font-semibold' fontSize="60%">
                                                        Posiciones:
                                                    </Text>
                                                    <Text fontSize="60%">
                                                    {item.items ? item.items.length : 0}
                                                    </Text>
                                                </HStack>
                                                </VStack>
                                            </HStack>
                                        </Button>
                                    </VStack>
                                ))}
                                </Box>

                                
  
                            </VStack>
                        </>
                    )}
                    {currentOC && (
                        <>
                            <Flex
                                width="100%"
                                alignItems="center"
                                justifyContent="space-between"
                                p={2}
                                bg="gray.100"
                                className="rounded-2xl"
                                position="relative"
                                mb={2}
                            >
                                <Box position="absolute" right={2}>

                                    <Button bgColor="#F1D803" textColor="black" onClick={handleExport}>
                                        Export
                                    </Button>

                                </Box>
                                <Box flex={1} textAlign="start">
                                    <Button bgColor="#F1D803" textColor="black" onClick={() => setCurrentOC(null)}>
                                        Regresar
                                    </Button>
                                </Box>
                                <Box flex={1} textAlign="center">
                                    <Select
                                value={selectedBill}
                                onChange={(e) => setSelectedBill(e.target.value)}
                                width="30%"
                            >
                                {bills.map((bill, index) => (
                                    <option key={index} value={bill}>
                                        {bill}
                                    </option>
                                ))}
                            </Select>
                                </Box>

                            </Flex>


                            <Box overflow="auto">
                                <HotTable
                                    data={displayedData}
                                    colHeaders={columns.map(col => col.title)}
                                    columns={columns}
                                    width="100%"
                                    height="400"
                                    licenseKey="non-commercial-and-evaluation"
                                    ref={hotTableRef}
                                />
                            </Box>
                        </>
                    )}
                </>
            )}
        </div>
    );
};






//colWidths={[50, 150, 50, 110, 110 , 100,]}

/*<div >
            <h2>hola</h2>
            <HotTable
            data={tableData}
            width="100%"
                  height="450"
                  licenseKey="non-commercial-and-evaluation"
                  columns={columns}
            />
        </div>*/