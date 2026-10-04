import { spawnSync } from 'node:child_process';
if (spawnSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' }).status === 0) {
  const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
  if (result.status !== 0) console.warn('Git hooks could not be configured in this environment.');
}
