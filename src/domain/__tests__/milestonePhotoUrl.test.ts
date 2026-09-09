import { describe, expect, it } from 'vitest';
import {
  normalizeMilestoneBlobPreviewUrl,
  normalizeMilestoneStorageUrl,
} from '../milestonePhotoUrl';

describe('milestone photo URL policy', () => {
  it('normalizes the exact Production Convex storage URL shape', () => {
    expect(normalizeMilestoneStorageUrl(
      'https://graceful-possum-566.convex.cloud/api/storage/kg2abc_DEF-123',
    )).toBe('https://graceful-possum-566.convex.cloud/api/storage/kg2abc_DEF-123');
  });

  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'blob:https://child.acegroup.com.mm/local-preview',
    'http://graceful-possum-566.convex.cloud/api/storage/kg2abc',
    'https://graceful-possum-566.convex.site/api/storage/kg2abc',
    'https://other-deployment.convex.cloud/api/storage/kg2abc',
    'https://graceful-possum-566.convex.cloud.evil.example/api/storage/kg2abc',
    'https://user@graceful-possum-566.convex.cloud/api/storage/kg2abc',
    'https://graceful-possum-566.convex.cloud/api/storage/kg2abc?download=1',
    'https://graceful-possum-566.convex.cloud/api/storage/kg2abc#fragment',
    'https://graceful-possum-566.convex.cloud/api/storage/../admin',
    ' https://graceful-possum-566.convex.cloud/api/storage/kg2abc',
  ])('rejects an unexpected stored-photo URL: %s', (value) => {
    expect(normalizeMilestoneStorageUrl(value)).toBeNull();
  });

  it('preserves a locally created blob preview from the current app origin', () => {
    expect(normalizeMilestoneBlobPreviewUrl(
      'blob:https://child.acegroup.com.mm/550e8400-e29b-41d4-a716-446655440000',
      'https://child.acegroup.com.mm',
    )).toBe('blob:https://child.acegroup.com.mm/550e8400-e29b-41d4-a716-446655440000');
  });

  it.each([
    ['blob:https://ace-child-grow-git-feature.example.vercel.app/preview-key', 'https://ace-child-grow-git-feature.example.vercel.app'],
    ['blob:http://localhost:5173/preview-key', 'http://localhost:5173'],
    ['blob:http://127.0.0.1:4173/preview-key', 'http://127.0.0.1:4173'],
    ['blob:capacitor://localhost/550e8400-e29b-41d4-a716-446655440000', 'capacitor://localhost'],
    ['blob:null/550e8400-e29b-41d4-a716-446655440000', 'null'],
  ])('preserves an object URL created by a supported app origin: %s', (value, origin) => {
    expect(normalizeMilestoneBlobPreviewUrl(value, origin)).toBe(value);
  });

  it.each([
    ['blob:https://evil.example/550e8400-e29b-41d4-a716-446655440000', 'https://child.acegroup.com.mm'],
    ['blob:null/550e8400-e29b-41d4-a716-446655440000', 'https://child.acegroup.com.mm'],
    ['blob:javascript:alert(1)', 'https://child.acegroup.com.mm'],
    ['blob:https://child.acegroup.com.mm/key/with/slash', 'https://child.acegroup.com.mm'],
    ['blob:https://child.acegroup.com.mm/key?query=1', 'https://child.acegroup.com.mm'],
    ['blob:https://child.acegroup.com.mm/key', 'javascript:alert(1)'],
    ['blob:capacitor://evil.example/key', 'capacitor://evil.example'],
    ['blob:http://preview.example/key', 'http://preview.example'],
    ['blob:https://preview.example/key', 'http://localhost:5173'],
  ])('rejects a foreign or malformed blob preview: %s', (value, origin) => {
    expect(normalizeMilestoneBlobPreviewUrl(value, origin)).toBeNull();
  });
});
