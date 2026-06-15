import { existsSync, readFileSync } from "fs";
import path from "path";
import postgres from "postgres";

const root = process.cwd();
const envFiles = [".env.local", ".env"];

function loadEnvFile(file) {
  const fullPath = path.join(root, file);
  if (!existsSync(fullPath)) return;

  const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;
    const rawValue = valueParts.join("=").trim();
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

for (const file of envFiles) loadEnvFile(file);

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const fullSetupPath = path.join(root, "supabase", "full-setup.sql");
const schemaPath = path.join(root, "supabase", "schema.sql");
const policiesPath = path.join(root, "supabase", "policies.sql");

if (!existsSync(fullSetupPath) && (!existsSync(schemaPath) || !existsSync(policiesPath))) {
  console.error("Missing supabase/full-setup.sql or the schema/policies SQL files.");
  process.exit(1);
}

if (!databaseUrl) {
  console.error(`
Supabase database URL is missing.

To run setup automatically:
1. Open Supabase Dashboard > Project Settings > Database.
2. Copy the connection string for your project database.
3. Add it to .env.local as SUPABASE_DB_URL.
4. Run npm run setup:supabase again.

Manual setup still works from /setup or README.md.
`);
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  ssl: "require",
});

try {
  if (existsSync(fullSetupPath)) {
    console.log("Running supabase/full-setup.sql...");
    await sql.unsafe(readFileSync(fullSetupPath, "utf8"));
    console.log("Full Supabase setup complete.");
  } else {
    console.log("Running supabase/schema.sql...");
    await sql.unsafe(readFileSync(schemaPath, "utf8"));
    console.log("Schema complete.");

    console.log("Running supabase/policies.sql...");
    await sql.unsafe(readFileSync(policiesPath, "utf8"));
    console.log("Policies complete.");
  }

  console.log("Supabase database setup finished. Restart the app with npm run dev.");
} catch (error) {
  console.error("Supabase setup failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
