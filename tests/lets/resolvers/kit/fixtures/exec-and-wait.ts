// Runs a shell through the kit's real execFile, with no time limit, and
// waits for it. The shell writes its process ID, then its child's, to the
// file named in argv[2]. A test sends this process a signal, then checks
// how it ended and whether the shell and its child are gone.
//
// The child runs in the foreground: a shell with no job control starts a
// background child with SIGINT ignored.
//
// With argv[3] ended-group, a command whose group has ended but which has
// not settled runs first. Its Node starts a sleep in a new session, which
// holds Node's stdout, and exits. It writes the sleep's process ID to the
// file named in argv[2] with .held added, and its own with .leader added.
import { readFileSync } from 'node:fs';
import { realIo } from '../../../../../lets/src/resolvers/kit/io.ts';

const [pids, mode] = process.argv.slice(2);

const HOLD_STDOUT_AND_EXIT = `
  const { spawn } = require('node:child_process');
  const sleep = spawn('sleep', ['600'], { detached: true, stdio: ['ignore', 'inherit', 'ignore'] });
  require('node:fs').writeFileSync(process.argv[1] + '.held', sleep.pid + '\\n');
  require('node:fs').writeFileSync(process.argv[1] + '.leader', process.pid + '\\n');
  sleep.unref();
`;

// true while a process is left in the group that pid leads.
function groupAlive(pid: number): boolean {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const commands: Promise<unknown>[] = [];
if (mode === 'ended-group') {
  commands.push(realIo().execFile(process.execPath, ['-e', HOLD_STDOUT_AND_EXIT, pids]));
  let leader = 0;
  while (!(leader > 0) || groupAlive(leader)) {
    await sleep(50);
    try {
      leader = Number(readFileSync(`${pids}.leader`, 'utf8'));
    } catch {}
  }
}
commands.push(realIo().execFile('sh', ['-c', `echo $$ >> '${pids}'; sh -c 'echo $$ >> "$0"; exec sleep 600' '${pids}'; echo done`]));
await Promise.all(commands);
