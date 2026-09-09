const CATEGORY_CODES = Object.freeze({
  argument_validation: 'E_CONVEX_ARGUMENT_VALIDATION',
  auth_refused: 'E_CONVEX_AUTH_REFUSED',
  unauthorized: 'E_CONVEX_UNAUTHORIZED',
  not_deployed: 'E_CONVEX_NOT_DEPLOYED',
  command_failed: 'E_CONVEX_COMMAND_FAILED',
});

function diagnosticText(error) {
  if (!error || typeof error !== 'object') return String(error ?? '');
  return [error.stderr, error.stdout, error.message]
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part instanceof Uint8Array) return Buffer.from(part).toString('utf8');
      return '';
    })
    .join('\n');
}

function safeToken(value, fallback) {
  const candidate = String(value ?? '').trim();
  return /^[a-zA-Z0-9:._/-]{1,80}$/.test(candidate) ? candidate : fallback;
}

function exitMetadata(error) {
  if (!error || typeof error !== 'object') return { exit: 'unknown', signal: 'none' };
  const exit = Number.isSafeInteger(error.status)
    ? String(error.status)
    : Number.isSafeInteger(error.code)
      ? String(error.code)
      : 'unknown';
  const signal = typeof error.signal === 'string' && /^SIG[A-Z0-9]{1,16}$/.test(error.signal)
    ? error.signal
    : 'none';
  return { exit, signal };
}

export function classifyConvexCommandFailure(error) {
  if (
    error &&
    typeof error === 'object' &&
    Object.prototype.hasOwnProperty.call(CATEGORY_CODES, error.category)
  ) {
    return error.category;
  }
  const diagnostic = diagnosticText(error);
  if (/ArgumentValidationError/i.test(diagnostic)) return 'argument_validation';
  if (/not authenticated|staff only/i.test(diagnostic)) return 'auth_refused';
  if (/unauthorized|invalid deploy key|not authorized|forbidden|\b401\b|\b403\b/i.test(diagnostic)) {
    return 'unauthorized';
  }
  if (/could not find (?:public )?function|function not found|not deployed/i.test(diagnostic)) {
    return 'not_deployed';
  }
  return 'command_failed';
}

export function formatConvexCommandFailure(error, { operation, command = 'npx-convex' }) {
  const category = classifyConvexCommandFailure(error);
  const code = CATEGORY_CODES[category];
  const metadata = exitMetadata(error);
  return `[${code}] operation=${safeToken(operation, 'unknown')} command=${safeToken(command, 'npx-convex')} exit=${metadata.exit} signal=${metadata.signal}`;
}

export function formatConvexOutputFailure({ operation, command = 'npx-convex' }) {
  return `[E_CONVEX_OUTPUT_INVALID] operation=${safeToken(operation, 'unknown')} command=${safeToken(command, 'npx-convex')} output=unparseable`;
}

export function sanitizedConvexCommandError(error, context) {
  const category = classifyConvexCommandFailure(error);
  const sanitized = new Error(formatConvexCommandFailure(error, context));
  sanitized.name = 'SanitizedConvexCommandError';
  sanitized.category = category;
  sanitized.code = CATEGORY_CODES[category];
  return sanitized;
}
