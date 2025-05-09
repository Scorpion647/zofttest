import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { getMaterial, getRecord, getRecordInfo } from '@/app/_lib/database/service';

async function fetchMaterialData(materialCode) {
  return await getMaterial(materialCode);
}

async function fetchRecordAndMaterialData(recordId) {
  const material = await fetchMaterialData(recordId);
  return { record: { material_code: recordId }, material };
}

export async function handleExport(visibleData) {
  let order = "";
  let id = "";

  try {
    // 1) Enriquecer cada fila y normalizar
    const dataPromises = visibleData.map(async (row) => {
      const recordId = row[0];
      if (!order) order = recordId;

      const fetched = await fetchRecordAndMaterialData(recordId);
      const record  = await getRecord(order, row[1]);
      const info    = await getRecordInfo(record.base_bill_id);
      id = info.invoice_id;
      if (!fetched) return null;

      // conversión
      let conversion = 0;
      if (row[10]==="U"||row[10]==="L") conversion = 1;
      else if (["KG","KGM"].includes(row[10])) {
        conversion = parseFloat((parseFloat(row[16]) / parseFloat(row[4])).toFixed(8));
      }

      // precio limpio y a USD si aplica
      let precioBruto = row[13].replace(/[$,]/g, "");
      const tasa = parseFloat(row[11]) || 0;
      let PTPRECIO = parseFloat(precioBruto);
      if (info.billed_currency !== "USD" && tasa > 0) {
        PTPRECIO = parseFloat((PTPRECIO / tasa).toFixed(9));
      }

      return {
        CODSUBP:       row[9],
        CODEMBALAJE:   "PK",
        NMPESO_BRUTO:  parseFloat(row[16]) || 0,
        NMPESO_NETO:   parseFloat(row[16]) || 0,
        NMBULTOS:      parseFloat(row[18]) || 0,
        CODBANDERA:    169,
        CODPAIS_ORIGEN:169,
        PTTASA_CAMBIO: tasa,
        CODPAIS_COMPRA:169,
        CODPAIS_DESTINO:953,
        CODPAIS_PROCEDENCIA:169,
        CODTRANSPORTE: 3,
        PTFLETES:      0,
        SEGUROS:       0,
        OTROS_GASTOS:  0,
        CODITEM:       row[2] || "N/A",
        NMCANTIDAD:    parseFloat(row[4]) || 0,
        PTPRECIO,
        NMCONVERSION:  conversion
      };
    });

    const allData = (await Promise.all(dataPromises)).filter(d => d !== null);

    // 2) Agrupar por subpartida y artículo
    const subpMap = {};
    allData.forEach(item => {
      const { CODSUBP, CODITEM } = item;
      if (!subpMap[CODSUBP])          subpMap[CODSUBP] = {};
      if (!subpMap[CODSUBP][CODITEM]) subpMap[CODSUBP][CODITEM] = [];
      subpMap[CODSUBP][CODITEM].push(item);
    });

    // 3) Construir groupedData con promedio ponderado
    const groupedData = [];
    Object.keys(subpMap).forEach(codsubp => {
      const itemsByCode = subpMap[codsubp];

      // 3.a) totales de peso/bultos de la subpartida
      const totals = Object.values(itemsByCode).flat().reduce((acc, it) => {
        acc.NMPESO_BRUTO += it.NMPESO_BRUTO;
        acc.NMPESO_NETO  += it.NMPESO_NETO;
        acc.NMBULTOS     += it.NMBULTOS;
        return acc;
      }, { NMPESO_BRUTO:0, NMPESO_NETO:0, NMBULTOS:0 });

      let firstRow = true;

      Object.keys(itemsByCode).forEach(coditem => {
        const group = itemsByCode[coditem];

        // 3.b) suma de cantidades
        const totalQty = group.reduce((sum, it) => sum + it.NMCANTIDAD, 0);

        // 3.c) suma ponderada de precios
        const weightedSum = group.reduce(
          (sum, it) => sum + (it.PTPRECIO * it.NMCANTIDAD),
          0
        );

        // 3.d) precio promedio ponderado
        const avgPrecio = totalQty > 0
          ? parseFloat((weightedSum / totalQty).toFixed(9))
          : 0;

        // conservar conversión del primer elemento
        const conversion = group[0].NMCONVERSION;

        if (firstRow) {
          // fila principal con totales y primer artículo
          groupedData.push({
            CODSUBP:       codsubp,
            CODEMBALAJE:   "PK",
            NMPESO_BRUTO:  totals.NMPESO_BRUTO,
            NMPESO_NETO:   totals.NMPESO_NETO,
            NMBULTOS:      totals.NMBULTOS,
            CODBANDERA:    169,
            CODPAIS_ORIGEN:169,
            PTTASA_CAMBIO: group[0].PTTASA_CAMBIO,
            CODPAIS_COMPRA:169,
            CODPAIS_DESTINO:953,
            CODPAIS_PROCEDENCIA:169,
            CODTRANSPORTE: 3,
            PTFLETES:      0,
            SEGUROS:       0,
            OTROS_GASTOS:  0,
            CODITEM:       coditem,
            NMCANTIDAD:    totalQty,
            PTPRECIO:      avgPrecio,
            NMCONVERSION:  conversion
          });
          firstRow = false;
        } else {
          // fila "secundaria": deja campos de cabecera vacíos
          groupedData.push({
            CODSUBP:       "",
            CODEMBALAJE:   "",
            NMPESO_BRUTO:  "",
            NMPESO_NETO:   "",
            NMBULTOS:      "",
            CODBANDERA:    "",
            CODPAIS_ORIGEN:"",
            PTTASA_CAMBIO: "",
            CODPAIS_COMPRA:"",
            CODPAIS_DESTINO:"",
            CODPAIS_PROCEDENCIA:"",
            CODTRANSPORTE: "",
            PTFLETES:      "",
            SEGUROS:       "",
            OTROS_GASTOS:  "",
            CODITEM:       coditem,
            NMCANTIDAD:    totalQty,
            PTPRECIO:      avgPrecio,
            NMCONVERSION:  conversion
          });
        }
      });
    });

    // 4) Serializar a CSV y forzar descarga
    const csv  = Papa.unparse(groupedData, { delimiter: ';' });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${id}.csv`);

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