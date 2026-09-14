// ---------------------------------------------------------------------------
// SCAFFOLDING — you build ON TOP of this. You normally won't edit this file.
//
// In real life these would talk to GitHub and an LLM. Here they're faked so
// the whole thing runs on your laptop with no network, no auth, no real CI.
// The point of the fakes is that `classify` MISBEHAVES the way a real LLM
// call does. That's not a bug — handling it is the exercise.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync } from "node:fs";

export type Classification = {
  category:
    | "test_failure"
    | "compile_error"
    | "dependency"
    | "infra"
    | "flaky"
    | "unknown";
  cause: string; // one-line, human-readable
  confidence: number; // 0.0 - 1.0
};

export type FailedJob = {
  jobName: string;
  log: string;
  url: string; // link to the full job log
};

// ---------------------------------------------------------------------------
// getFailedJobs(): the failed jobs for this PR's latest CI run. Reliable.
// ---------------------------------------------------------------------------

const JOBS: FailedJob[] = [
  {
    jobName: "build-web",
    url: "https://ci.example.com/build-web/4821",
    log: "tsc --noEmit\nsrc/pricing.ts(42,7): error TS2531: Object is possibly 'null'.\n  const next = bid.amount + increment;\nError: Process completed with exit code 2.",
  },
  {
    jobName: "unit-core",
    url: "https://ci.example.com/unit-core/4821",
    log: "FAIL src/pricing.test.ts\n  ● minimum increment › rounds to previous power of ten\n    expected 110 but received 100\n    at Object.<anonymous> (src/pricing.test.ts:88:19)",
  },
  {
    jobName: "lint",
    url: "https://ci.example.com/lint/4821",
    log: "eslint .\n/app/src/comment.ts: 1 error\n  no-unused-vars: 'marker' is defined but never used",
  },
  {
    jobName: "e2e-checkout",
    url: "https://ci.example.com/e2e-checkout/4821",
    log: "Running checkout flow...\nError: connect ECONNREFUSED postgres:5432\n  migration step 014_add_bids failed — database unreachable\nExit code 1.",
  },
  {
    jobName: "unit-payments",
    url: "https://ci.example.com/unit-payments/4821",
    log: "FAIL src/payments.test.ts\n  ● refund › issues partial refund\n    TypeError: Cannot read properties of undefined (reading 'cents')",
  },
  {
    jobName: "integration-api",
    url: "https://ci.example.com/integration-api/4821",
    log: "3 requests failed with 500\n  POST /bids -> 500\n  (no stack captured)",
  },
  {
    jobName: "build-mobile",
    url: "https://ci.example.com/build-mobile/4821",
    log: "Metro bundler\nUnable to resolve module 'react-native-svg' from App.tsx\n  Module not found.",
  },
  {
    jobName: "typecheck",
    url: "https://ci.example.com/typecheck/4821",
    log: "tsc --noEmit\nsrc/comment.ts(12,3): error TS7006: Parameter 'body' implicitly has an 'any' type.",
  },
  {
    jobName: "unit-utils",
    url: "https://ci.example.com/unit-utils/4821",
    log: "FAIL src/retry.test.ts\n  ● retry › gives up after N attempts (timeout)\n    Exceeded timeout of 5000 ms — passed on rerun",
  },
  {
    jobName: "deploy-preview",
    url: "https://ci.example.com/deploy-preview/4821",
    log: "Building preview...\nFATAL: JavaScript heap out of memory\n  runner killed (OOM)",
  },
  {
    jobName: "snapshot",
    url: "https://ci.example.com/snapshot/4821",
    log: "FAIL src/Header.test.tsx\n  3 snapshots obsolete. Run with -u to update.",
  },
  {
    jobName: "security-scan",
    url: "https://ci.example.com/security-scan/4821",
    log: "npm audit\n1 high severity vulnerability in lodash <4.17.21",
  },
];

export async function getFailedJobs(): Promise<FailedJob[]> {
  // returns a fresh copy so nobody can mutate the source
  return JOBS.map((j) => ({ ...j }));
}

// ---------------------------------------------------------------------------
// classify(log): wraps an LLM call. Slow, occasionally malformed, sometimes
// confidently wrong. Behavior is deterministic per log.
//
// NOTE: the return type says Classification, but — like a real model — it
// sometimes returns something that ISN'T one. That's intentional. Your code
// has to cope at runtime, not trust the type.
// ---------------------------------------------------------------------------

