export type PrintableMedia = {
  kind: string;
  placeholder?: boolean;
  reviewStatus?: string;
  url?: string | null;
  storageId?: unknown;
};

export function approvedPrintablePayload(media: readonly PrintableMedia[]): PrintableMedia | undefined {
  return media.find((asset) => (
    (asset.kind === 'pdf' || asset.kind === 'download')
    && asset.placeholder !== true
    && asset.reviewStatus === 'approved'
    && Boolean(asset.url || asset.storageId)
  ));
}
