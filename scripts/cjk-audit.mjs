import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "layouts"),
  path.join(ROOT, "src", "pages"),
];
const findings = [];

function toPosix(input) {
  return input.replaceAll("\\", "/");
}

function collectAstroFiles(dir, bucket) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectAstroFiles(full, bucket);
      continue;
    }
    if (full.endsWith(".astro")) {
      bucket.push(full);
    }
  }
}

function pushFinding(file, message) {
  findings.push(`${toPosix(path.relative(ROOT, file))}: ${message}`);
}

function auditLocalizedTags(file, source) {
  const tagRe = /<[^>]+>/gs;
  let match = tagRe.exec(source);
  while (match) {
    const rawTag = match[0];
    if (rawTag.includes("t(lang")) {
      const tag = rawTag.replace(/\s+/g, " ");
      if (tag.includes("font-mono") && tag.includes("uppercase")) {
        pushFinding(
          file,
          "localized text should not use `font-mono` with `uppercase` (CJK readability risk).",
        );
      }
      if (tag.includes("font-mono") && tag.includes("text-[10px]")) {
        pushFinding(
          file,
          "localized text should avoid `font-mono text-[10px]` (too small on Windows/CJK).",
        );
      }
    }
    match = tagRe.exec(source);
  }
}

function auditLayoutBodyClass(file, source) {
  const bodyClassRe = /<body\s+class="([^"]+)"/;
  const match = bodyClassRe.exec(source);
  if (!match) return;
  if (/\bantialiased\b/.test(match[1])) {
    pushFinding(
      file,
      "remove `antialiased` from <body> to avoid forcing non-native smoothing behavior.",
    );
  }
}

function auditGlobalCss(file, source) {
  const requiredChecks = [
    {
      re: /html:lang\(zh\)\s*{[\s\S]*?--font-ui:/,
      label: "missing zh font-ui stack override",
    },
    {
      re: /html:lang\(ja\)\s*{[\s\S]*?--font-ui:/,
      label: "missing ja font-ui stack override",
    },
    {
      re: /html:lang\(zh\)\s+\.hearth-kicker,[\s\S]*?html:lang\(ja\)\s+\.hearth-kicker/,
      label: "missing CJK kicker override block",
    },
    {
      re: /html:lang\(zh\)\s+\.hearth-meta,[\s\S]*?html:lang\(ja\)\s+\.hearth-meta/,
      label: "missing CJK meta override block",
    },
  ];

  for (const check of requiredChecks) {
    if (!check.re.test(source)) {
      pushFinding(file, check.label);
    }
  }
}

const astroFiles = [];
for (const dir of TARGET_DIRS) {
  collectAstroFiles(dir, astroFiles);
}

for (const file of astroFiles) {
  const source = readFileSync(file, "utf8");
  auditLocalizedTags(file, source);
}

const layoutFile = path.join(ROOT, "src", "layouts", "Layout.astro");
auditLayoutBodyClass(layoutFile, readFileSync(layoutFile, "utf8"));

const globalCssFile = path.join(ROOT, "src", "styles", "global.css");
auditGlobalCss(globalCssFile, readFileSync(globalCssFile, "utf8"));

if (findings.length > 0) {
  console.error("[FAIL] CJK typography audit found issues:");
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  process.exit(1);
}

console.log("[PASS] CJK typography audit passed.");
