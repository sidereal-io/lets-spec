// lets go questions: tell lets-go the default question mode, from
// go.questions in the lets config in effect: the user's lets config, merged
// with the repository's. Reads only version and go, so a delegate section
// the delegate commands would reject does not stop it. Asks no resolver. No
// process access here; everything comes through deps.
import { questionModeFor, readLetsConfig } from '../delegate/config.ts';
import { guarded } from '../delegate/guarded.ts';
import type { Deps } from '../io.ts';
import { EXIT } from '../resolvers/kit/errors.ts';

// The exit code: 0 ok, 2 a bad config.
export function run(deps: Pick<Deps, 'env' | 'io' | 'cwd' | 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    const { document, fileOf } = await readLetsConfig(deps);
    const questions = document === null ? null : questionModeFor(document, fileOf);
    deps.stdout(`${JSON.stringify({ questions })}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
