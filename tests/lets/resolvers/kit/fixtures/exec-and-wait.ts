// Runs a shell through the kit's real execFile, with no time limit, and
// waits for it. The shell writes its process ID, then its child's, to the
// file named in argv[2]. A test sends this process a signal, then checks
// how it ended and whether the shell and its child are gone.
//
// The child runs in the foreground: a shell with no job control starts a
// background child with SIGINT ignored.
import { realIo } from '../../../../../lets/src/resolvers/kit/io.ts';

const pids = process.argv[2];

await realIo().execFile('sh', ['-c', `echo $$ >> '${pids}'; sh -c 'echo $$ >> "$0"; exec sleep 600' '${pids}'; echo done`]);
