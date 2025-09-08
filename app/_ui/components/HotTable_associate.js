"use client";
import React, { useEffect } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";

function formatMoney(amount) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CustomHotTable(props) {


    const {
        data,
        columns,
        subheadingValidity,
        setSubheadingValidity,
        orderNumber,
        position,
        records,
        materialResults,
        selectedCurrency,
        realcurrency,
        sharedState,
        isTable,
        invoi,
        isLoading2,
        getCounter,
        updateGlobalCounter,
        checkSubheadingExists,
        selectByPurchaseOrder,
        selectSupplierData,
        calculateColumnSum,
        updateSharedState,
        handleAfterSelection,
        handleCellDoubleClick,
        hotTableRef, 
    } = props;

    useEffect(() => {
        if (hotTableRef?.current?.hotInstance) {
            console.log("Instancia HOT disponible:", hotTableRef.current.hotInstance);
        }
    }, [hotTableRef]);


    return (
        <HotTable
            ref={hotTableRef}
            className="relative z-0"
            data={data}
            colWidths={[50, 150, 50, 110, 110, 100]}
            licenseKey="non-commercial-and-evaluation"
            columns={columns}
            stretchH="all"
            manualColumnResize={true}
            rowHeaders={true}
            manualRowResize={true}
            hiddenColumns={false}
            afterSelection={handleAfterSelection}
            afterOnCellMouseDown={handleCellDoubleClick}
            copyPaste={true}
            beforeChange={(changes, source) => {
                const hot = hotTableRef.current.hotInstance;

                if (changes) {
                    hot.batch(() => {
                        for (const change of changes) {
                            const [row, col, oldValue, newValue] = change;

                            calculateColumnSum();

                            if (col === 0) {
                                if (
                                    newValue === undefined ||
                                    newValue === "" ||
                                    newValue === NaN ||
                                    newValue === null
                                ) {
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
                const editableBg = "#ecf395";
                const readonlyBg = "#f5c6c6";
                const resetBg = "";

                // SVGs
                const SVG_WARN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 26"><g fill="none"><defs><mask id="m1"><path fill="#fff" d="M0 0h26v26H0z"/><g fill="#000"><path fill-rule="evenodd" d="M13.25 5.25A.75.75 0 0 1 14 6v9a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75" clip-rule="evenodd"/><path d="M14.5 19.25a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0"/></g></mask></defs><circle cx="13" cy="13" r="13" fill="#eab308" mask="url(#m1)"/></g></svg>`;
                const SVG_OK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 26"><g fill="none"><defs><mask id="m2"><path fill="#fff" d="M0 0h26v26H0z"/><g fill="#000"><path d="m17.937 8.743-5 9c-.324.583-1.198.097-.874-.486l5-9c.324-.583 1.198-.097.874.486"/><path d="m7.812 13.11 5 4c.52.416-.104 1.197-.624.78l-5-4c-.52-.416.104-1.197.624-.78"/></g></mask></defs><circle cx="13" cy="13" r="13" fill="#65a30d" mask="url(#m2)"/></g></svg>`;
                const SVG_ERR = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 26"><g fill="none"><defs><mask id="m3"><path fill="#fff" d="M0 0h26v26H0z"/><g fill="#000"><path d="M13 6.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13"/><path d="M18.304 7.697a.5.5 0 0 1 0 .707l-9.9 9.9a.5.5 0 1 1-.707-.707l9.9-9.9a.5.5 0 0 1 .707 0"/></g></mask></defs><circle cx="13" cy="13" r="13" fill="#dc2626" mask="url(#m3)"/></g></svg>`;


                const makeCellContent = (hotInstance, row, col, iconHtml) => {
                    const container = document.createElement("div");
                    container.style.display = "flex";
                    container.style.alignItems = "center";
                    container.style.position = "relative";
                    container.style.width = "100%";
                    // icon
                    const icon = document.createElement("span");
                    icon.style.position = "absolute";
                    icon.style.left = "8px";
                    icon.style.top = "50%";
                    icon.style.transform = "translateY(-50%)";
                    icon.style.marginRight = "4px";
                    icon.style.display = "flex";
                    icon.style.alignItems = "center";
                    icon.innerHTML = iconHtml;
                    container.appendChild(icon);
                    // text
                    const content = document.createElement("div");
                    content.textContent = hotInstance.getDataAtCell(row, col) || "";
                    content.style.marginLeft = "20px";
                    content.style.flexGrow = 1;
                    content.style.textAlign = "center";
                    content.style.whiteSpace = "nowrap";
                    container.appendChild(content);
                    return container;
                };

                const rowData = (data && data[row]) || [];
                const cellVal = rowData[5];
                const valStr = cellVal == null ? "" : String(cellVal);
                const length = valStr.length;
                const hasPosAndMaterial =
                    rowData[0] !== "" &&
                    rowData[0] !== undefined &&
                    rowData[1] !== undefined &&
                    rowData[1] !== "" &&
                    !Number.isNaN(rowData[1]);

                // --- Columna 5
                if (col === 5) {
                    const exists = subheadingValidity.get(`${row}-${col}`);
                    if (valStr === "**********") {
                        cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                            Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                            td.style.backgroundColor = resetBg;
                            td.title = "";
                            td.innerHTML = "";
                            const mask = document.createElement("div");
                            mask.style.width = "100%";
                            mask.style.textAlign = "center";
                            mask.style.fontWeight = "600";
                            mask.style.letterSpacing = "2px";
                            mask.textContent = "**********";
                            td.appendChild(mask);
                            cellProps.readOnly = true;
                        };
                        cellProperties.readOnly = true;
                        return cellProperties;
                    }

                    if (hasPosAndMaterial && length === 10) {
                        if (exists === false) {
                            cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                                Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                                td.style.backgroundColor = resetBg;
                                td.title = "Subpartida no existe";
                                td.innerHTML = "";
                                td.appendChild(makeCellContent(hotInstance, r, c, SVG_WARN));
                                cellProps.readOnly = false;
                            };
                            cellProperties.readOnly = false;
                            return cellProperties;
                        } else {
                            cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                                Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                                td.style.backgroundColor = resetBg;
                                td.title = "Subpartida existe";
                                td.innerHTML = "";
                                td.appendChild(makeCellContent(hotInstance, r, c, SVG_OK));
                                cellProps.readOnly = false;
                            };
                            cellProperties.readOnly = false;
                            return cellProperties;
                        }
                    }

                    if (hasPosAndMaterial && length !== 10) {
                        cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                            Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                            td.title = "Registre subpartida, parámetro de 10 digitos obligatorio";
                            td.innerHTML = "";
                            if (length > 0 && length < 10) {
                                td.style.backgroundColor = resetBg;
                                td.appendChild(makeCellContent(hotInstance, r, c, SVG_ERR));
                            } else {
                                td.style.backgroundColor = readonlyBg;
                            }
                            cellProps.readOnly = false;
                        };
                        cellProperties.readOnly = false;
                        return cellProperties;
                    }

                    cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                        Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                        td.style.backgroundColor = resetBg;
                        td.title = "";
                        td.innerHTML = "";
                        cellProps.readOnly = true;
                    };
                    cellProperties.readOnly = true;
                    return cellProperties;
                }

                // --- Columna 0
                if (col === 0) {
                    const hasPos = rowData[0] !== "" && rowData[0] !== undefined && rowData[0] !== null && !Number.isNaN(rowData[0]);
                    const missingMaterial = hasPos && (!rowData[1] || rowData[1] === "" || Number.isNaN(rowData[1]));
                    if (missingMaterial) {
                        cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                            Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                            td.style.backgroundColor = readonlyBg;
                            td.title = "Posicion no registrada";
                        };
                    } else {
                        cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                            Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                            td.style.backgroundColor = resetBg;
                            td.title = "";
                        };
                    }
                    return cellProperties;
                }

                // --- Columna 2: si no hay cantidad pero sí pos y material
                if (col === 2) {
                    const needsQty = (!rowData[2] || rowData[2] === "") && rowData[0] && rowData[1];
                    if (needsQty) {
                        cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                            Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                            td.style.backgroundColor = editableBg;
                            td.title = "Coloque la cantidad a registrar";
                        };
                    } else {
                        cellProperties.renderer = (hotInstance, td, r, c, prop, value, cellProps) => {
                            Handsontable.renderers.TextRenderer(hotInstance, td, r, c, prop, value, cellProps);
                            td.style.backgroundColor = resetBg;
                            td.title = "";
                        };
                    }
                    return cellProperties;
                }


                return cellProperties;
            }}

            afterChange={async (changes, source) => {
                if (!changes || changes.length === 0) return;
                if (!hotTableRef.current) return;
                const hot = hotTableRef.current.hotInstance;
                if (!hot) return;

                // Recolectores
                const batchChanges = [];
                const subheadingUpdates = new Map();
                const changesByRow = new Map();
                let needRecomputeTotal = false;

                // Helper para calcular total factura una sola vez
                const computeAndUpdateTotal = () => {
                    const dataAll = hot.getData();
                    console.log(hot.getData())
                    if (source === "edit") console.log("Es edit")
                    if (source === "CopyPaste.paste") console.log("Es de copy")
                    const totalSum = dataAll.reduce((sum, row) => {
                        const unit = parseFloat(String(row[3]).replace(/[$,]/g, "")) || 0;
                        const qty = parseFloat(row[2]) || 0;
                        return unit > 0 && qty > 0 ? sum + unit * qty : sum;
                    }, 0);
                    updateSharedState("totalfactura", formatMoney(totalSum.toFixed(2)));
                };

                // --- BRANCH: edit ---
                if (source === "edit") {
                    for (const [r, c, oldV, newV] of changes) {
                        // COL 5: subheading validation & global counter
                        if (c === 5) {
                            if (newV === "**********" && oldV !== "**********") {
                                await sleep(300);
                                if (!getCounter(r)) {
                                    if (!isLoading2) {
                                        batchChanges.push([r, c, ""]);
                                    } else {
                                        updateGlobalCounter(r, "**********");
                                    }
                                }
                                updateGlobalCounter(r, newV);
                            }
                            try {
                                const exists = await checkSubheadingExists(newV);
                                subheadingUpdates.set(`${r}-${c}`, exists);
                            } catch (err) {
                                console.error("checkSubheadingExists:", err);
                            }
                        }

                        // COL 2: quantity validation
                        if (c === 2) {
                            const valueX = parseFloat(newV);
                            const posValue = parseFloat(hot.getDataAtCell(r, 0));
                            try {
                                const record = await selectByPurchaseOrder(orderNumber, posValue);
                                const rec0 = record?.[0] || {};
                                if (isTable === "Create") {
                                    if (
                                        parseFloat(rec0.total_quantity) ===
                                        parseFloat(rec0.approved_quantity) +
                                        parseFloat(rec0.pending_quantity)
                                    ) {
                                        // limpiar varias columnas
                                        batchChanges.push([r, 2, ""]);
                                        batchChanges.push([r, 1, ""]);
                                        batchChanges.push([r, 3, ""]);
                                        batchChanges.push([r, 4, ""]);
                                        batchChanges.push([r, 5, ""]);
                                    } else if (valueX > parseFloat(rec0.total_quantity) || valueX < 1) {
                                        batchChanges.push([r, 2, ""]);
                                    }
                                } else {
                                    const supplierdata = await selectSupplierData({
                                        page: 1,
                                        limit: 1,
                                        equals: { invoice_id: invoi, base_bill_id: rec0?.base_bill_id },
                                    });
                                    const billed = supplierdata?.[0]?.billed_quantity || 0;
                                    if (
                                        (valueX >
                                            rec0?.total_quantity -
                                            (rec0?.approved_quantity + rec0?.pending_quantity) +
                                            billed ||
                                            valueX < 1) &&
                                        billed > 0
                                    ) {
                                        batchChanges.push([r, 2, ""]);
                                    } else if (billed === 0) {
                                        if (
                                            valueX > rec0?.total_quantity ||
                                            valueX +
                                            (rec0?.pending_quantity + rec0?.approved_quantity) >
                                            rec0?.total_quantity
                                        ) {
                                            batchChanges.push([r, 2, ""]);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error("selectByPurchaseOrder:", err);
                            }
                        }

                        // COL 4: recalc total factura (marcar para calcular al final)
                        if (c === 4) {
                            needRecomputeTotal = true;
                        }

                        // COL 2 o 3: recalcular col 4 (unit * qty)
                        if (c === 2 || c === 3) {
                            const qty = parseFloat(hot.getDataAtCell(r, 2));
                            const unitRaw = hot.getDataAtCell(r, 3);
                            const unit = parseFloat(String(unitRaw).replace(/[$,]/g, "")) || NaN;
                            if (!isNaN(qty) && !isNaN(unit)) {
                                batchChanges.push([r, 4, String(formatMoney(qty * unit))]);
                            } else {
                                batchChanges.push([r, 4, ""]);
                            }
                        }

                        // COL 0: buscar record y poblar otras columnas (material, subheading, precios)
                        if (c === 0 && position != null && orderNumber.trim() !== "") {
                            const pos = hot.getDataAtCell(r, 0);
                            if (!pos || isNaN(pos) || !orderNumber) continue;
                            const record = records.find(
                                (rr) => Number(rr.item) === Number(pos) && rr.purchase_order === orderNumber
                            );
                            if (!record) continue;

                            const {
                                material_code,
                                unit_price,
                                total_quantity,
                                pending_quantity,
                                approved_quantity,
                            } = record;

                            if (
                                parseFloat(approved_quantity) + parseFloat(pending_quantity) <
                                parseFloat(total_quantity) ||
                                (isTable !== "Create" &&
                                    parseFloat(approved_quantity) < parseFloat(total_quantity))
                            ) {
                                batchChanges.push([r, 1, material_code]);
                                const materialDetails = materialResults.find(
                                    (m) => String(m.material_code) === String(record.material_code)
                                );
                                const subheading =
                                    materialDetails?.data?.[0]?.subheading ?? undefined;
                                if (subheading) {
                                    batchChanges.push([r, 5, "**********"]);
                                    updateGlobalCounter(r, "**********");
                                } else {
                                    batchChanges.push([r, 5, subheading ?? ""]);
                                    updateGlobalCounter(r, subheading);
                                }

                                // precios / conversión
                                if (
                                    ((realcurrency === "USD" || realcurrency === "EUR") &&
                                        selectedCurrency === "COP") ||
                                    (selectedCurrency === "USD" && realcurrency === "EUR") ||
                                    (selectedCurrency === "EUR" && realcurrency === "USD") ||
                                    (realcurrency === "COP" && selectedCurrency !== "COP")
                                ) {
                                    batchChanges.push([
                                        r,
                                        3,
                                        String(formatMoney((unit_price / 100) * sharedState.TRMCOP)),
                                    ]);
                                } else if (realcurrency === selectedCurrency) {
                                    batchChanges.push([r, 3, String(formatMoney(unit_price / 100))]);
                                } else {
                                    batchChanges.push([r, 3, ""]);
                                    batchChanges.push([r, 4, ""]);
                                }
                            }
                        }
                    } 


                    if (batchChanges.length > 0) {
                        hot.batch(() => {
                            batchChanges.forEach(([rr, cc, val]) => hot.setDataAtCell(rr, cc, val));
                        });
                    }

                    if (subheadingUpdates.size > 0) {
                        setSubheadingValidity((prev) => {
                            const nm = new Map(prev);
                            for (const [k, v] of subheadingUpdates) nm.set(k, v);
                            return nm;
                        });
                    }

                    if (needRecomputeTotal) computeAndUpdateTotal();
                    hot.render();
                    return;
                } 

                // --- BRANCH: paste (CopyPaste.paste) ---
                if (source === "CopyPaste.paste") {

                    const promises = changes.map(async ([r, c, oldV, newV]) => {
                        // COL 5: subheading validation
                        if (c === 5) {
                            if (newV === "**********" && oldV !== "**********") {
                                if (!getCounter(r)) {
                                    if (!isLoading2) {
                                        batchChanges.push([r, c, ""]);
                                    } else {
                                        updateGlobalCounter(r, "**********");
                                    }
                                }
                                updateGlobalCounter(r, newV);
                            }
                            try {
                                const exists = await checkSubheadingExists(newV);
                                subheadingUpdates.set(`${r}-${c}`, exists);
                            } catch (err) {
                                console.error("checkSubheadingExists:", err);
                            }
                        }

                        // COL 2: quantity validation (usa records cached)
                        if (c === 2) {
                            const valueX = parseFloat(newV);
                            const posVal = parseFloat(hot.getDataAtCell(r, 0));
                            const rec = records.find(
                                (rr) => Number(rr.item) === Number(posVal) && rr.purchase_order === orderNumber
                            );
                            if (!rec) return;
                            if (isTable === "Create") {
                                if (
                                    parseFloat(rec.total_quantity) ===
                                    parseFloat(rec.approved_quantity) + parseFloat(rec.pending_quantity)
                                ) {
                                    batchChanges.push([r, 2, ""]);
                                    batchChanges.push([r, 1, ""]);
                                    batchChanges.push([r, 3, ""]);
                                    batchChanges.push([r, 4, ""]);
                                    batchChanges.push([r, 5, ""]);
                                } else if (valueX > parseFloat(rec.total_quantity) || valueX < 1) {
                                    batchChanges.push([r, 2, ""]);
                                }
                            } else {
                                try {
                                    const supplierdata = await selectSupplierData({
                                        page: 1,
                                        limit: 1,
                                        equals: { invoice_id: invoi, base_bill_id: rec.base_bill_id },
                                    });
                                    const billed = supplierdata?.[0]?.billed_quantity || 0;
                                    if (
                                        (valueX >
                                            rec.total_quantity -
                                            (rec.approved_quantity + rec.pending_quantity) +
                                            billed ||
                                            valueX < 1) &&
                                        billed > 0
                                    ) {
                                        batchChanges.push([r, 2, ""]);
                                    } else if (billed === 0) {
                                        if (
                                            valueX > rec.total_quantity ||
                                            valueX +
                                            (rec.pending_quantity + rec.approved_quantity) >
                                            rec.total_quantity
                                        ) {
                                            batchChanges.push([r, 2, ""]);
                                        }
                                    }
                                } catch (err) {
                                    console.error("selectSupplierData:", err);
                                }
                            }
                        }

                        // COL 4 recalc total factura
                        if (c === 4) needRecomputeTotal = true;

                        // COL 2 o 3 => recalc col 4
                        if (c === 2 || c === 3) {
                            const qty = parseFloat(hot.getDataAtCell(r, 2)) || 0;
                            const unit = parseFloat(String(hot.getDataAtCell(r, 3)).replace(/[$,]/g, "")) || 0;
                            batchChanges.push([r, 4, qty && unit ? String(formatMoney(qty * unit)) : ""]);
                        }

                        // COL 0 => registrar cambios por fila (para procesar más tarde)
                        if (c === 0 && position != null && orderNumber.trim() !== "") {
                            changesByRow.set(r, (newV || "").toString().trim());
                        }
                    });

                    await Promise.all(promises);

                    const perRowPromises = Array.from(changesByRow.entries()).map(async ([r, val]) => {
                        try {
                            const pos = hot.getDataAtCell(r, 0);
                            if (!orderNumber || !pos || orderNumber.trim() === "" || pos.toString().trim() === "" || isNaN(orderNumber) || isNaN(pos)) return;
                            const record = records.find(rr => Number(rr.item) === Number(pos) && rr.purchase_order === orderNumber);
                            if (!record) return;
                            console.log("entramos?2")
                            const materialDetails = materialResults.find(m => String(m.material_code) === String(record.material_code));
                            const subheading = materialDetails?.data?.[0]?.subheading ?? "";
                            console.log("entramos?3")
                            batchChanges.push([r, 1, record.material_code]);
                            console.log("parte copy: ", subheading)
                            if (subheading) {
                                batchChanges.push([r, 5, "**********"]);
                                updateGlobalCounter(r, "**********");
                            } else {
                                batchChanges.push([r, 5, subheading]);
                                updateGlobalCounter(r, subheading);
                            }
                            // precios
                            if (
                                ((realcurrency === "USD" || realcurrency === "EUR") && selectedCurrency === "COP") ||
                                (selectedCurrency === "USD" && realcurrency === "EUR") ||
                                (selectedCurrency === "EUR" && realcurrency === "USD") ||
                                (realcurrency === "COP" && selectedCurrency !== "COP")
                            ) {
                                batchChanges.push([r, 3, String(formatMoney((record.unit_price / 100) * sharedState.TRMCOP))]);
                            } else if (realcurrency === selectedCurrency) {
                                batchChanges.push([r, 3, String(formatMoney(record.unit_price / 100))]);
                            } else {
                                batchChanges.push([r, 3, ""]);
                                batchChanges.push([r, 4, ""]);
                            }
                        } catch (err) {
                            console.error("Error procesando row paste:", err);
                        }
                    });

                    await Promise.all(perRowPromises);

                    if (batchChanges.length > 0) {
                        hot.batch(() => {
                            batchChanges.forEach(([r, c, v]) => hot.setDataAtCell(r, c, v));
                        });
                    }

                    if (subheadingUpdates.size > 0) {
                        setSubheadingValidity((prev) => {
                            const nm = new Map(prev);
                            for (const [k, v] of subheadingUpdates) nm.set(k, v);
                            return nm;
                        });
                    }

                    if (needRecomputeTotal) computeAndUpdateTotal();
                    hot.render();
                    return;
                } 
            }}

            contextMenu={{
                callback: (key, options) => {
                    setTimeout(() => { }, 100);
                },
                items: {
                    copy: { name: "Copiar" },
                    cut: { name: "Cortar" },
                    undo: { name: "Deshacer" },
                },
            }}
        />
    );
};

