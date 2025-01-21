"use client";

import { useState } from "react";
import { type InvoiceEmailProps } from "@lib/definitions";

export default function Test() {
  const [response, setResponse] = useState(null);

  const click = async () => {
    const data: InvoiceEmailProps = {
      invoice_id: "oasd123",
      type: "Ingreso",
    };

    const res = await fetch("/api/mail/supplier-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    setResponse(result);
  };

  return (
    <main className="flex flex-col gap-y-4 h-screen w-screen items-center justify-center bg-base-content">
      <button className="btn btn-primary" onClick={click}>
        Click me please
      </button>
      {response && (
        <div className="mockup-code max-w-xl">
          <pre data-prefix="$">
            <code>{JSON.stringify(response)}</code>
          </pre>
        </div>
      )}
    </main>
  );
}
