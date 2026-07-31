// Runtime DB bootstrap for the Docker image. Applies the schema SQL baked in at
// build time using the bundled `pg` client, so the heavy Prisma CLI dependency
// tree doesn't need to ship in the standalone runtime image.
//
// Idempotent: if the schema is already present (the "User" table exists), it
// skips. This covers the common self-host case of an existing volume. For real
// schema *changes* across versions, regenerate the baked SQL at build time.
import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

const client = new Client({ connectionString: url });

async function tableExists(name) {
  // Quote the identifier: Prisma creates mixed-case names like "User", which an
  // unquoted regclass lookup would fold to lowercase and miss.
  const { rows } = await client.query("SELECT to_regclass($1) AS reg", [
    `public."${name}"`,
  ]);
  return rows[0].reg != null;
}

try {
  await client.connect();

  if (await tableExists("User")) {
    console.log("Schema already present — skipping bootstrap.");
  } else {
    console.log("Applying schema...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Schema applied.");
  }
} catch (err) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // no active transaction
  }
  console.error("Schema bootstrap failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
