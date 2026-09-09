export type MmpayEnvironment = 'sandbox' | 'production';

export type MmpayConfig = {
  environment: MmpayEnvironment;
  appId: string;
  publishableKey: string;
  secretKey: string;
  apiBaseUrl: string;
  webhookUrl: string;
};

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

function required(env: EnvironmentSource, name: string) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Myan Myan Pay is not configured: missing ${name}`);
  return value;
}

export function readMmpayConfig(env: EnvironmentSource = process.env): MmpayConfig {
  const environment = (env.MMPAY_ENV?.trim().toLowerCase() || 'sandbox') as MmpayEnvironment;
  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error('MMPAY_ENV must be sandbox or production');
  }
  const prefix = environment === 'sandbox' ? 'MMPAY_SANDBOX' : 'MMPAY_PRODUCTION';
  const config = {
    environment,
    appId: required(env, `${prefix}_APP_ID`),
    publishableKey: required(env, `${prefix}_PUBLISHABLE_KEY`),
    secretKey: required(env, `${prefix}_SECRET_KEY`),
    apiBaseUrl: required(env, `${prefix}_API_BASE_URL`).replace(/\/$/, ''),
    webhookUrl: required(env, 'MMPAY_WEBHOOK_URL'),
  };
  if (!/^https:\/\//i.test(config.apiBaseUrl)) throw new Error(`${prefix}_API_BASE_URL must use HTTPS`);
  if (!/^https:\/\//i.test(config.webhookUrl)) throw new Error('MMPAY_WEBHOOK_URL must use HTTPS');
  const looksSandbox = config.publishableKey.includes('_test_') || config.secretKey.includes('_test_');
  if (environment === 'sandbox' && !looksSandbox) throw new Error('Sandbox mode requires Myan Myan Pay test keys');
  if (environment === 'production' && looksSandbox) throw new Error('Production mode cannot use Myan Myan Pay test keys');
  return config;
}

export function isMmpayProductionConfigured(env: EnvironmentSource = process.env): boolean {
  try {
    return readMmpayConfig(env).environment === 'production';
  } catch {
    return false;
  }
}
