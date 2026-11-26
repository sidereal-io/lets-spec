// lets go shape-name: the name of lets-go's shape step for one input, and
// the path of that step's answers file. The naming rule lives only here, so
// the skill builds no name of its own. Reads no file and asks no resolver:
// the same input always gives the same line.
import { guarded } from '../delegate/guarded.ts';
import type { Deps } from '../io.ts';
import { EXIT } from '../resolvers/kit/errors.ts';

export type ShapeNameOptions = { issue?: string };

// An issue key is opaque to everything but its backlog provider (ADR-025),
// so it goes into the name unchanged.
export function shapeName(options: ShapeNameOptions): string {
  return `issue-${options.issue}`;
}

// The exit code: 0 ok.
export function run(options: ShapeNameOptions, deps: Pick<Deps, 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    const name = shapeName(options);
    const answers = `.workspace/lets-go/${name}-shape-answers.yaml`;
    deps.stdout(`${JSON.stringify({ name, answers })}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
