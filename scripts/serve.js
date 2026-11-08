import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8" };
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) && file !== path.join(root,"index.html")) throw new Error("Invalid path");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type":"text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(Number(process.env.PORT || 4173), "0.0.0.0", () => console.log("AnimeFight: http://localhost:" + (process.env.PORT || 4173)));