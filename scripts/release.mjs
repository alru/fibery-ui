// Cuts a release for git installs: bumps the version on master, builds, and commits dist/ onto the `release`
// branch (tagged vX.Y.Z). Apps then depend on "github:alru/fibery-ui#<release commit sha>".
// Usage: npm run release -- 0.1.3
import {execSync} from "node:child_process";
import {cpSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const run = (cmd, cwd) => execSync(cmd, {cwd, stdio: "inherit"});
const read = (cmd, cwd) => execSync(cmd, {cwd, encoding: "utf8"}).trim();

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  console.error("Usage: npm run release -- <x.y.z>");
  process.exit(1);
}
if (read("git branch --show-current") !== "master") throw new Error("Run releases from master.");
if (read("git status --porcelain")) throw new Error("Working tree is not clean: commit or stash first.");
if (read(`git tag --list v${version}`)) throw new Error(`Tag v${version} already exists.`);

run("git pull --ff-only origin master");
run(`npm version ${version} --no-git-tag-version`);
run("git add package.json package-lock.json");
run(`git commit -m "Release ${version}"`);
run("npm run build");

// Build the release commit in a temporary worktree so the master checkout is never switched.
const worktree = mkdtempSync(join(tmpdir(), "fibery-ui-release-"));
try {
  run("git fetch origin release");
  run(`git worktree add "${worktree}" release`);
  run("git merge --ff-only origin/release", worktree);
  run("git merge --no-edit master", worktree);
  rmSync(join(worktree, "dist"), {recursive: true, force: true});
  cpSync("dist", join(worktree, "dist"), {recursive: true});
  run("git add -f dist", worktree);
  run(`git commit --allow-empty -m "Build ${version}"`, worktree);
  run(`git tag v${version}`, worktree);
  const sha = read("git rev-parse HEAD", worktree);

  run(`git push origin master release v${version}`);
  console.log(`\nReleased ${version}. In the app's package.json:\n  "@alru/fibery-ui": "github:alru/fibery-ui#${sha}"`);
} finally {
  run(`git worktree remove --force "${worktree}"`);
}
