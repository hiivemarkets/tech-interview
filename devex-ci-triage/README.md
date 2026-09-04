# CI Failure Triage — coding exercise

When CI fails on a pull request, engineers waste time scrolling through raw logs across a dozen failed jobs to figure out what actually broke and what's worth looking at first.

You're building a GitHub Action that does that first pass automatically. When a build fails on a PR, it reads the failed jobs' logs and posts a comment on the PR summarizing what broke and where to start.

## How this runs

There's no real GitHub or CI here. This is a plain program that runs on your laptop. The functions you build against are already written for you in `src/fixtures.ts` — they return canned data and print the "PR comment" to your terminal. You write your code as if it were a real Action; the runtime is just a local process.

```bash
npm install
npm start      # runs your code (src/triage.ts)
npm run reset  # clears the PR's comments (start fresh)
```

You edit **`src/triage.ts`**. You don't need to touch anything else.

## What you're given

```ts
// The failed jobs for this PR's latest CI run. Reliable.
getFailedJobs(): Promise<{ jobName: string; log: string; url: string }[]>

// Guesses what caused one failed job, from its log.
classify(log: string): Promise<Classification>

type Classification = {
  category: "test_failure" | "compile_error" | "dependency" | "infra" | "flaky" | "unknown";
  cause: string;       // one-line, human-readable
  confidence: number;  // 0.0 - 1.0
};

// Post to the PR. Backed by a file, so state survives across runs.
listComments(): Promise<{ id: number; body: string }[]>
createComment(body: string): Promise<void>
updateComment(id: number, body: string): Promise<void>
```

`classify` wraps a real LLM call. Treat it like one:

- It's **slow** — hundreds of milliseconds to seconds per call.
- It **occasionally returns output that doesn't match the schema** — truncated JSON, a bare string, or it throws. (The type says `Classification`, but at runtime it sometimes isn't one — same as a real model.)
- It's **sometimes confidently wrong** — a high `confidence` is not a guarantee, and `category: "flaky"` is the model's opinion, not proof the test is actually flaky.

And note: **this Action runs again every time someone pushes to the PR.**

## What the Action should do

- Run each failed job's log through `classify`.
- Post a PR comment an engineer can act on: what's broken, and what to look at first.
- Keep working when `classify` misbehaves — one bad response shouldn't sink the run.
- Help the reader judge how much to trust each result, rather than presenting the model's guesses as fact.

Start simple — get a plain comment posting first, then make it good. There's no single right answer; the interesting part is what you do when the model doesn't cooperate, and what a good PR comment actually looks like.
