import * as React from "react";

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
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = (
  params,
) => (
  <div>
    <h1>{params.header}</h1>
    <ul>
      <li>
        <b>Tipo de solicitud:</b> <span>{params.type}</span>
      </li>
      {params.reason && (
        <li>
          <b>Razón:</b> <span>{params.reason}</span>
        </li>
      )}
      <li>
        <b>Número de solicitud:</b> <span>{params.invoice_id}</span>
      </li>
      <li>
        <b>Fecha Solicitud:</b> <span>{params.date}</span>
      </li>
      <li>
        <b>Proveedor:</b> <span>{params.supplier_name}</span>
      </li>
      <li>
        <b>Factura:</b> <span>{params.bill}</span>
      </li>
      <li>
        <b>Orden de compra:</b> <span>{params.purchase_order}</span>
      </li>
    </ul>

    {params.body && <div>
      <p>  </p>
      <p>  </p>
      <h2>Razon de Rechazo</h2>
      <b>{params.body}</b>
      </div>}
  </div>
);
