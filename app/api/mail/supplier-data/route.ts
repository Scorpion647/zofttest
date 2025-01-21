import { NextResponse } from "next/server";
import { EmailTemplate } from "@/app/_ui/email-templates/invoice";
import { Resend } from "resend";
import { createClient } from "@lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.invoice_id || !data.type || !data.header) {
    console.error({
      error: "Invalid data",
      data,
    });
    return NextResponse.json({
      error: {
        message: "Invalid data",
      },
      data,
    });
  }

  const supabase = await createClient();
  const { data: sbdata, error: sberror } = await supabase.rpc(
    "get_invoice_email",
    { invoice_id: data.invoice_id },
  );

  if (sberror) {
    console.error(sberror);
    return NextResponse.json({
      error: sberror,
    });
  }

  const email_data = sbdata[0];

  if (!email_data.email || email_data.email.length === 0) {
    return NextResponse.json({
      error: {
        message: "No hay datos de contacto",
      },
    });
  }

  function transformDateTime(inputDate: string | number | Date) {
    const date = new Date(inputDate);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedMinutes = minutes < 10 ? "00" : minutes;

    const formattedDate = `${year}-${month}-${day} ${hours}:${formattedMinutes} ${ampm}`;

    return formattedDate;
  }

  const { error } = await resend.emails.send({
    from: "Zofzf team <team@zofzf.online>",
    to: [email_data.email],
    subject: data.subject ?? "Aviso",
    react: EmailTemplate({
      header: data.header,
      bill: email_data.bill_number,
      date: transformDateTime(email_data.invoice_updated_at),
      invoice_id: email_data.invoice_id,
      purchase_order: email_data.purchase_order,
      supplier_name: email_data.supplier_name,
      type: data.type,
      body: data.body ?? undefined,
      reason: data.reason ?? undefined,
    }),
  });

  if (error) {
    console.error(error);
    return NextResponse.json({
      error: {
        message: "Server error",
      },
    });
  }

  return NextResponse.json({
    message: "Datos recibidos con éxito",
    receivedData: data,
  });
}
