import * as React from "react";
import Image from "next/image";

export interface EmailTemplateProps {
  invoice_id: string;
  type: string;
  date: string;
  supplier_name: string;
  bill: string;
  purchase_order: string;
  reason?: string;
  body?: string;
  header: string;
  fmm?: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  params,
) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      background: "linear-gradient(to bottom, #f5f5f5, #e0e0e0)",
      padding: "40px 20px",
      color: "#333",
      display: "flex",
      justifyContent: "center",
    }}>
    <div
      style={{
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        maxWidth: "600px",
        width: "100%",
        border: "1px solid #ddd",
      }}>
      {/* Encabezado */}
      <h1
        style={{
          color: "#004136",
          textAlign: "center",
          borderBottom: "3px solid #F1D803",
          paddingBottom: "10px",
          marginBottom: "20px",
          width: "100%",
          boxSizing: "border-box",
        }}>
        {params.type === "Actualizacion" ?
          <>
            <span style={{ whiteSpace: "nowrap" }}>
              El estado de su asociación ha sido cambiado por
            </span>
            <br />
            <span
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color:
                  params.header.includes("Aprobado") ? "green"
                  : params.header.includes("Rechazado") ? "red"
                  : "#F1D803",
              }}>
              {params.header
                .replace("El estado de su asociacion a sido cambiado por :", "")
                .trim()}
            </span>
          </>
        : params.header}
      </h1>

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          width: "100%",
        }}>
        {/* Columna izquierda: Imagen de Ecopetrol */}
        <div style={{ flex: 1, textAlign: "center", paddingRight: "20px" }}>
          <Image
            src="https://zofttest.vercel.app/grupo-ecopetrol.png"
            alt="Reficar"
            width="300"
            height="80"
            style={{ borderRadius: "8px" }}
          />
        </div>

        {/* Línea separadora */}
        <div
          style={{
            width: "1px",
            backgroundColor: "#ddd",
            height: "80px",
          }}></div>

        {/* Columna derecha: Bloque con logo ZOFT y textos */}
        <div style={{ flex: 1, textAlign: "left", paddingLeft: "20px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="https://zofttest.vercel.app/zoft.png"
              alt="Zoft"
              width="64"
              height="64"
              style={{ borderRadius: "8px", marginRight: "15px" }}
            />
            <div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "#004136",
                  fontFamily: "Arial, sans-serif",
                }}>
                ZOFT
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#555",
                  marginTop: "0px",
                  fontFamily: "Arial, sans-serif",
                  fontStyle: "italic",
                }}>
                Powered by Ecopetrol S.A.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la solicitud */}
      <ul
        style={{
          listStyle: "none",
          padding: "0",
          margin: "0",
        }}>
        <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
          <b>Tipo de solicitud:</b> <span>{params.type}</span>
        </li>
        {params.reason && (
          <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
            <b>Razón:</b> <span>{params.reason}</span>
          </li>
        )}
        <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
          <b>Número de solicitud:</b> <span>{params.invoice_id}</span>
        </li>
        <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
          <b>Fecha Solicitud:</b> <span>{params.date}</span>
        </li>
        <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
          <b>Proveedor:</b> <span>{params.supplier_name}</span>
        </li>
        <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
          <b>Factura:</b> <span>{params.bill}</span>
        </li>
        <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
          <b>Orden de compra:</b> <span>{params.purchase_order}</span>
        </li>
        {params.fmm && params.header === "Aprobado" && (
          <li style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
            <b>FMM:</b> <span>{params.fmm}</span>
          </li>
        )}
      </ul>

      {/* Razón de Rechazo */}
      {params.body && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#F1D803",
            borderRadius: "8px",
            color: "#004136",
            fontWeight: "bold",
            textAlign: "center",
          }}>
          <h2 style={{ margin: "0 0 10px" }}>Razón de Rechazo</h2>
          {params.body}
        </div>
      )}

      {/* Pie de página */}
      <div
        style={{
          marginTop: "30px",
          textAlign: "center",
          fontSize: "12px",
          color: "#666",
        }}>
        <p style={{ margin: "0" }}>
          Este es un mensaje automático, por favor no responda a este correo.
        </p>
        <p style={{ margin: "0" }}>
          © {new Date().getFullYear()} Reficar - Todos los derechos reservados.
        </p>
      </div>
    </div>
  </div>
);
