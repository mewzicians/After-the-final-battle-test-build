"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2]) || 8765;
http.createServer((request, response) => {
  const requested = decodeURIComponent((request.url || "/").split("?")[0]);
  const target = requested === "/"
    ? path.join(root, "After the Final Battle - Complete World Experiment.html")
    : path.join(root, requested.replace(/^\/+/, ""));
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": path.extname(target) === ".html" ? "text/html; charset=utf-8" : "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving complete experiment at http://127.0.0.1:${port}/\n`);
});
