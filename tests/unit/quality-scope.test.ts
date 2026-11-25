import { expect, it, vi } from "vitest";
import { docsOnly } from "../../scripts/quality-scope";

const before = "1".repeat(40);
const after = "2".repeat(40);
const ref = "refs/heads/main";
const push = { ref, before, after, forced: false, deleted: false, created: false };
const edit = "M\0README.md\0";

function checkout(diff: string) {
  return vi.fn((...args: string[]) => {
    if (args[0] === "diff") return diff;
    if (args[1] === "--is-shallow-repository") return "false\n";
    if (args[1] === "HEAD") return after;
    if (args[1] === "HEAD^1") return `${before}\n${after}\n`;
    if (args[1] === "--is-ancestor") return "";
    throw Error("Unexpected Git arguments");
  });
}

it.each([
  ["docs", edit + "M\0docs/release.md\0", true],
  ["code", "M\0app/root.tsx\0", false],
  ["mixed", edit + "M\0package.json\0", false],
  ["rename", "D\0app/file.md\0A\0README.md\0", false],
  ["deletion", "D\0README.md\0", false],
  ["type change", "T\0README.md\0", false],
  ["unknown", "M\0docs/new.md\0", false],
  ["newline in path", "M\0bad\nREADME.md\0", false],
  ["empty", "", false],
  ["incomplete", "M\0README.md", false],
] as const)("routes a %s push", (_, diff, expected) => {
  const git = checkout(diff);
  expect(docsOnly("push", ref, push, git)).toBe(expected);
  expect(git).toHaveBeenCalledWith(
    "diff",
    "--no-renames",
    "--name-status",
    "-z",
    before,
    after,
    "--",
  );
});

it("compares the PR head to its merge base and verifies the checked-out merge", () => {
  const git = checkout(edit);
  const event = { number: 5, pull_request: { base: { sha: before }, head: { sha: after } } };
  expect(docsOnly("pull_request", "refs/pull/5/merge", event, git)).toBe(true);
  expect(git).toHaveBeenCalledWith(
    "diff",
    "--no-renames",
    "--name-status",
    "-z",
    `${before}...${after}`,
    "--",
  );
  expect(docsOnly("pull_request", "refs/pull/6/merge", event, git)).toBe(false);
  expect(
    docsOnly(
      "pull_request",
      "refs/pull/5/merge",
      { ...event, pull_request: { base: { sha: after }, head: { sha: after } } },
      git,
    ),
  ).toBe(false);
});

it("requires browsers for manual runs, unexpected refs, first pushes and incomplete history", () => {
  const git = checkout(edit);
  expect(docsOnly("workflow_dispatch", ref, {}, git)).toBe(false);
  expect(docsOnly("push", "refs/tags/main", push, git)).toBe(false);
  expect(docsOnly("push", ref, { ...push, before: "0".repeat(40) }, git)).toBe(false);
  expect(docsOnly("push", ref, { ...push, forced: true }, git)).toBe(false);
  expect(docsOnly("push", ref, { ...push, after: before }, git)).toBe(false);
  expect(docsOnly("push", ref, push, () => "true")).toBe(false);
  // The workflow interprets a nonzero classifier exit as requiring all projects.
  git
    .mockImplementationOnce(() => "false")
    .mockImplementationOnce(() => after)
    .mockImplementationOnce(() => {
      throw Error("Missing baseline");
    });
  expect(() => docsOnly("push", ref, push, git)).toThrow("Missing baseline");
});
