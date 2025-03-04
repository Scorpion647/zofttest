import { createSeedClient } from "@snaplet/seed";
import type { Database } from "./app/_lib/database.types";
import { copycat } from "@snaplet/copycat";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const seed = await createSeedClient();
  await seed.$resetDatabase();

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!,
  );

  for (let i = 0; i < 10; i++) {
    const email = copycat.email(i).toLowerCase();
    const password = "Password123!";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: copycat.firstName(i),
        },
      },
    });

    if (error) {
      console.error(error);
      process.exit();
    }
  }

  const { data: databaseProfiles } = await supabase.from("profiles").select();

  const profiles =
    databaseProfiles?.map((profile) => ({
      profile_id: profile.profile_id,
      full_name: profile.full_name,
      user_role: profile.user_role,
      email: profile.email,
    })) ?? [];

  const materials = await seed.materials((x) =>
    x(20, () => ({
      subheading: null,
    })),
  );

  const suppliers = await seed.suppliers((x) =>
    x(5, {
      supplier_employees: (x) =>
        x(
          { min: profiles.length > 0 ? 1 : 0, max: profiles.length },
          ({ seed }) => ({
            profile_id: copycat.oneOf(seed, profiles).profile_id,
          }),
        ),
    }),
  );

  const base_bills = await seed.base_bills(
    (x) =>
      x({ max: 20 }, ({ seed }) => ({
        material_code: copycat.oneOf(seed, materials.materials).material_code,
        total_quantity: copycat.float(seed, { max: 1000 }),
      })),
    { connect: suppliers },
  );

  const invoice_data = await seed.invoice_data((x) => x(10), {
    connect: suppliers,
  });

  const invoice_docs = await seed.invoice_docs((x) => x(10), {
    connect: invoice_data,
  });

  process.exit();
}

main();
