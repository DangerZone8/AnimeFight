import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const required = ["index.html", "src/game.js", "src/ai.js", "src/style.css"];
for (const file of required) await access(file);

const html = await readFile("index.html", "utf8");
if (!html.includes('id="game-canvas"') || !html.includes('src="src/game.js"')) {
  throw new Error("Missing game entry points");
}

execFileSync(process.execPath, ["--check", "src/game.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "src/ai.js"], { stdio: "inherit" });


// Generate original 8-fighter sprite atlases before copying static assets.
execFileSync(process.execPath, ["scripts/generate-fighter-sheets.js"], { stdio: "inherit" });

// Vercel static output directory must exist after the build command.
// Copy the site with its relative src/ paths intact so browser module imports work.
await rm("public", { recursive: true, force: true });
await mkdir("public", { recursive: true });
await cp("index.html", "public/index.html");
await cp("src", "public/src", { recursive: true });
await cp("assets", "public/assets", { recursive: true });

for (const file of ["public/index.html", "public/src/game.js", "public/src/ai.js", "public/src/style.css"]) {
  await access(file);
}

const game = await readFile("src/game.js", "utf8");
if (!game.includes("function drawFighter(f){") || game.includes('import("./arena3d.js")')) throw new Error("The active match renderer must be the 2D canvas fighter renderer");
console.log("Production site generated in public/; 2D canvas renderer, entry points, and JavaScript syntax checks passed.");
