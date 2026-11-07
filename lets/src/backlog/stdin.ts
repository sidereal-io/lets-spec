import { AdapterFailure } from './errors.ts';
/** Bound raw bytes and decode once so pipe boundaries cannot split UTF-8. */
export async function readStdin(stream: AsyncIterable<Buffer> = process.stdin): Promise<string> {
  const chunks: Buffer[] = []; let bytes = 0;
  for await (const chunk of stream) {
    bytes += chunk.length;
    if (bytes > 1024 * 1024) throw new AdapterFailure('invalid_request', 'none', 'input exceeds 1 MiB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
