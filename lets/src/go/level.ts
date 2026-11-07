// lets go level: tell lets-go the user's default interactivity level, from
// go.level in the lets config. Reads only version and go, so a delegate
// section the delegate commands would reject does not stop it. Asks no
// resolver. No process access here; everything comes through deps.
import { configPath, questionModeFor, parseDocument } from '../delegate/config.ts';
import { guarded } from '../delegate/guarded.ts';
import type { Deps } from '../io.ts';
import { EXIT } from '../resolvers/kit/errors.ts';

// The exit code: 0 ok, 2 a bad config.
export function run(deps: Pick<Deps, 'env' | 'io' | 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    const path = configPath(deps);
    const text = deps.io.readFile(path);
    const level = text === null ? null : questionModeFor(parseDocument(text, path), path);
    deps.stdout(`${JSON.stringify({ level })}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
