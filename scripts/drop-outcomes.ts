import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

/** Clears Withdrew/Declined outcomes. Does not drop those enum values. */
async function main() {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db");

  const updated = await db.execute(sql`
    UPDATE applications
    SET outcome = NULL
    WHERE outcome IN ('Withdrew', 'Declined')
    RETURNING id
  `);

  const rows = Array.isArray(updated)
    ? updated
    : ((updated as { rows?: unknown[] }).rows ?? []);

  console.log(
    `Outcome cleanup complete: cleared ${rows.length} application(s) with Withdrew or Declined.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
