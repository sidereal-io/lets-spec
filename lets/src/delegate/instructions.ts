// lets delegate step instructions: tell a skill what can run for a
// delegation before it runs one. Asks the first resolver that does not
// decline the kind of session the intent runs which models it can run, and
// adds the guidance for the intent. It starts no session. No process
// access here; everything comes through deps.
import type { Deps } from '../io.ts';
import { checkNoOldGuidance, guidanceFor, readConfig } from './config.ts';
import { EXIT } from '../resolvers/kit/errors.ts';
import { guarded } from './guarded.ts';
import { inAdapter, pick } from './lookup.ts';
import { kindFor } from './intents.ts';
import type { Intent } from './intents.ts';

export type InstructionsOptions = { for: Intent };

// The exit code: 0 ok, 2 usage, a bad guidance, or every resolver declined,
// 4 the outcome is unknown.
export function run({ for: intent }: InstructionsOptions, deps: Deps): Promise<number> {
  return guarded(deps, async () => {
    const { config, fileOf } = await readConfig(deps);
    // Checked first, so an old or bad guidance asks no resolver.
    checkNoOldGuidance(config, fileOf);
    const guidance = guidanceFor(config, intent, fileOf);
    const adapter = await pick(kindFor(intent), { ...deps, config, fileOf });
    const options = await inAdapter(() => adapter.options((message) => deps.stderr(`lets delegate: ${message}\n`)));
    deps.stdout(`${JSON.stringify({ for: intent, resolver: adapter.name, options, guidance })}\n`);
    return EXIT.ok;
  });
}
