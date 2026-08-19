import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

/**
 * Adds outcome enum value 'Ghosted' and remaps rows from 'No Reply'.
 * Does not drop 'No Reply' from the enum — that would need a follow-up
 * (recreate type / rewrite dependents). 'Ghosted' is enough for the app.
 */
async function main() {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db");

  await db.execute(
    sql`ALTER TYPE "public"."outcome" ADD VALUE IF NOT EXISTS 'Ghosted'`
  );

  const updated = await db.execute(sql`
    UPDATE applications
    SET outcome = 'Ghosted'
    WHERE outcome = 'No Reply'
    RETURNING id
  `);

  const rows = Array.isArray(updated)
    ? updated
    : ((updated as { rows?: unknown[] }).rows ?? []);

  console.log(
    `Ghosted rename complete: updated ${rows.length} application(s) from 'No Reply' to 'Ghosted'.`
  );
  console.log(
    "Note: the old enum value 'No Reply' is still present on type outcome; removing it is a follow-up."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
