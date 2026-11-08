import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const required = ["index.html", "src/game.js", "src/ai.js", "src/arena3d.js", "src/style.css"];
for (const file of required) await access(file);

const html = await readFile("index.html", "utf8");
if (!html.includes('id="game-canvas"') || !html.includes('src="src/game.js"')) {
  throw new Error("Missing game entry points");
}

execFileSync(process.execPath, ["--check", "src/game.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "src/ai.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "src/arena3d.js"], { stdio: "inherit" });

// Vercel's static output directory must exist after the build command.
// Copy the site with its relative src/ paths intact so browser module imports work.
await rm("public", { recursive: true, force: true });
await mkdir("public", { recursive: true });
await cp("index.html", "public/index.html");
await cp("src", "public/src", { recursive: true });

for (const file of ["public/index.html", "public/src/game.js", "public/src/ai.js", "public/src/arena3d.js", "public/src/style.css"]) {
  await access(file);
}

console.log("Production site generated in public/; entry points, 3D renderer, and JavaScript syntax checks passed.");
