export function needsEvidenceAttention(status: string, reviewOverdue: boolean): boolean {
  if (status === 'retired') return false;
  return status !== 'approved' || reviewOverdue;
}
