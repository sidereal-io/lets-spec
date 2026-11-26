// A stand-in CLI's answer that notes its family in state the CLIs share,
// so a test can see the order lets tried the families in, across CLIs.
// Each CLI's own call log cannot show that. The stand-in imports this
// file for each call, so it imports nothing at run time. Not named
// *.test.ts, so node --test does not run it.
import type { StandInAnswer, StandInReply } from '../support/lets.ts';

/** The `data` of a `noteFamily` row. */
export interface Noted {
  family: string;
  reply: StandInReply;
}

/** Appends `data.family` to `state.tried`, then answers with `data.reply`. */
export const noteFamily: StandInAnswer = ({ state, data }) => {
  const { family, reply } = data as Noted;
  state.tried = [...(state.tried ?? []), family];
  return reply;
};
