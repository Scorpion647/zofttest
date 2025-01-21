import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { getMaterial, getRecord, getRecordInfo } from '@/app/_lib/database/service';

async function fetchMaterialData(materialCode) {
    return await getMaterial(materialCode);
}

function removeTrailingZeros(num) {
    let str = num.toString();
    return str.includes('.00') ? str.replace('.00', '') : str;
}

async function fetchRecordAndMaterialData(recordId) {
    const material = await fetchMaterialData(recordId);
    return { record: { material_code: recordId }, material };
}

export async function handleExport(visibleData) {
    let order = "";
    try {
        const dataPromises = visibleData.map(async (row) => {
            const recordId = row[0];
            if(order == ""){
                order = row[0]
            }
            const fetchedData = await fetchRecordAndMaterialData(recordId);
            const record = await getRecord(order, row[1]);
            const info = await getRecordInfo(record.base_bill_id);

            if (!fetchedData) return null;

            let conversion = 0;
            if (row[10] === "U" || row[10] === "L") {
                conversion = 1;
            } else if (row[10] === "KG" || row[10] === "KGM") {
                conversion = parseFloat((parseFloat(row[16]) / parseFloat(row[4])).toFixed(8));
            }

            let PTPRECIO = (row[13]).replace(/[$,]/g, '');
            let PTTASA_CAMBIO = row[11]; // Asegúrate de que este valor esté disponible

            // Asegúrate de que PTPRECIO se calcule correctamente
            PTPRECIO = (info.billed_currency === "USD" || info.billed_currency === "EUR") 
                ? parseFloat(PTPRECIO) 
                : parseFloat((PTPRECIO / PTTASA_CAMBIO).toFixed(9)); // Cambiar a PTTASA_CAMBIO

            return {
                'CODSUBP': row[9],
                'CODEMBALAJE': "PK",
                'NMPESO_BRUTO': parseFloat(row[16]) || 0,
                'NMPESO_NETO': parseFloat(row[16]) || 0,
                'NMBULTOS': parseFloat(row[18]) || 0,
                'CODBANDERA': 169,
                'CODPAIS_ORIGEN': 169,
                'PTTASA_CAMBIO': PTTASA_CAMBIO || 0, // Asegúrate de que no sea nulo
                'CODPAIS_COMPRA': 169,
                'CODPAIS_DESTINO': 953,
                'CODPAIS_PROCEDENCIA': 169,
                'CODTRANSPORTE': 3,
                'PTFLETES': 0,
                'SEGUROS': 0,
                'OTROS_GASTOS': 0,
                'CODITEM': row[2] || 'N/A',
                'NMCANTIDAD': parseFloat(row[4]) || 0,
                'PTPRECIO': PTPRECIO || 0, // Asignar correctamente
                'NMCONVERSION': conversion
            };
        });

        const allData = (await Promise.all(dataPromises)).filter(data => data !== null);

        const groupedData = [];
        const subpMap = {};

        allData.forEach(data => {
            const codsubp = data['CODSUBP'];
            const coditem = data['CODITEM'];
            if (!subpMap[codsubp]) {
                subpMap[codsubp] = {};
            }
            if (!subpMap[codsubp][coditem]) {
                subpMap[codsubp][coditem] = [];
            }
            subpMap[codsubp][coditem].push(data);
        });

        Object.keys(subpMap).forEach((codsubp) => {
            const itemMap = subpMap[codsubp];
            let firstItemVisible = true;

            const summedBySubpartida = Object.values(itemMap).flat().reduce((acc, item) => {
                acc['NMPESO_BRUTO'] += parseFloat(item['NMPESO_BRUTO']) || 0;
                acc['NMPESO_NETO'] += parseFloat(item['NMPESO_NETO']) || 0;
                acc['NMBULTOS'] += parseFloat(item['NMBULTOS']) || 0;
                return acc;
            }, {
                'NMPESO_BRUTO': 0,
                'NMPESO_NETO': 0,
                'NMBULTOS': 0
            });

            Object.keys(itemMap).forEach((coditem) => {
                const items = itemMap[coditem];

                const summedItem = items.reduce((acc, item) => {
                    acc['NMCANTIDAD'] += parseFloat(item['NMCANTIDAD']) || 0;
                    return acc;
                }, {
                    'CODSUBP': codsubp,
                    'CODEMBALAJE': "PK",
                    ...summedBySubpartida, 
                    'CODBANDERA': 169,
                    'CODPAIS_ORIGEN': 169,
                    'PTTASA_CAMBIO': items[0]['PTTASA_CAMBIO'], // Obtener el valor de PTTASA_CAMBIO
                    'CODPAIS_COMPRA': 169,
                    'CODPAIS_DESTINO': 953,
                    'CODPAIS_PROCEDENCIA': 169,
                    'CODTRANSPORTE': 3,
                    'PTFLETES': 0,
                    'SEGUROS': 0,
                    'OTROS_GASTOS': 0,
                    'CODITEM': coditem,
                    'NMCANTIDAD': 0,
                    'PTPRECIO': items[0]['PTPRECIO'], // Obtener el valor de PTPRECIO
                    'NMCONVERSION': 0
                });

                const uniqueItems = items.filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t['PTPRECIO'] === item['PTPRECIO'] && t['NMCONVERSION'] === item['NMCONVERSION']
                    ))
                );

                uniqueItems.forEach((item, index) => {
                    if (firstItemVisible && index === 0) {
                        summedItem['PTPRECIO'] = item['PTPRECIO'];
                        summedItem['NMCONVERSION'] = item['NMCONVERSION'];
                        groupedData.push(summedItem);
                        firstItemVisible = false;
                    } else {
                        groupedData.push({
                            'CODSUBP': '',
                            'CODEMBALAJE': '',
                            'NMPESO_BRUTO': '',
                            'NMPESO_NETO': '',
                            'NMBULTOS': '',
                            'CODBANDERA': '',
                            'CODPAIS_ORIGEN': '',
                            'PTTASA_CAMBIO': '',
                            'CODPAIS_COMPRA': '',
                            'CODPAIS_DESTINO': '',
                            'CODPAIS_PROCEDENCIA': '',
                            'CODTRANSPORTE': '',
                            'PTFLETES': '',
                            'SEGUROS': '',
                            'OTROS_GASTOS': '',
                            'CODITEM': item['CODITEM'],
                            'NMCANTIDAD': item['NMCANTIDAD'],
                            'PTPRECIO': item['PTPRECIO'],
                            'NMCONVERSION': item['NMCONVERSION']
                        });
                    }
                });
            });
        });

        const csv = Papa.unparse(groupedData, { delimiter: ';' });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'records.csv');
    } catch (err) {
        console.error('Error al generar el archivo CSV:', err);
    }
}























