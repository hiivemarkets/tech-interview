// ---------------------------------------------------------------------------
// THIS IS THE FILE YOU EDIT.
//
// Implement runTriage(). It should read the failed jobs, run each log through
// classify(), and post ONE comment to the PR summarizing what broke and where
// to start. Use createComment / updateComment / listComments to post.
//
// Remember: classify() is an unreliable LLM call. It's slow, it sometimes
// returns malformed output or throws, and it's sometimes confidently wrong.
// And this runs again on every push to the PR.
// ---------------------------------------------------------------------------

import {
  getFailedJobs,
  classify,
  listComments,
  createComment,
  updateComment,
  type Classification,
  type FailedJob,
} from "./fixtures.js";

export async function runTriage(): Promise<void> {
  const jobs = await getFailedJobs();

  // TODO: classify each job, build a useful comment, post it.
  // Start simple: get a plain comment posting. Then make it good.

  const lines: string[] = [];
  for (const job of jobs) {
    const result = await classify(job.log);
    lines.push(`- ${job.jobName}: ${result.category} — ${result.cause}`);
  }

  await createComment(["## CI failed", ...lines].join("\n"));
}
