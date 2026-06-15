import { spawn } from "child_process";
import net from "net";

const START_PORT = Number(process.env.PORT || 3010);
const HOST = process.env.HOSTNAME || "::";

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, HOST);
  });
}

async function findPort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error(`No free port found from ${startPort} to ${startPort + 49}.`);
}

const port = await findPort(START_PORT);

if (port !== START_PORT) {
  console.log(`Port ${START_PORT} is busy. Using port ${port}.`);
} else {
  console.log(`Using port ${port}.`);
}

const child = spawn(
  "next",
  ["dev", "--turbopack", "--port", String(port)],
  {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: String(port) },
  }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