/*



'CODSUBP': material.subheading,
                    'CODEMBALAJE': "PK",
                    'NMPESO_BRUTO': (recordInfo.gross_weight / 100),
                    'NMPESO_NETO': (recordInfo.gross_weight / 100),
                    'NMBULTOS': (recordInfo.packages / 1000),
                    'CODBANDERA': 169,
                    'CODPAIS_ORIGEN': 169,
                    'PTTASA_CAMBIO': recordInfo.trm,
                    'CODPAIS_COMPRA': 169,
                    'CODPAIS_DESTINO': 953,
                    'CODPAIS_PROCEDENCIA': 169,
                    'CODTRANSPORTE': 3,
                    'PTFLETES': 0,
                    'SEGUROS': 0,
                    'OTROS_GASTOS': 0,
                    'CODITEM':  material.code,
                    'NMCANTIDAD': recordInfo.billed_quantity,
                    'PTPRECIO': (recordInfo.billed_total_price / 100),
                    'NMCONVERSION': (recordInfo.conversion),






























import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { getRecordsInfo, getRecords, getMaterials } from '@/app/_lib/database/service'; 

async function fetchRecordAndMaterialData(recordId) {

    const records = await getRecords(1, 100, '', [['id', { ascending: true }]]);
    const record = records?.find(r => r.id === recordId);
    
    if (!record) return null;

 
    const materials = await getMaterials(1, 100, '', [['code', { ascending: true }]]);
    const material = materials?.find(m => m.code === record.material_code);

    return { record, material };
}


import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { getRecordsInfo, getRecords, getMaterials } from '@/app/_lib/database/service'; 

async function fetchRecordAndMaterialData(recordId) {
   
    const records = await getRecords(1, 100, '', [['id', { ascending: true }]]);
    const record = records?.find(r => r.id === recordId);
    
    if (!record) return null;

 
    const materials = await getMaterials(1, 100, '', [['code', { ascending: true }]]);
    const material = materials?.find(m => m.code === record.material_code);

    return { record, material };
}

export async function handleExport() {
    try {

        const recordsInfo = await getRecordsInfo(1, 100); 

        if (recordsInfo) {

            const dataPromises = recordsInfo.map(async (recordInfo) => {
                const { record, material } = await fetchRecordAndMaterialData(recordInfo.record_id) || {};
                let conversion = 0;
                if(material.measurement_unit === "U"){
                    conversion = 1;
                }else{
                    conversion = (recordInfo.gross_weight / (recordInfo.billed_quantity))
                }

                return {
                    'CODSUBP': material?.subheading || 'N/A',
                    'CODEMBALAJE': "PK",
                    'NMPESO_BRUTO': (recordInfo.gross_weight),
                    'NMPESO_NETO': (recordInfo.gross_weight),
                    'NMBULTOS': (recordInfo.packages),
                    'CODBANDERA': 169,
                    'CODPAIS_ORIGEN': 169,
                    'PTTASA_CAMBIO': recordInfo.trm,
                    'CODPAIS_COMPRA': 169,
                    'CODPAIS_DESTINO': 953,
                    'CODPAIS_PROCEDENCIA': 169,
                    'CODTRANSPORTE': 3,
                    'PTFLETES': 0,
                    'SEGUROS': 0,
                    'OTROS_GASTOS': 0,
                    'CODITEM': material?.code || 'N/A',
                    'NMCANTIDAD': recordInfo.billed_quantity,
                    'PTPRECIO': (recordInfo.billed_total_price / 100),
                    'NMCONVERSION': conversion || 'N/A' 
                };
            });


            const allData = await Promise.all(dataPromises);

 
            const groupedData = [];
            const materialCodeMap = {};

            for (const data of allData) {
                const materialCode = data['CODITEM'];
                if (materialCode && !materialCodeMap[materialCode]) {
                
                    materialCodeMap[materialCode] = data;
                    groupedData.push(data);
                } else if (materialCode) {
                
                    groupedData.push({
                        'CODSUBP': '', 
                        'CODEMBALAJE': '',
                        'NMPESO_BRUTO': '',
                        'NMPESO_NETO': '',
                        'NMBULTOS': '',
                        'CODBANDERA': '',
                        'CODPAIS_ORIGEN': '',
                        'PTTASA_CAMBIO': '',
                        'CODPAIS_COMPRA': '',
                        'CODPAIS_DESTINO': '',
                        'CODPAIS_PROCEDENCIA': '',
                        'CODTRANSPORTE': '',
                        'PTFLETES': '',
                        'SEGUROS': '',
                        'OTROS_GASTOS': '',
                        'CODITEM': materialCode,
                        'NMCANTIDAD': data['NMCANTIDAD'],
                        'PTPRECIO': data['PTPRECIO'],
                        'NMCONVERSION': data['NMCONVERSION']
                    });
                }
            }

    
            const csv = Papa.unparse(groupedData);

  
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, 'records.csv');
        } else {
            throw new Error('No se obtuvieron datos.');
        }
    } catch (err) {
        console.error('Error al generar el archivo CSV:', err);
    }
}

















































import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { getRecords, getRecordsInfo, getMaterials } from '@/app/_lib/database/service'; 


function formatCurrency(number) {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  }

async function fetchRecordAndMaterialData(recordId) {

    const records = await getRecords(1, 100, '', [['id', { ascending: true }]]);
    const record = records?.find(r => r.id === recordId);
    
    if (!record) return null;


    const materials = await getMaterials(1, 100, '', [['code', { ascending: true }]]);
    const material = materials?.find(m => m.code === record.material_code);

    return { record, material };
}

export async function handleExport() {
    try {

        const recordsInfo = await getRecordsInfo(1, 100); 

        if (recordsInfo) {

            const dataPromises = recordsInfo.map(async recordInfo => {
                const { record, material } = await fetchRecordAndMaterialData(recordInfo.record_id) || {};
                
                return {
                    'CODSUBP': material.subheading,
                    'CODEMBALAJE': "PK",
                    'NMPESO_BRUTO': (recordInfo.gross_weight / 100),
                    'NMPESO_NETO': (recordInfo.gross_weight / 100),
                    'NMBULTOS': (recordInfo.packages / 1000),
                    'CODBANDERA': 169,
                    'CODPAIS_ORIGEN': 169,
                    'PTTASA_CAMBIO': recordInfo.trm,
                    'CODPAIS_COMPRA': 169,
                    'CODPAIS_DESTINO': 953,
                    'CODPAIS_PROCEDENCIA': 169,
                    'CODTRANSPORTE': 3,
                    'PTFLETES': 0,
                    'SEGUROS': 0,
                    'OTROS_GASTOS': 0,
                    'CODITEM':  material.code,
                    'NMCANTIDAD': recordInfo.billed_quantity,
                    'PTPRECIO': (recordInfo.billed_total_price / 100),
                    'NMCONVERSION': (recordInfo.conversion),
                };
            });


            const data = await Promise.all(dataPromises);


            const csv = Papa.unparse(data);


            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, 'records.csv');
        } else {
            throw new Error('No se obtuvieron datos.');
        }
    } catch (err) {
        console.error('Error al generar el archivo CSV:', err);
    }
}
}*/