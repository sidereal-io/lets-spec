import { spawn } from 'node:child_process';
import { validateRequest, validateResponse } from './protocol.ts';
import { AdapterFailure } from './errors.ts';

/** Each invocation crosses the protocol boundary with no shell or extra argv. */
export async function invoke(executable: string, request: Record<string, any>, options: { timeoutMs?: number; maxBytes?: number } = {}): Promise<Record<string, any>> {
  validateRequest(request);
  const timeoutMs = options.timeoutMs ?? 5000;
  const maxBytes = options.maxBytes ?? 1024 * 1024;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isInteger(maxBytes) || maxBytes <= 0) throw new Error('invalid process limits');
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [], { cwd: request.context.cwd, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new AdapterFailure('unknown_outcome', 'unknown', 'adapter timeout; reconcile before retry')); }, timeoutMs);
    let stdout = '';
    let bytes = 0;
    const count = (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes <= maxBytes) return true;
      child.kill('SIGKILL'); clearTimeout(timer);
      reject(new AdapterFailure('unknown_outcome', 'unknown', 'adapter output limit; reconcile before retry'));
      return false;
    };
    const chunks: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => { if (count(chunk)) chunks.push(chunk); });
    child.stderr.on('data', count);
    child.on('error', () => { clearTimeout(timer); reject(new AdapterFailure('invalid_configuration', 'none', 'adapter could not be started')); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      let response;
      try {
        if (signal || code === null) throw new Error('signal termination');
        stdout = Buffer.concat(chunks).toString('utf8');
        response = JSON.parse(stdout);
        validateResponse(response, code, request.operation);
      } catch {
        reject(new AdapterFailure('unknown_outcome', 'unknown', 'invalid adapter response; reconcile before retry'));
        return;
      }
      if (!response.ok) reject(new AdapterFailure(response.error.category, response.error.effects, response.error.message));
      else resolve(response);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(request));
  });
}
