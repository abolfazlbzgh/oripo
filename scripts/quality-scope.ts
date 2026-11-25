import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Only modifications to these existing files qualify. Additions, deletions,
// renames, type changes and every unknown path get the full browser matrix.
const documents = new Set([
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "docs/ai-development.md",
  "docs/architecture.md",
  "docs/authoring.md",
  "docs/release.md",
  "docs/monarch-studio.png",
]);

function onlyDocumentEdits(diff: string) {
  const fields = diff.split("\0");
  if (fields.pop() !== "" || !fields.length || fields.length % 2) return false;
  for (let i = 0; i < fields.length; i += 2) {
    if (fields[i] !== "M" || !documents.has(fields[i + 1] ?? "")) return false;
  }
  return true;
}

type Event = {
  ref?: string;
  before?: string;
  after?: string;
  forced?: boolean;
  created?: boolean;
  deleted?: boolean;
  number?: number;
  pull_request?: { base: { sha: string }; head: { sha: string } };
};

function commit(sha: string | undefined): sha is string {
  return !!sha && /^[0-9a-f]{40}$/.test(sha) && !/^0+$/.test(sha);
}

export function docsOnly(
  eventName: string | undefined,
  ref: string | undefined,
  event: Event,
  git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }),
) {
  if (git("rev-parse", "--is-shallow-repository").trim() !== "false") return false;
  if (eventName === "push" && ref === "refs/heads/main" && event.ref === ref) {
    if (event.created !== false || event.deleted !== false || event.forced !== false) return false;
    if (!commit(event.before) || !commit(event.after)) return false;
    if (git("rev-parse", "HEAD").trim() !== event.after) return false;
    git("merge-base", "--is-ancestor", event.before, event.after);
    return onlyDocumentEdits(
      git("diff", "--no-renames", "--name-status", "-z", event.before, event.after, "--"),
    );
  }
  if (eventName === "pull_request" && event.number && ref === `refs/pull/${event.number}/merge`) {
    const pr = event.pull_request;
    if (!commit(pr?.base.sha) || !commit(pr?.head.sha)) return false;
    // checkout uses the PR test merge. A stale or unexpected merge gets full coverage.
    if (git("rev-parse", "HEAD^1", "HEAD^2").trim() !== `${pr.base.sha}\n${pr.head.sha}`)
      return false;
    return onlyDocumentEdits(
      git("diff", "--no-renames", "--name-status", "-z", `${pr.base.sha}...${pr.head.sha}`, "--"),
    );
  }
  return false;
}

if (import.meta.main) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8"));
  process.exitCode = docsOnly(process.env.GITHUB_EVENT_NAME, process.env.GITHUB_REF, event) ? 0 : 1;
}
