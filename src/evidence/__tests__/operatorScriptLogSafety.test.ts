import { describe, expect, it, vi } from 'vitest';
import {
  classifyConvexCommandFailure,
  formatConvexCommandFailure,
  formatConvexOutputFailure,
  sanitizedConvexCommandError,
} from '../../../scripts/lib/safe-convex-command-error.mjs';

const SENTINEL = 'AUTH_GOOGLE_SECRET=SENTINEL_PRIVATE_VALUE_DO_NOT_LOG_123456789';

function commandError(message = `command failed ${SENTINEL}`) {
  return Object.assign(new Error(message), {
    stderr: Buffer.from(`stderr ${SENTINEL}`),
    stdout: `stdout ${SENTINEL}`,
    status: 17,
    signal: 'SIGTERM',
  });
}

describe('operator Convex command log safety', () => {
  it.each([
    ['ArgumentValidationError', 'argument_validation', 'E_CONVEX_ARGUMENT_VALIDATION'],
    ['not authenticated', 'auth_refused', 'E_CONVEX_AUTH_REFUSED'],
    ['invalid deploy key', 'unauthorized', 'E_CONVEX_UNAUTHORIZED'],
    ['could not find function', 'not_deployed', 'E_CONVEX_NOT_DEPLOYED'],
    ['unexpected failure', 'command_failed', 'E_CONVEX_COMMAND_FAILED'],
  ] as const)('classifies %s without returning diagnostic text', (diagnostic, category, code) => {
    const error = commandError(`${diagnostic} ${SENTINEL}`);
    const detail = formatConvexCommandFailure(error, { operation: 'run:evidence:integrity' });

    expect(classifyConvexCommandFailure(error)).toBe(category);
    expect(detail).toContain(`[${code}]`);
    expect(detail).toContain('operation=run:evidence:integrity');
    expect(detail).toContain('exit=17');
    expect(detail).toContain('signal=SIGTERM');
    expect(detail).not.toContain(SENTINEL);
    expect(detail.length).toBeLessThan(220);
  });

  it('keeps console output, thrown stacks, and serialized artifacts sentinel-free', () => {
    const safeError = sanitizedConvexCommandError(commandError(), { operation: 'deploy' });
    const outputFailure = formatConvexOutputFailure({ operation: 'run:evidence:integrity' });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    console.error(safeError.message, outputFailure);
    const consoleOutput = consoleError.mock.calls.flat().join(' ');
    const artifact = JSON.stringify({ error: safeError.message, outputFailure });

    expect(consoleOutput).not.toContain(SENTINEL);
    expect(safeError.stack).not.toContain(SENTINEL);
    expect(artifact).not.toContain(SENTINEL);
    expect(outputFailure).toBe(
      '[E_CONVEX_OUTPUT_INVALID] operation=run:evidence:integrity command=npx-convex output=unparseable',
    );
    consoleError.mockRestore();
  });

  it('routes every deploy-key operator script through the sanitizer', () => {
    const scripts = import.meta.glob('../../../scripts/evidence-{activate,batch-live,gate-probe,live-check}.mjs', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;

    expect(Object.keys(scripts)).toHaveLength(4);
    for (const [path, source] of Object.entries(scripts)) {
      expect(source, path).toContain('safe-convex-command-error.mjs');
      expect(source, path).not.toMatch(/err\.(?:stderr|stdout)/);
      expect(source, path).not.toMatch(/String\(err\)/);
      expect(source, path).not.toMatch(/raw\.slice\(0\s*,/);
    }
  });
});
