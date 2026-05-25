"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var fs_1 = require("fs");
var path_1 = require("path");
// Load environment variables for the worker
var workerEnvPath = path_1.default.resolve(process.cwd(), ".env.worker");
var defaultEnvPath = path_1.default.resolve(process.cwd(), ".env");
if (fs_1.default.existsSync(workerEnvPath)) {
    (0, dotenv_1.config)({ path: workerEnvPath });
}
else if (fs_1.default.existsSync(defaultEnvPath)) {
    (0, dotenv_1.config)({ path: defaultEnvPath });
}
else {
    (0, dotenv_1.config)();
}
