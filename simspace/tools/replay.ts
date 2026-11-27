// Headless replay of the whole lab, for maintainers (adapted from
// mathieu-benoit/sbx-lab's simspace/tools/replay.ts).
//
// Extracts every runnable block (bash, sh, console, prompt) from the markdown,
// in order, exactly as the Run buttons would send it, and plays them through the
// real Simspace engine, tracking agent sessions per terminal. It reports:
//   - any block no scenario matches (a lab that dead-ends),
//   - any block that lands on an error path (a scenario whose id ends in
//     "-error": the lab's own steps contradict each other),
//   - the milestones (steps) that the replay never completes.
// `validate` checks that each command matches *some* scenario; this checks that
// the scenarios still work together, in the order a learner meets them.
// Blocks with a Save button (save-as=) are not replayed: the Save button only
// writes a file.
//
//   docker compose run --rm replay
//   docker compose run --rm replay node scripts/run-ts.mjs scripts/replay.ts /labs/score -v
//
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { Simulator } from "@dockersamples/simspace-simulator";

const labDir = process.argv[2];
const verbose = process.argv[3] === "-v";
const lab = parseYaml(readFileSync(join(labDir, "labspace.yaml"), "utf8"));
const spec = readFileSync(join(labDir, lab.simulator), "utf8");
const sim = new Simulator({ spec, files: lab.files ?? {} });

type Item = { section: string; term: string; kind: "cmd" | "prompt"; text: string };
const items: Item[] = [];
const allSteps = new Set<string>();
const first = lab.terminals?.[0]?.id ?? "terminal";

for (const sec of lab.sections) {
  for (const st of sec.steps ?? []) allSteps.add(st.id);
  if (!sec.contentPath) continue;
  const md = readFileSync(join(labDir, sec.contentPath), "utf8");
  const re = /^([ \t]*)```(\w+)([^\n]*)\n([\s\S]*?)^\1```/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const [, indent, langRaw, meta, bodyRaw] = m;
    const lang = langRaw.toLowerCase();
    if (!["bash", "sh", "console", "prompt"].includes(lang)) continue;
    if (/no-run-button|save-as=/.test(meta)) continue;
    const term = /terminal-id=(\S+)/.exec(meta)?.[1] ?? first;
    const body = bodyRaw
      .split("\n")
      .map((l) => (indent && l.startsWith(indent) ? l.slice(indent.length) : l))
      .join("\n")
      .replace(/\s+$/, "")
      // The app substitutes $$variables$$ at render time, before a Run button sends the block.
      .replace(/\$\$\s*(\w+)\s*\$\$/g, (whole, name) => String(lab.variables?.[name] ?? name));
    if (lang === "prompt") {
      items.push({ section: sec.title, term, kind: "prompt", text: body });
    } else {
      for (const line of body.split("\n")) if (line.trim()) items.push({ section: sec.title, term, kind: "cmd", text: line });
    }
  }
}

const inSession = new Map<string, boolean>();
const done = new Set<string>();
const problems: string[] = [];
let lastSection = "";

for (const it of items) {
  if (it.section !== lastSection) {
    console.log(`\n══ ${it.section}`);
    lastSection = it.section;
  }
  const sess = inSession.get(it.term);
  let lines: { text?: string; stream?: string }[] = [];
  let matched = "";
  let completes: string | undefined;
  let tag = "";
  const text = it.text.trim();
  if (sess && text === "/exit") {
    inSession.set(it.term, false);
    console.log(`[${it.term}] (session) /exit`);
    continue;
  }
  if (sess && !text.startsWith("!")) {
    const o = sim.prompt(text, it.term);
    lines = o.lines as any;
    matched = o.matched;
    completes = o.completes;
    tag = "agent";
  } else {
    const cmd = sess ? text.slice(1) : text;
    const o = sim.execute(cmd, it.term);
    lines = o.lines as any;
    matched = o.matched;
    completes = o.completes;
    if (o.session) inSession.set(it.term, true);
    tag = o.session ? "→session" : "cmd";
  }
  if (completes) done.add(completes);
  const unmatched = !matched;
  if (unmatched) problems.push(`UNMATCHED [${it.section}] [${it.term}] ${text.split("\n")[0]}`);
  const body = lines.map((l) => (l.stream === "stderr" ? "! " : "  ") + (l.text ?? ""));
  console.log(
    `[${it.term}] ${tag === "agent" ? "agent>" : "$"} ${text.split("\n")[0].slice(0, 110)}  ⇒ ${matched || "NO MATCH"}${completes ? "  ✔" + completes : ""}`,
  );
  const show = verbose ? body : body.slice(0, 3);
  for (const l of show) console.log("      " + l.slice(0, 130));
  if (!verbose && body.length > 3) console.log(`      … (${body.length - 3} more lines)`);
  // Scenarios that model a mistake are named *-error: the lab's own steps must not reach them.
  if (/-error$/.test(matched)) problems.push(`UNEXPECTED PATH ${matched} [${it.section}] ${text.split("\n")[0]}`);
}

const missing = [...allSteps].filter((s) => !done.has(s));
console.log("\n════ RESULT");
console.log(`blocks replayed: ${items.length}`);
console.log(`steps completed: ${done.size}/${allSteps.size}`);
console.log("steps NOT completed:", missing.length ? missing.join(", ") : "none");
console.log("problems:", problems.length ? "\n  " + problems.join("\n  ") : "none");
const st = sim.state() as any;
console.log("final state:", JSON.stringify(st, (k, v) => (k === "history" ? undefined : v)));
const f = sim.files();
console.log("files:", Object.keys(f).sort().join(", "));
process.exit(problems.length || missing.length ? 1 : 0);
