import { spawnSync } from "child_process";
import fs from "fs";
import net from "net";

const REQUIRED_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const OPTIONAL_ENV = ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY", "SUPABASE_DB_URL"];
const TABLES = [
  "profiles",
  "courses",
  "assignments",
  "assignment_notes",
  "quiz_attempts",
  "quiz_questions",
  "missed_questions",
  "game_sessions",
  "reward_events",
  "user_preferences",
  "notifications",
  "study_sessions",
  "avatar_items",
  "user_avatar_items",
  "achievements",
  "study_resources",
  "topic_mastery",
  "flashcards",
  "study_plans",
];

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function mask(value) {
  if (!value) return "missing";
  if (value.length <= 12) return "set";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function checkPort(port, host = "::") {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve({ port, available: false }));
    server.once("listening", () => server.close(() => resolve({ port, available: true })));
    server.listen(port, host);
  });
}

async function supabaseFetch(path, init = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, status: 0, text: "Missing Supabase URL/key" };
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers || {}),
    },
  });
  return { ok: response.ok, status: response.status, text: await response.text() };
}

loadEnv();

console.log("CramDeck Scholar diagnostics\n");

console.log("Environment");
for (const key of REQUIRED_ENV) console.log(`- ${key}: ${mask(process.env[key])}`);
for (const key of OPTIONAL_ENV) console.log(`- ${key}: ${mask(process.env[key])}`);

const desiredPort = Number(process.env.PORT || 3010);
const portStatus = await checkPort(desiredPort);
console.log("\nPort");
console.log(`- Requested port: ${desiredPort}`);
console.log(`- Status: ${portStatus.available ? "available" : "busy"}`);
if (!portStatus.available) console.log(`- Startup fallback: npm run dev will try ${desiredPort + 1} next`);

console.log("\nSupabase");
const health = await supabaseFetch("/rest/v1/", { headers: { Accept: "application/json" } });
console.log(`- REST connection: ${health.status ? `${health.status}` : "not checked"} ${health.ok ? "ok" : "check configuration"}`);

console.log("- Auth configuration: client keys present; interactive signup/login must be verified in browser");

console.log("\nDatabase tables");
for (const table of TABLES) {
  const result = await supabaseFetch(`/rest/v1/${table}?select=id&limit=1`, {
    headers: { Prefer: "count=exact" },
  });
  let status = result.ok ? "ok" : `missing/error (${result.status})`;
  if (!result.ok && result.text.includes("schema cache")) status = "missing: run supabase/full-setup.sql";
  console.log(`- ${table}: ${status}`);
}

console.log("\nStorage");
const buckets = await supabaseFetch("/storage/v1/bucket");
if (buckets.ok) {
  const parsed = JSON.parse(buckets.text || "[]");
  const bucket = parsed.find((item) => item.name === "assignments" || item.id === "assignments");
  console.log(`- assignments bucket: ${bucket ? `ok (${bucket.public ? "public" : "private"})` : "missing"}`);
} else {
  console.log(`- assignments bucket: could not check (${buckets.status})`);
}
console.log("- upload path: {user_id}/assignments/{timestamp}-{filename}");
console.log("- storage policies: verify by running supabase/storage-policies.sql if uploads fail");

console.log("\nBuild");
const build = spawnSync("npm", ["run", "build"], { stdio: "pipe", encoding: "utf8" });
console.log(`- npm run build: ${build.status === 0 ? "passed" : "failed"}`);
if (build.status !== 0) {
  console.log(build.stdout);
  console.error(build.stderr);
  process.exitCode = 1;
}
