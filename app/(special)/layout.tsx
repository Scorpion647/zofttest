import { createClient } from "@lib/supabase/server";
import { Suspense } from "react";
import PageLoader from "../_ui/pageLoader";

export default async function SpecialLayout({
  user,
  admin,
  guest,
}: {
  user: React.ReactNode;
  admin: React.ReactNode;
  guest: React.ReactNode;
}) {
  let userRole: string = "guest";
  let isLoading = true;

  async function handleRole() {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_user_role");

    console.info("data: ", data);
    return data ?? "guest";
  }

  isLoading = false;
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <Suspense fallback={<PageLoader />}>
        {handleRole().then((role) => {
          userRole = role;

          isLoading = false;
          return (
            <>
              {isLoading ?
                <PageLoader />
              : userRole === "administrator" ?
                admin
              : userRole === "employee" ?
                user
              : guest}
            </>
          );
        })}
      </Suspense>
    </main>
  );
}
