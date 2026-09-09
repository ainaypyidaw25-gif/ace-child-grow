import { describe, expect, it } from 'vitest';
import { isMmpayProductionConfigured, readMmpayConfig } from '../../../convex/lib/mmpayConfig';

const production = {
  MMPAY_ENV: 'production',
  MMPAY_PRODUCTION_APP_ID: 'app_live',
  MMPAY_PRODUCTION_PUBLISHABLE_KEY: 'pk_live_value',
  MMPAY_PRODUCTION_SECRET_KEY: 'sk_live_value',
  MMPAY_PRODUCTION_API_BASE_URL: 'https://payments.example.test/',
  MMPAY_WEBHOOK_URL: 'https://backend.example.test/mmpay/webhook',
};

describe('Myan Myan Pay production capability', () => {
  it('passes only a complete HTTPS production configuration', () => {
    expect(isMmpayProductionConfigured(production)).toBe(true);
    expect(readMmpayConfig(production)).toMatchObject({
      environment: 'production',
      apiBaseUrl: 'https://payments.example.test',
    });
  });

  it('fails closed for sandbox, missing, test-key, and non-HTTPS configurations', () => {
    expect(isMmpayProductionConfigured({ ...production, MMPAY_ENV: 'sandbox' })).toBe(false);
    expect(isMmpayProductionConfigured({ ...production, MMPAY_PRODUCTION_SECRET_KEY: undefined })).toBe(false);
    expect(isMmpayProductionConfigured({ ...production, MMPAY_PRODUCTION_SECRET_KEY: 'sk_test_value' })).toBe(false);
    expect(isMmpayProductionConfigured({ ...production, MMPAY_WEBHOOK_URL: 'http://backend.example.test' })).toBe(false);
  });
});
