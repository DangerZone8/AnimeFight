import { access, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const required = ["index.html","src/game.js","src/ai.js","src/style.css"];
for (const file of required) await access(file);
const html = await readFile("index.html","utf8");
if (!html.includes('id="game-canvas"') || !html.includes('src="src/game.js"')) throw new Error("Missing game entry points");
execFileSync(process.execPath, ["--check", "src/game.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "src/ai.js"], { stdio: "inherit" });
console.log("Static production and JavaScript syntax checks passed.");