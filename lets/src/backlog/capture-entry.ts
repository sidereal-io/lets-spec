import { readCaptureServiceConfig, startCaptureService } from './capture-service.ts';

/** Service entry point; importing this module never starts a runner. */
export async function captureMain(argv = process.argv.slice(2)): Promise<void> {
  if (argv.length !== 1) throw new Error('usage: lets-capture /etc/lets/capture-service.json');
  const service = await startCaptureService(await readCaptureServiceConfig(argv[0]!));
  for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => { void service.close().then(() => { process.exitCode = 0; }); });
}
if (import.meta.main) captureMain().catch(() => { process.stderr.write('capture runner cannot start; check protected administrator configuration\n'); process.exitCode = 1; });
