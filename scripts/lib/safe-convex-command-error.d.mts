export type ConvexFailureCategory =
  | 'argument_validation'
  | 'auth_refused'
  | 'unauthorized'
  | 'not_deployed'
  | 'command_failed';

export type ConvexCommandContext = {
  operation: string;
  command?: string;
};

export declare function classifyConvexCommandFailure(error: unknown): ConvexFailureCategory;
export declare function formatConvexCommandFailure(
  error: unknown,
  context: ConvexCommandContext,
): string;
export declare function formatConvexOutputFailure(context: ConvexCommandContext): string;
export declare function sanitizedConvexCommandError(
  error: unknown,
  context: ConvexCommandContext,
): Error & { category: ConvexFailureCategory; code: string };