type Misbehavior =
  | { kind: "ok"; value: Classification }
  | { kind: "throws" }
  | { kind: "raw"; value: unknown };

function behaviorFor(log: string): { latencyMs: number; b: Misbehavior } {
  const has = (s: string) => log.includes(s);

  if (has("no-unused-vars"))
    return { latencyMs: 900, b: { kind: "throws" } };

  if (has("partial refund"))
    return {
      latencyMs: 600,
      b: { kind: "raw", value: "The payments test failed on a null refund." },
    };

  if (has("npm audit"))
    return {
      latencyMs: 500,
      b: { kind: "raw", value: '{"category":"dependency","cause":"vuln in lo' },
    };

  if (has("implicitly has an 'any'"))
    return {
      latencyMs: 700,
      b: {
        kind: "raw",
        value: { category: "compile_error", cause: "Missing type annotation" },
      },
    };

  if (has("ECONNREFUSED"))
    return {
      latencyMs: 800,
      b: {
        kind: "ok",
        value: {
          category: "flaky",
          cause: "Looks like a flaky connection timeout — probably retry-able",
          confidence: 0.91,
        },
      },
    };

  if (has("3 requests failed"))
    return {
      latencyMs: 650,
      b: {
        kind: "ok",
        value: {
          category: "unknown",
          cause: "Possibly a dependency version mismatch?",
          confidence: 0.22,
        },
      },
    };
  if (has("passed on rerun"))
    return {
      latencyMs: 1100,
      b: {
        kind: "ok",
        value: {
          category: "flaky",
          cause: "Retry-timing test; may be a genuine flake",
          confidence: 0.34,
        },
      },
    };

  const ok = (value: Classification, latencyMs = 500): { latencyMs: number; b: Misbehavior } => ({
    latencyMs,
    b: { kind: "ok", value },
  });
  if (has("possibly 'null'"))
    return ok({ category: "compile_error", cause: "Null check missing in src/pricing.ts:42", confidence: 0.94 });
  if (has("power of ten"))
    return ok({ category: "test_failure", cause: "Increment rounding: expected 110, got 100", confidence: 0.88 });
  if (has("react-native-svg"))
    return ok({ category: "dependency", cause: "Missing module react-native-svg", confidence: 0.79 }, 750);
  if (has("out of memory"))
    return ok({ category: "infra", cause: "Runner ran out of memory (OOM)", confidence: 0.83 });
  if (has("snapshots obsolete"))
    return ok({ category: "test_failure", cause: "3 obsolete snapshots in Header.test.tsx", confidence: 0.9 });

  return ok({ category: "unknown", cause: "Could not determine cause", confidence: 0.2 });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function classify(log: string): Promise<Classification> {
  const { latencyMs, b } = behaviorFor(log);
  await sleep(latencyMs);
  if (b.kind === "throws") throw new Error("model request failed (503)");
  // Cast hides the lie from the type system — exactly like a real LLM wrapper
  // that trusts the model to return valid JSON. It doesn't always.
  if (b.kind === "raw") return b.value as Classification;
  return b.value;
}

// ---------------------------------------------------------------------------
// PR comment primitives. Backed by a file so state survives across runs —
// re-running `npm start` is like the Action firing again on a new push.
// Both create and update print what "posted" to the PR so you can see it.
// ---------------------------------------------------------------------------

type StoredComment = { id: number; body: string };
const STORE = ".comments.json";

function load(): StoredComment[] {
  if (!existsSync(STORE)) return [];
  try {
    return JSON.parse(readFileSync(STORE, "utf8"));
  } catch {
    return [];
  }
}
function save(comments: StoredComment[]) {
  writeFileSync(STORE, JSON.stringify(comments, null, 2));
}

export async function listComments(): Promise<{ id: number; body: string }[]> {
  return load().map((c) => ({ ...c }));
}

export async function createComment(body: string): Promise<void> {
  const comments = load();
  const id = comments.length ? Math.max(...comments.map((c) => c.id)) + 1 : 1;
  comments.push({ id, body });
  save(comments);
  console.log(`\n=== CREATED PR COMMENT #${id} ===\n${body}\n`);
}

export async function updateComment(id: number, body: string): Promise<void> {
  const comments = load();
  const c = comments.find((x) => x.id === id);
  if (!c) throw new Error(`no comment with id ${id}`);
  c.body = body;
  save(comments);
  console.log(`\n=== UPDATED PR COMMENT #${id} ===\n${body}\n`);
}
