import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID as cryptoUUID } from 'node:crypto';
import type { Query } from './github.ts';
import { digest } from './action-contract.ts';
export type Transaction = { root: string; records: Record<string, any>; seed: string; nextId: number; query?: Query };
export const transaction = new AsyncLocalStorage<Transaction>();
export function randomUUID(): string {
  const current = transaction.getStore();
  if (!current) return cryptoUUID();
  const hex = digest([current.seed, current.nextId++]);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
/** Control flow: never convert an action checkpoint into a mutation failure. */
export class ActionYield extends Error {}
