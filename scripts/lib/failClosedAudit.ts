export type ExitCodeTarget = { exitCode?: number };

/** Every audit drift is a process failure, even when the command is read-only. */
export function applyFailClosedAuditExit(
  allExact: boolean,
  target: ExitCodeTarget,
): void {
  if (!allExact) target.exitCode = 1;
}
