// subagent, the default resolver. lets asks it last, so it never declines,
// and it starts no session: a review is exit 3, for the review skills'
// subagent step, a handoff hands the prompt back, and a step saves the
// prompt and is exit 3, for the caller to run it in a subagent.
import { join } from 'node:path';
import type { Adapter } from '../kit/adapter.ts';
import { Refused } from '../kit/errors.ts';
import { SCRATCH } from '../kit/io.ts';
import type { Io } from '../kit/io.ts';

export function createAdapter(io: Io): Adapter {
  const promptFile = (name: string) => `${SCRATCH}/${name}.prompt.md`;
  // Saves the user's copy of the prompt, which nothing removes: .workspace/
  // is scratch that git ignores.
  const save = (cwd: string, name: string, prompt: string) => {
    io.mkdirp(join(cwd, SCRATCH));
    io.writeFile(join(cwd, promptFile(name)), prompt);
  };
  return {
    name: 'subagent',
    detect: () => true,
    // It can run no model, so it lists none.
    options: async () => [],
    // The default starts no review session. Exit 3 sends the review skills
    // to their subagent step.
    run: async () => {
      throw new Refused('no resolver started a session here, so no fresh session can run. Run the review in a subagent.');
    },
    // The default starts no session either. It saves the prompt, then hands
    // it back for the user to give to any agent, and names none.
    start: async ({ cwd, name, prompt }) => {
      save(cwd, name, prompt);
      return { instructions: `Start any agent in ${cwd} and give it this prompt, which is also saved in ${promptFile(name)}:\n\n${prompt}` };
    },
    // No step session either. It saves the prompt lets composed, answers
    // and all, so the caller's subagent gets the same text a resolver would.
    // Asked again for the next model, it writes the same file again.
    step: async ({ cwd, name, prompt }) => {
      save(cwd, name, prompt);
      throw new Refused(`no resolver started a session here, so no fresh session can run. Run the step in a subagent with the prompt saved in ${promptFile(name)}.`);
    },
    // It issues no handle, so it has nothing to finish.
    finish: async () => {},
  };
}
