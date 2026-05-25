import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables for the worker
const workerEnvPath = path.resolve(process.cwd(), ".env.worker");
const defaultEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(workerEnvPath)) {
  config({ path: workerEnvPath });
} else if (fs.existsSync(defaultEnvPath)) {
  config({ path: defaultEnvPath });
} else {
  config();
}
