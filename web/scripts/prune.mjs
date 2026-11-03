import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(new URL("..", import.meta.url));
const docs = resolve(web, "..", "docs");

const drop = (target) => {
  if (!existsSync(target)) return;
  rmSync(target, { recursive: true, force: true });
  console.log(`removed ${target}`);
};

const sweep = (dir, keep) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (keep.test(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      drop(full);
      continue;
    }
    rmSync(full, { force: true });
    console.log(`removed ${full}`);
  }
};

drop(join(docs, "assets"));
drop(join(docs, "vendor"));
sweep(docs, /^(data|robots\.txt|\.nojekyll)$/);
