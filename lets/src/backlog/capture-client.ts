import { request } from 'node:http';
import { readFile, lstat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { exactKeys, protectedPath, validateTool } from './capture-service.ts';
import { canonical, verifyCapture } from './action-contract.ts';
import type { Action, Capture, CaptureReader, TrustedTool } from './action-contract.ts';
import { AdapterFailure } from './errors.ts';

export type CaptureSetup = { socket: string; serviceUid: number; tools: Record<string, TrustedTool> };
export type ClientBoundary = { verifySocket?: (setup: CaptureSetup) => Promise<void> };
function validateSetup(setup: unknown): asserts setup is CaptureSetup {
  if (!exactKeys(setup, ['socket', 'serviceUid', 'tools']) || typeof setup.socket !== 'string' || !isAbsolute(setup.socket) || !Number.isSafeInteger(setup.serviceUid) || setup.serviceUid <= 0 || !setup.tools || typeof setup.tools !== 'object' || Array.isArray(setup.tools) || Object.keys(setup.tools).length === 0) throw new Error('invalid administrator capture setup');
  for (const [id, tool] of Object.entries(setup.tools)) { validateTool(tool); if ((tool as TrustedTool).id !== id) throw new Error('capture setup tool ID mismatch'); }
}
export async function readCaptureSetup(boundary: { protect?: (path: string) => Promise<void>; read?: (path: string) => Promise<string> } = {}): Promise<CaptureSetup> {
  const path = '/etc/lets/capture-client.json';
  try {
    await (boundary.protect ?? (file => protectedPath(file, [0], 'file')))(path);
    const setup: unknown = JSON.parse(await (boundary.read ?? (file => readFile(file, 'utf8')))(path));
    validateSetup(setup);
    return setup;
  } catch { throw new AdapterFailure('invalid_configuration', 'none', 'administrator capture setup unavailable or editable: /etc/lets/capture-client.json'); }
}
async function verifySocket(setup: CaptureSetup): Promise<void> {
  if (process.getuid?.() === 0 || setup.serviceUid === process.getuid?.()) throw new Error('capture requires an independent service account');
  await protectedPath(setup.socket, [0, setup.serviceUid], 'socket');
  if ((await lstat(setup.socket)).uid !== setup.serviceUid) throw new Error('untrusted capture socket owner');
}
export class CaptureClient implements CaptureReader {
  private readonly setup: CaptureSetup;
  private readonly boundary: ClientBoundary;
  constructor(setup: CaptureSetup, boundary: ClientBoundary = {}) { validateSetup(setup); this.setup = structuredClone(setup); this.boundary = boundary; }
  private async exchange(path: string, action?: Action): Promise<unknown> {
    try {
      await (this.boundary.verifySocket ?? verifySocket)(this.setup);
      return await new Promise((resolve, reject) => {
        const timeout = action ? Math.min(185000, Math.max(1, action.expiresAt - Date.now()) + 5000) : 5000;
        const req = request({ socketPath: this.setup.socket, path, method: action ? 'POST' : 'GET', headers: {'content-type':'application/json'} }, response => {
          const chunks: Buffer[] = []; let bytes = 0;
          response.on('data', (chunk: Buffer) => { bytes += chunk.length; if (bytes > 8 * 1048576) { req.destroy(new Error('capture response exceeds limit')); return; } chunks.push(chunk); });
          response.on('error', reject);
          response.on('end', () => { if (response.statusCode !== 200) { reject(new Error('capture service refused request')); return; } try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch { reject(new Error('malformed capture response')); } });
        });
        const timer = setTimeout(() => req.destroy(new Error('capture deadline exceeded')), timeout);
        req.on('close', () => clearTimeout(timer)); req.on('error', reject);
        req.end(action ? JSON.stringify(action) : undefined);
      });
    } catch { throw new AdapterFailure('unknown_outcome', 'unknown', 'independent capture unavailable; reconcile original action'); }
  }
  private verifyTool(action: Action): void {
    if (canonical(this.setup.tools[action.tool.id]) !== canonical(action.tool)) throw new AdapterFailure('unknown_outcome', 'unknown', 'action tool does not match administrator capture trust');
  }
  async execute(action: Action): Promise<{ reference: string }> {
    this.verifyTool(action);
    const result = await this.exchange('/execute', action);
    if (!exactKeys(result, ['reference']) || result.reference !== action.id) throw new AdapterFailure('unknown_outcome', 'unknown', 'invalid capture reference; reconcile original action');
    return {reference:result.reference};
  }
  async read(reference: string, action: Action, options: {historical?:boolean} = {}): Promise<Capture> {
    this.verifyTool(action);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(reference)) throw new AdapterFailure('unknown_outcome', 'unknown', 'invalid capture reference');
    return verifyCapture(action, await this.exchange(`/receipts/${reference}`), reference, Date.now(), options.historical);
  }
}
