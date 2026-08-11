"use strict";

const { execFileSync } = require("child_process");
const path = require("path");

const tools = __dirname;
execFileSync(process.execPath, [path.join(tools, "compose_experiment.js")], { stdio: "inherit" });
execFileSync(process.execPath, [path.join(tools, "build_html.js")], { stdio: "inherit" });
