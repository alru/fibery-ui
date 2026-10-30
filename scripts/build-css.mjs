// Concatenates src/styles/*.css into dist/style.css so apps import a single file with no @import resolution.
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";

// base.css first: it declares the layer order and the helper tokens the rest rely on.
const files = ["base", "button", "display", "chart", "form", "overlay"];

mkdirSync("dist", {recursive: true});
writeFileSync(
  "dist/style.css",
  files.map((name) => readFileSync(`src/styles/${name}.css`, "utf8")).join("\n"),
);
