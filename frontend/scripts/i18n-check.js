/* Simple i18n guard:
   Flags common hard-coded UI strings in /app and /components.
   This is not perfect, but it catches accidental "English leftovers" fast.

   Fixes:
   - Avoid false positive from self-closing tags: <RiskBadge /> : null </div>
   - Only flag JSX text that contains letters (so "(123)" won't be flagged)
   - Do NOT globally ignore className= lines, otherwise almost all JSX is skipped
*/
const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components"];
const exts = new Set([".ts", ".tsx"]);

// Keep ignores narrow: only obvious non-UI lines.
const ignore = [
  /process\.env/,
  /require\(/,
  /console\./,
  /^\s*\/\//,
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(p))) out.push(p);
  }
  return out;
}

function hasLetters(s) {
  // Latin + Cyrillic + Kazakh letters
  return /[A-Za-zА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(s);
}

function checkFile(file) {
  const s = fs.readFileSync(file, "utf8");
  const lines = s.split("\n");

  const bad = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (ignore.some((r) => r.test(line))) continue;

    // 1) Obvious JSX text nodes (>Hello<) that don't use t(...)
    // Avoid matching self-closing tags like <X /> : null</div> by requiring ">" NOT preceded by "/"
    // and require the captured text to contain letters.
    const re = /(?<!\/)>([^<{][^<]*?)</g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const txt = (m[1] || "").replace(/\s+/g, " ").trim();
      if (!txt) continue;
      if (!hasLetters(txt)) continue;
      if (/t\(["']/.test(line)) break; // line uses t(...) already
      bad.push({ line: i + 1, text: line.trim() });
      break;
    }

    // 2) Hard-coded strings in visible props
    if (/(title|placeholder|aria-label)\s*=\s*["'][^"']+["']/.test(line) && !/t\(["']/.test(line)) {
      bad.push({ line: i + 1, text: line.trim() });
      continue;
    }
  }
  return bad;
}

let failures = 0;

for (const root of ROOTS) {
  const dir = path.join(process.cwd(), root);
  if (!fs.existsSync(dir)) continue;

  for (const file of walk(dir)) {
    const bad = checkFile(file);
    if (bad.length) {
      failures++;
      console.log(`\n[i18n-check] ${file}`);
      bad.slice(0, 12).forEach((b) => console.log(`  L${b.line}: ${b.text}`));
      if (bad.length > 12) console.log(`  ... +${bad.length - 12} more`);
    }
  }
}

if (failures) {
  console.error(`\n[i18n-check] FAILED: ${failures} file(s) contain suspected hard-coded UI strings.`);
  process.exit(1);
} else {
  console.log("[i18n-check] OK");
}